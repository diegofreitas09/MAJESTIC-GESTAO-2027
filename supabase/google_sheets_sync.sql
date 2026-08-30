-- MAJESTIC 2027 — ESPELHO SUPABASE -> GOOGLE SHEETS
-- Pré-requisito: publicar o Apps Script integrations/google-sheets/Code.gs como Web App.
-- Depois, substitua WEB_APP_URL e TOKEN_FORTE abaixo e execute este arquivo uma vez.

create extension if not exists pg_net with schema extensions;

create table if not exists public.integracao_config (
  id integer primary key default 1 check (id = 1),
  google_sheets_webhook_url text,
  google_sheets_token text,
  ativo boolean not null default false,
  updated_at timestamptz not null default now()
);

alter table public.integracao_config enable row level security;

drop policy if exists integracao_config_direcao_select on public.integracao_config;
create policy integracao_config_direcao_select on public.integracao_config
for select to authenticated
using (public.is_role(array['direcao']::public.user_role[]));

drop policy if exists integracao_config_direcao_update on public.integracao_config;
create policy integracao_config_direcao_update on public.integracao_config
for all to authenticated
using (public.is_role(array['direcao']::public.user_role[]))
with check (public.is_role(array['direcao']::public.user_role[]));

insert into public.integracao_config (id, google_sheets_webhook_url, google_sheets_token, ativo)
values (1, 'WEB_APP_URL', 'TOKEN_FORTE', false)
on conflict (id) do nothing;

create or replace function public.enviar_google_sheets(
  p_tabela text,
  p_operacao text,
  p_registro jsonb,
  p_registro_antigo jsonb default '{}'::jsonb,
  p_actor text default 'supabase'
)
returns void
language plpgsql
security definer
set search_path = public, extensions
as $$
declare
  cfg public.integracao_config%rowtype;
begin
  select * into cfg from public.integracao_config where id = 1;
  if cfg.ativo is distinct from true or coalesce(cfg.google_sheets_webhook_url,'') = '' then
    return;
  end if;

  perform net.http_post(
    url := cfg.google_sheets_webhook_url,
    headers := jsonb_build_object('Content-Type','application/json'),
    body := jsonb_build_object(
      'token', cfg.google_sheets_token,
      'table', p_tabela,
      'operation', upper(p_operacao),
      'record', coalesce(p_registro,'{}'::jsonb),
      'old_record', coalesce(p_registro_antigo,'{}'::jsonb),
      'actor', p_actor,
      'sent_at', now()
    )
  );
end;
$$;

create or replace function public.tg_google_sheets_mirror()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if tg_op = 'DELETE' then
    perform public.enviar_google_sheets(tg_table_name, tg_op, '{}'::jsonb, to_jsonb(old));
    return old;
  else
    perform public.enviar_google_sheets(tg_table_name, tg_op, to_jsonb(new), case when tg_op='UPDATE' then to_jsonb(old) else '{}'::jsonb end);
    return new;
  end if;
end;
$$;

-- Triggers idempotentes nas tabelas principais.
drop trigger if exists trg_google_profiles on public.profiles;
create trigger trg_google_profiles after insert or update or delete on public.profiles
for each row execute function public.tg_google_sheets_mirror();

drop trigger if exists trg_google_clientes on public.gestao_clientes;
create trigger trg_google_clientes after insert or update or delete on public.gestao_clientes
for each row execute function public.tg_google_sheets_mirror();

drop trigger if exists trg_google_atendimentos on public.gestao_atendimentos;
create trigger trg_google_atendimentos after insert or update or delete on public.gestao_atendimentos
for each row execute function public.tg_google_sheets_mirror();

drop trigger if exists trg_google_autorizacoes on public.autorizacoes_gestao;
create trigger trg_google_autorizacoes after insert or update or delete on public.autorizacoes_gestao
for each row execute function public.tg_google_sheets_mirror();

-- Produtos é opcional em instalações antigas.
do $$
begin
  if to_regclass('public.produtos') is not null then
    execute 'drop trigger if exists trg_google_produtos on public.produtos';
    execute 'create trigger trg_google_produtos after insert or update or delete on public.produtos for each row execute function public.tg_google_sheets_mirror()';
  end if;
end $$;

-- Carga inicial para copiar o que já existe no Supabase.
create or replace function public.backfill_google_sheets()
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  r record;
  total integer := 0;
begin
  for r in select to_jsonb(p.*) j from public.profiles p loop
    perform public.enviar_google_sheets('profiles','INSERT',r.j); total := total + 1;
  end loop;
  for r in select to_jsonb(c.*) j from public.gestao_clientes c loop
    perform public.enviar_google_sheets('gestao_clientes','INSERT',r.j); total := total + 1;
  end loop;
  for r in select to_jsonb(a.*) j from public.gestao_atendimentos a loop
    perform public.enviar_google_sheets('gestao_atendimentos','INSERT',r.j); total := total + 1;
  end loop;
  for r in select to_jsonb(g.*) j from public.autorizacoes_gestao g loop
    perform public.enviar_google_sheets('autorizacoes_gestao','INSERT',r.j); total := total + 1;
  end loop;
  if to_regclass('public.produtos') is not null then
    for r in execute 'select to_jsonb(p.*) j from public.produtos p' loop
      perform public.enviar_google_sheets('produtos','INSERT',r.j); total := total + 1;
    end loop;
  end if;
  return jsonb_build_object('ok',true,'enfileirados',total,'observacao','pg_net envia de forma assíncrona');
end;
$$;

-- ATIVAÇÃO (execute só após publicar o Apps Script):
-- update public.integracao_config
-- set google_sheets_webhook_url='https://script.google.com/macros/s/SEU_DEPLOY/exec',
--     google_sheets_token='SEU_TOKEN_FORTE', ativo=true, updated_at=now()
-- where id=1;
--
-- select public.backfill_google_sheets();
