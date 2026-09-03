-- MAJESTIC 2027 — HARDENING DE SEGURANÇA
-- Objetivo: reduzir superfície de ataque dos apps Direção e Atendimento sem apagar dados.
-- NÃO contém DROP TABLE, DELETE de dados ou redefinição de valores comerciais.

begin;

-- 1) Funções centrais de autorização. SECURITY DEFINER evita recursão de RLS em profiles.
create or replace function public.majestic_usuario_ativo()
returns boolean
language sql
stable
security definer
set search_path = public, pg_temp
as $$
  select exists (
    select 1 from public.profiles p
    where p.id = auth.uid() and p.ativo = true
  );
$$;

create or replace function public.majestic_tem_role(roles text[])
returns boolean
language sql
stable
security definer
set search_path = public, pg_temp
as $$
  select exists (
    select 1 from public.profiles p
    where p.id = auth.uid()
      and p.ativo = true
      and p.role::text = any(roles)
  );
$$;

revoke all on function public.majestic_usuario_ativo() from public, anon;
revoke all on function public.majestic_tem_role(text[]) from public, anon;
grant execute on function public.majestic_usuario_ativo() to authenticated;
grant execute on function public.majestic_tem_role(text[]) to authenticated;

-- 2) Nenhuma tabela operacional crítica pode ser acessada pelo papel anon.
do $$
declare t text;
begin
  foreach t in array array[
    'profiles','gestao_clientes','gestao_atendimentos','autorizacoes_gestao','atendentes',
    'produtos_comerciais','mensalidades_config_2027','alunos','matriculas_academicas',
    'log_auditoria','integracao_config'
  ] loop
    if to_regclass('public.'||t) is not null then
      execute format('revoke all privileges on table public.%I from anon', t);
      execute format('alter table public.%I enable row level security', t);
    end if;
  end loop;
end $$;

-- Utilitário: remove políticas antigas SOMENTE das tabelas que serão redefinidas abaixo.
create or replace function pg_temp.drop_policies(p_table text)
returns void language plpgsql as $$
declare r record;
begin
  for r in select policyname from pg_policies where schemaname='public' and tablename=p_table loop
    execute format('drop policy if exists %I on public.%I', r.policyname, p_table);
  end loop;
end $$;

-- 3) PROFILES: usuário lê o próprio perfil; Direção lê/atualiza todos.
do $$ begin
if to_regclass('public.profiles') is not null then
  perform pg_temp.drop_policies('profiles');
  execute $p$create policy profiles_select_seguro on public.profiles for select to authenticated
    using (id=auth.uid() or public.majestic_tem_role(array['direcao']))$p$;
  execute $p$create policy profiles_update_direcao on public.profiles for update to authenticated
    using (public.majestic_tem_role(array['direcao']))
    with check (public.majestic_tem_role(array['direcao']))$p$;
end if; end $$;

-- 4) CRM: somente Direção/Gestão/Matrícula ativos.
do $$ begin
if to_regclass('public.gestao_clientes') is not null then
  perform pg_temp.drop_policies('gestao_clientes');
  execute $p$create policy clientes_select_staff on public.gestao_clientes for select to authenticated
    using (public.majestic_tem_role(array['direcao','gestao','matricula']))$p$;
  execute $p$create policy clientes_insert_staff on public.gestao_clientes for insert to authenticated
    with check (public.majestic_tem_role(array['direcao','gestao','matricula']))$p$;
  execute $p$create policy clientes_update_staff on public.gestao_clientes for update to authenticated
    using (public.majestic_tem_role(array['direcao','gestao','matricula']))
    with check (public.majestic_tem_role(array['direcao','gestao','matricula']))$p$;
  execute $p$create policy clientes_delete_direcao on public.gestao_clientes for delete to authenticated
    using (public.majestic_tem_role(array['direcao']))$p$;
end if;
if to_regclass('public.gestao_atendimentos') is not null then
  perform pg_temp.drop_policies('gestao_atendimentos');
  execute $p$create policy atendimentos_select_staff on public.gestao_atendimentos for select to authenticated
    using (public.majestic_tem_role(array['direcao','gestao','matricula']))$p$;
  execute $p$create policy atendimentos_insert_staff on public.gestao_atendimentos for insert to authenticated
    with check (public.majestic_tem_role(array['direcao','gestao','matricula']))$p$;
  execute $p$create policy atendimentos_update_staff on public.gestao_atendimentos for update to authenticated
    using (public.majestic_tem_role(array['direcao','gestao','matricula']))
    with check (public.majestic_tem_role(array['direcao','gestao','matricula']))$p$;
  execute $p$create policy atendimentos_delete_direcao on public.gestao_atendimentos for delete to authenticated
    using (public.majestic_tem_role(array['direcao']))$p$;
