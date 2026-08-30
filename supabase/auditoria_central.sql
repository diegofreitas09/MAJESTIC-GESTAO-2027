-- =========================================================
-- MAJESTIC 2027 — AUDITORIA CENTRAL
-- Fonte oficial: Supabase | Espelho: Google Sheets
-- Seguro para reexecutar.
-- =========================================================

create table if not exists public.auditoria_eventos (
  id_evento uuid primary key default gen_random_uuid(),
  timestamp timestamptz not null default now(),
  usuario_id uuid null,
  usuario_nome text,
  role text,
  acao text not null,
  modulo text,
  entidade text not null,
  entidade_id text,
  valor_anterior jsonb not null default '{}'::jsonb,
  valor_novo jsonb not null default '{}'::jsonb,
  ip_origem text,
  user_agent text,
  resultado text not null default 'OK',
  erro text,
  origem_app text not null default 'Supabase',
  created_at timestamptz not null default now()
);

create index if not exists auditoria_eventos_timestamp_idx
  on public.auditoria_eventos (timestamp desc);

create index if not exists auditoria_eventos_usuario_idx
  on public.auditoria_eventos (usuario_id, timestamp desc);

create index if not exists auditoria_eventos_entidade_idx
  on public.auditoria_eventos (entidade, entidade_id, timestamp desc);

alter table public.auditoria_eventos enable row level security;

drop policy if exists auditoria_direcao_select on public.auditoria_eventos;
create policy auditoria_direcao_select
on public.auditoria_eventos
for select
to authenticated
using (
  public.is_role(array['direcao']::public.user_role[])
);

-- Nenhum usuário grava diretamente nesta tabela pelo frontend.
-- A gravação ocorre somente pela função SECURITY DEFINER abaixo.
revoke insert, update, delete on public.auditoria_eventos from authenticated;
grant select on public.auditoria_eventos to authenticated;

-- =========================================================
-- FUNÇÃO GENÉRICA DE AUDITORIA
-- Não bloqueia a operação principal se a auditoria falhar.
-- =========================================================

create or replace function public.tg_registrar_auditoria()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_uid uuid := auth.uid();
  v_nome text;
  v_role text;
  v_headers jsonb := '{}'::jsonb;
  v_ip text;
  v_ua text;
  v_old jsonb := '{}'::jsonb;
  v_new jsonb := '{}'::jsonb;
  v_id text;
  v_acao text;
  v_modulo text;
  v_origem_app text;
begin
  if tg_op = 'INSERT' then
    v_new := to_jsonb(new);
    v_acao := 'CRIOU';
  elsif tg_op = 'UPDATE' then
    v_old := to_jsonb(old);
    v_new := to_jsonb(new);
    v_acao := 'ALTEROU';
  elsif tg_op = 'DELETE' then
    v_old := to_jsonb(old);
    v_acao := 'EXCLUIU';
  end if;

  v_id := coalesce(v_new->>'id', v_old->>'id', v_new->>'id_evento', v_old->>'id_evento');

  if v_uid is not null then
    select p.nome, p.role::text
      into v_nome, v_role
    from public.profiles p
    where p.id = v_uid;
  end if;

  -- Fallbacks úteis para operações internas/servidor.
  v_nome := coalesce(
    v_nome,
    v_new->>'funcionario_nome',
    v_old->>'funcionario_nome',
    v_new->>'solicitado_por_nome',
    v_old->>'solicitado_por_nome',
    case when v_uid is null then 'Sistema' else null end
  );

  v_role := coalesce(
    v_role,
    case
      when coalesce(v_new->>'funcionario_nome', v_old->>'funcionario_nome') is not null then 'gestao'
      when v_uid is null then 'sistema'
      else null
    end
  );

  begin
    v_headers := nullif(current_setting('request.headers', true), '')::jsonb;
  exception when others then
    v_headers := '{}'::jsonb;
  end;

  v_ip := coalesce(
    v_headers->>'cf-connecting-ip',
    v_headers->>'x-forwarded-for',
    v_headers->>'x-real-ip'
  );
  v_ua := v_headers->>'user-agent';

  v_modulo := case tg_table_name
    when 'profiles' then 'Funcionários e Acessos'
    when 'gestao_clientes' then 'Clientes / Famílias'
    when 'gestao_atendimentos' then 'Atendimentos'
    when 'autorizacoes_gestao' then 'Autorizações da Direção'
    when 'produtos_comerciais' then 'Produtos e Valores'
    else tg_table_name
  end;

  v_origem_app := case tg_table_name
    when 'profiles' then 'Administração'
    when 'gestao_clientes' then 'Majestic Atendimento'
    when 'gestao_atendimentos' then 'Majestic Atendimento'
    when 'autorizacoes_gestao' then 'Majestic Gestão / Direção'
    when 'produtos_comerciais' then 'Majestic Direção'
    else 'Majestic 2027'
  end;

  insert into public.auditoria_eventos (
    usuario_id,
    usuario_nome,
    role,
    acao,
    modulo,
    entidade,
    entidade_id,
    valor_anterior,
    valor_novo,
    ip_origem,
    user_agent,
    resultado,
    erro,
    origem_app
  ) values (
    v_uid,
    coalesce(v_nome, 'Sistema'),
    coalesce(v_role, 'sistema'),
    v_acao,
    v_modulo,
    tg_table_name,
    v_id,
    coalesce(v_old, '{}'::jsonb),
    coalesce(v_new, '{}'::jsonb),
    v_ip,
    v_ua,
    'OK',
    null,
    v_origem_app
  );

  if tg_op = 'DELETE' then
    return old;
  end if;
  return new;

