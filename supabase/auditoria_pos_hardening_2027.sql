-- MAJESTIC 2027 — AUDITORIA PÓS-HARDENING
-- Somente leitura/testes de autorização. NÃO altera dados de negócio.
-- Valida RLS, grants, políticas, funções, Realtime e simula leitura com perfis reais ativos.

begin;

-- 1) RLS das tabelas críticas: todas devem retornar true.
select c.relname as tabela,
       c.relrowsecurity as rls_ativo,
       c.relforcerowsecurity as force_rls
from pg_class c
join pg_namespace n on n.oid=c.relnamespace
where n.nspname='public'
  and c.relkind='r'
  and c.relname in (
    'profiles','gestao_clientes','gestao_atendimentos','autorizacoes_gestao','atendentes',
    'produtos_comerciais','mensalidades_config_2027','alunos','matriculas_academicas',
    'log_auditoria','integracao_config'
  )
order by c.relname;

-- 2) ANON: deve retornar ZERO linhas.
select table_name, privilege_type
from information_schema.role_table_grants
where table_schema='public'
  and grantee='anon'
  and table_name in (
    'profiles','gestao_clientes','gestao_atendimentos','autorizacoes_gestao','atendentes',
    'produtos_comerciais','mensalidades_config_2027','alunos','matriculas_academicas',
    'log_auditoria','integracao_config'
  )
order by table_name, privilege_type;

-- 3) Políticas instaladas.
select tablename, policyname, cmd, roles, qual, with_check
from pg_policies
where schemaname='public'
  and tablename in (
    'profiles','gestao_clientes','gestao_atendimentos','autorizacoes_gestao','atendentes',
    'produtos_comerciais','mensalidades_config_2027','alunos','matriculas_academicas',
    'log_auditoria','integracao_config'
  )
order by tablename, cmd, policyname;

-- 4) Funções SECURITY DEFINER críticas e search_path.
select p.proname as funcao,
       p.prosecdef as security_definer,
       coalesce(array_to_string(p.proconfig, ', '),'') as configuracao
from pg_proc p
join pg_namespace n on n.oid=p.pronamespace
where n.nspname='public'
  and p.proname in ('majestic_usuario_ativo','majestic_tem_role','tg_proteger_decisao_autorizacao')
order by p.proname;

-- 5) Trigger anti-escalada de autorização: deve existir e estar habilitado.
select event_object_table as tabela,
       trigger_name,
       event_manipulation as evento,
       action_timing
from information_schema.triggers
where trigger_schema='public'
  and trigger_name='trg_proteger_decisao_autorizacao'
order by event_manipulation;

-- 6) Realtime comercial: produtos e mensalidades devem estar na publicação quando existirem.
select schemaname, tablename
from pg_publication_tables
where pubname='supabase_realtime'
  and schemaname='public'
  and tablename in ('produtos_comerciais','mensalidades_config_2027')
order by tablename;

-- 7) Diagnóstico de perfis ativos por role (sem expor e-mail/senha).
select role::text as role, count(*) as usuarios_ativos
from public.profiles
where ativo=true
group by role::text
order by role::text;

-- 8) Simulação RLS SOMENTE LEITURA.
-- Usa um perfil ativo de cada papel; não grava, atualiza nem apaga registros.
create or replace function pg_temp.testar_leitura_role(p_role text)
returns table(recurso text, leitura_permitida boolean, detalhe text)
language plpgsql
as $$
declare
  v_uid uuid;
  v_count bigint;
begin
  select id into v_uid
  from public.profiles
  where ativo=true and role::text=p_role
  order by id
  limit 1;

  if v_uid is null then
    return query select 'perfil_'||p_role, false, 'SEM USUARIO ATIVO PARA TESTE';
    return;
  end if;

  perform set_config('request.jwt.claim.sub', v_uid::text, true);
  perform set_config('request.jwt.claim.role', 'authenticated', true);

  execute 'set local role authenticated';

  begin
    execute 'select count(*) from public.produtos_comerciais' into v_count;
    return query select 'produtos_comerciais', true, 'linhas_visiveis='||v_count;
  exception when others then
    return query select 'produtos_comerciais', false, sqlstate||':'||sqlerrm;
  end;

  if to_regclass('public.mensalidades_config_2027') is not null then
    begin
      execute 'select count(*) from public.mensalidades_config_2027' into v_count;
      return query select 'mensalidades_config_2027', true, 'linhas_visiveis='||v_count;
    exception when others then
      return query select 'mensalidades_config_2027', false, sqlstate||':'||sqlerrm;
    end;
  end if;

  begin
    execute 'select count(*) from public.gestao_clientes' into v_count;
    return query select 'gestao_clientes', true, 'linhas_visiveis='||v_count;
  exception when others then
    return query select 'gestao_clientes', false, sqlstate||':'||sqlerrm;
  end;

  if to_regclass('public.log_auditoria') is not null then
    begin
      execute 'select count(*) from public.log_auditoria' into v_count;
      return query select 'log_auditoria', true, 'linhas_visiveis='||v_count;
    exception when others then
      return query select 'log_auditoria', false, sqlstate||':'||sqlerrm;
    end;
  end if;

  if to_regclass('public.integracao_config') is not null then
    begin
      execute 'select count(*) from public.integracao_config' into v_count;
      return query select 'integracao_config', true, 'linhas_visiveis='||v_count;
    exception when others then
      return query select 'integracao_config', false, sqlstate||':'||sqlerrm;
    end;
  end if;

  execute 'reset role';
end;
$$;

-- Direção: deve ler todos os recursos abaixo.
select 'DIRECAO' as teste, * from pg_temp.testar_leitura_role('direcao');
reset role;

-- Gestão: deve ler comercial + CRM, mas NÃO auditoria/configuração.
select 'GESTAO' as teste, * from pg_temp.testar_leitura_role('gestao');
reset role;

-- Matrícula, se houver usuário ativo: mesma regra operacional da equipe.
select 'MATRICULA' as teste, * from pg_temp.testar_leitura_role('matricula');
reset role;

rollback;

select 'AUDITORIA POS-HARDENING CONCLUIDA — NENHUM DADO DE NEGOCIO FOI ALTERADO' as status;