end if; end $$;

-- 5) Valores oficiais: equipe lê, só Direção escreve.
do $$ begin
if to_regclass('public.produtos_comerciais') is not null then
  perform pg_temp.drop_policies('produtos_comerciais');
  execute $p$create policy produtos_select_staff on public.produtos_comerciais for select to authenticated
    using (public.majestic_tem_role(array['direcao','gestao','matricula']))$p$;
  execute $p$create policy produtos_write_direcao on public.produtos_comerciais for all to authenticated
    using (public.majestic_tem_role(array['direcao']))
    with check (public.majestic_tem_role(array['direcao']))$p$;
end if;
if to_regclass('public.mensalidades_config_2027') is not null then
  perform pg_temp.drop_policies('mensalidades_config_2027');
  execute $p$create policy mensalidades_select_staff on public.mensalidades_config_2027 for select to authenticated
    using (public.majestic_tem_role(array['direcao','gestao','matricula']))$p$;
  execute $p$create policy mensalidades_write_direcao on public.mensalidades_config_2027 for all to authenticated
    using (public.majestic_tem_role(array['direcao']))
    with check (public.majestic_tem_role(array['direcao']))$p$;
end if; end $$;

-- 6) Atendentes: equipe lê; Direção administra.
do $$ begin
if to_regclass('public.atendentes') is not null then
  perform pg_temp.drop_policies('atendentes');
  execute $p$create policy atendentes_select_staff on public.atendentes for select to authenticated
    using (public.majestic_tem_role(array['direcao','gestao','matricula']))$p$;
  execute $p$create policy atendentes_write_direcao on public.atendentes for all to authenticated
    using (public.majestic_tem_role(array['direcao']))
    with check (public.majestic_tem_role(array['direcao']))$p$;
end if; end $$;

-- 7) Base acadêmica: equipe autorizada lê/escreve; exclusão física somente Direção.
do $$ begin
if to_regclass('public.alunos') is not null then
  perform pg_temp.drop_policies('alunos');
  execute $p$create policy alunos_select_staff on public.alunos for select to authenticated
    using (public.majestic_tem_role(array['direcao','gestao','matricula']))$p$;
  execute $p$create policy alunos_insert_staff on public.alunos for insert to authenticated
    with check (public.majestic_tem_role(array['direcao','gestao','matricula']))$p$;
  execute $p$create policy alunos_update_staff on public.alunos for update to authenticated
    using (public.majestic_tem_role(array['direcao','gestao','matricula']))
    with check (public.majestic_tem_role(array['direcao','gestao','matricula']))$p$;
  execute $p$create policy alunos_delete_direcao on public.alunos for delete to authenticated
    using (public.majestic_tem_role(array['direcao']))$p$;
end if;
if to_regclass('public.matriculas_academicas') is not null then
  perform pg_temp.drop_policies('matriculas_academicas');
  execute $p$create policy matriculas_select_staff on public.matriculas_academicas for select to authenticated
    using (public.majestic_tem_role(array['direcao','gestao','matricula']))$p$;
  execute $p$create policy matriculas_insert_staff on public.matriculas_academicas for insert to authenticated
    with check (public.majestic_tem_role(array['direcao','gestao','matricula']))$p$;
  execute $p$create policy matriculas_update_staff on public.matriculas_academicas for update to authenticated
    using (public.majestic_tem_role(array['direcao','gestao','matricula']))
    with check (public.majestic_tem_role(array['direcao','gestao','matricula']))$p$;
  execute $p$create policy matriculas_delete_direcao on public.matriculas_academicas for delete to authenticated
    using (public.majestic_tem_role(array['direcao']))$p$;
end if; end $$;

-- 8) Autorizações: bloqueia escalada de privilégio via chamada REST direta.
create or replace function public.tg_proteger_decisao_autorizacao()
returns trigger
language plpgsql
security definer
set search_path = public, pg_temp
as $$
begin
  if public.majestic_tem_role(array['direcao']) then
    return new;
  end if;

  if not public.majestic_tem_role(array['gestao','matricula']) then
    raise exception 'Acesso não autorizado';
  end if;

  if tg_op='INSERT' then
    if coalesce(new.status,'aguardando') <> 'aguardando' then
      raise exception 'A equipe só pode criar pedidos aguardando decisão';
    end if;
    return new;
  end if;

  -- Equipe nunca pode autorizar/negar nem alterar campos exclusivos da Direção.
  if new.valor_autorizado is distinct from old.valor_autorizado
     or new.observacao_direcao is distinct from old.observacao_direcao
     or new.autorizado_at is distinct from old.autorizado_at then
    raise exception 'Campos exclusivos da Direção';
  end if;

  -- A única mudança de status privilegiada permitida à equipe é autorizado -> concluido.
  if new.status is distinct from old.status then
    if not (old.status='autorizado' and new.status='concluido') then
      raise exception 'A equipe não pode alterar esta decisão';
    end if;
  end if;
  return new;
