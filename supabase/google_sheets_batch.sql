-- =========================================================
-- MAJESTIC 2027
-- BACKFILL GOOGLE SHEETS EM LOTE
-- Evita timeout ao disparar dezenas de POSTs simultâneos.
-- =========================================================

create or replace function public.backfill_produtos_comerciais_google_lote()
returns bigint
language plpgsql
security definer
set search_path = public, extensions
as $$
declare
  cfg public.integracao_config%rowtype;
  payload jsonb;
  request_id bigint;
begin
  select * into cfg
  from public.integracao_config
  where id = 1;

  if cfg.ativo is distinct from true
     or coalesce(cfg.google_sheets_webhook_url,'') = ''
     or coalesce(cfg.google_sheets_token,'') = '' then
    raise exception 'Integração Google Sheets não configurada ou inativa';
  end if;

  select jsonb_build_object(
    'token', cfg.google_sheets_token,
    'actor', 'supabase-backfill',
    'events', coalesce(jsonb_agg(
      jsonb_build_object(
        'table', 'produtos',
        'operation', 'UPSERT',
        'record', to_jsonb(p),
        'old_record', '{}'::jsonb
      ) order by p.categoria, p.produto
    ), '[]'::jsonb)
  )
  into payload
  from public.produtos_comerciais p;

  select net.http_post(
    url := cfg.google_sheets_webhook_url,
    headers := jsonb_build_object('Content-Type','application/json'),
    body := payload,
    timeout_milliseconds := 30000
  )
  into request_id;

  return request_id;
end;
$$;

-- Verificação opcional:
-- select public.backfill_produtos_comerciais_google_lote();