exception when others then
  -- Auditoria nunca derruba a operação comercial principal.
  if tg_op = 'DELETE' then
    return old;
  end if;
  return new;
end;
$$;

-- =========================================================
-- TRIGGERS NAS TABELAS-CHAVE
-- =========================================================

drop trigger if exists trg_auditoria_profiles on public.profiles;
create trigger trg_auditoria_profiles
after insert or update or delete on public.profiles
for each row execute function public.tg_registrar_auditoria();

drop trigger if exists trg_auditoria_clientes on public.gestao_clientes;
create trigger trg_auditoria_clientes
after insert or update or delete on public.gestao_clientes
for each row execute function public.tg_registrar_auditoria();

drop trigger if exists trg_auditoria_atendimentos on public.gestao_atendimentos;
create trigger trg_auditoria_atendimentos
after insert or update or delete on public.gestao_atendimentos
for each row execute function public.tg_registrar_auditoria();

drop trigger if exists trg_auditoria_autorizacoes on public.autorizacoes_gestao;
create trigger trg_auditoria_autorizacoes
after insert or update or delete on public.autorizacoes_gestao
for each row execute function public.tg_registrar_auditoria();

drop trigger if exists trg_auditoria_produtos on public.produtos_comerciais;
create trigger trg_auditoria_produtos
after insert or update or delete on public.produtos_comerciais
for each row execute function public.tg_registrar_auditoria();

-- =========================================================
-- ESPELHO DA AUDITORIA NO GOOGLE SHEETS
-- =========================================================

create or replace function public.tg_google_auditoria()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if to_regprocedure('public.enviar_google_sheets(text,text,jsonb,jsonb,text)') is not null then
    perform public.enviar_google_sheets(
      'auditoria_eventos',
      'INSERT',
      to_jsonb(new),
      '{}'::jsonb,
      coalesce(new.usuario_nome, 'Sistema')
    );
  end if;
  return new;
end;
$$;

drop trigger if exists trg_google_auditoria on public.auditoria_eventos;
create trigger trg_google_auditoria
after insert on public.auditoria_eventos
for each row execute function public.tg_google_auditoria();

-- =========================================================
-- TESTE CONTROLADO
-- Gera um evento de auditoria sem alterar dados comerciais.
-- =========================================================

create or replace function public.teste_auditoria_majestic()
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_id uuid := gen_random_uuid();
  v_uid uuid := auth.uid();
  v_nome text;
  v_role text;
begin
  if v_uid is not null then
    select nome, role::text into v_nome, v_role
    from public.profiles where id = v_uid;
  end if;

  insert into public.auditoria_eventos (
    id_evento, usuario_id, usuario_nome, role, acao, modulo,
    entidade, entidade_id, valor_anterior, valor_novo,
    resultado, origem_app
  ) values (
    v_id, v_uid, coalesce(v_nome, 'SQL Editor'), coalesce(v_role, 'sistema'),
    'TESTE', 'Auditoria', 'teste_auditoria', v_id::text,
    '{}'::jsonb, jsonb_build_object('mensagem','Auditoria Majestic operacional'),
    'OK', 'Supabase SQL Editor'
  );

  return v_id;
end;
$$;

select count(*) as eventos_auditoria from public.auditoria_eventos;