end;
$$;
revoke all on function public.tg_proteger_decisao_autorizacao() from public, anon, authenticated;

-- Instala somente quando a tabela e as colunas esperadas existem.
do $$ begin
if to_regclass('public.autorizacoes_gestao') is not null then
  perform pg_temp.drop_policies('autorizacoes_gestao');
  execute $p$create policy autorizacoes_select_staff on public.autorizacoes_gestao for select to authenticated
    using (public.majestic_tem_role(array['direcao','gestao','matricula']))$p$;
  execute $p$create policy autorizacoes_insert_staff on public.autorizacoes_gestao for insert to authenticated
    with check (public.majestic_tem_role(array['direcao','gestao','matricula']))$p$;
  execute $p$create policy autorizacoes_update_staff on public.autorizacoes_gestao for update to authenticated
    using (public.majestic_tem_role(array['direcao','gestao','matricula']))
    with check (public.majestic_tem_role(array['direcao','gestao','matricula']))$p$;
  execute $p$create policy autorizacoes_delete_direcao on public.autorizacoes_gestao for delete to authenticated
    using (public.majestic_tem_role(array['direcao']))$p$;

  if exists(select 1 from information_schema.columns where table_schema='public' and table_name='autorizacoes_gestao' and column_name='valor_autorizado')
     and exists(select 1 from information_schema.columns where table_schema='public' and table_name='autorizacoes_gestao' and column_name='observacao_direcao')
     and exists(select 1 from information_schema.columns where table_schema='public' and table_name='autorizacoes_gestao' and column_name='autorizado_at') then
    execute 'drop trigger if exists trg_proteger_decisao_autorizacao on public.autorizacoes_gestao';
    execute 'create trigger trg_proteger_decisao_autorizacao before insert or update on public.autorizacoes_gestao for each row execute function public.tg_proteger_decisao_autorizacao()';
  end if;
end if; end $$;

-- 9) Configuração de integração e auditoria: somente Direção lê; sem acesso anon.
do $$ begin
if to_regclass('public.integracao_config') is not null then
  perform pg_temp.drop_policies('integracao_config');
  execute $p$create policy integracao_config_direcao on public.integracao_config for all to authenticated
    using (public.majestic_tem_role(array['direcao']))
    with check (public.majestic_tem_role(array['direcao']))$p$;
end if;
if to_regclass('public.log_auditoria') is not null then
  perform pg_temp.drop_policies('log_auditoria');
  execute $p$create policy log_auditoria_select_direcao on public.log_auditoria for select to authenticated
    using (public.majestic_tem_role(array['direcao']))$p$;
end if; end $$;

commit;

-- 10) RELATÓRIO DE AUDITORIA — estes SELECTs não alteram dados.
select n.nspname as schema, c.relname as tabela, c.relrowsecurity as rls_ativo
from pg_class c join pg_namespace n on n.oid=c.relnamespace
where n.nspname='public'
  and c.relname in ('profiles','gestao_clientes','gestao_atendimentos','autorizacoes_gestao','atendentes','produtos_comerciais','mensalidades_config_2027','alunos','matriculas_academicas','log_auditoria','integracao_config')
order by c.relname;

select tablename, policyname, cmd, roles, qual, with_check
from pg_policies
where schemaname='public'
  and tablename in ('profiles','gestao_clientes','gestao_atendimentos','autorizacoes_gestao','atendentes','produtos_comerciais','mensalidades_config_2027','alunos','matriculas_academicas','log_auditoria','integracao_config')
order by tablename, policyname;

select table_name, privilege_type
from information_schema.role_table_grants
where table_schema='public' and grantee='anon'
  and table_name in ('profiles','gestao_clientes','gestao_atendimentos','autorizacoes_gestao','atendentes','produtos_comerciais','mensalidades_config_2027','alunos','matriculas_academicas','log_auditoria','integracao_config')
order by table_name, privilege_type;

select 'HARDENING DE SEGURANCA MAJESTIC 2027 APLICADO' as status;
