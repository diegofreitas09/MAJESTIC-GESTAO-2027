-- =========================================================
-- MAJESTIC 2027 — PONTE AUDITORIA -> GOOGLE SHEETS
-- Fonte oficial: public.log_auditoria
-- Destino: aba LOG_AUDITORIA via Apps Script
-- Seguro para reexecutar.
-- =========================================================

create or replace function public.tg_google_log_auditoria()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_payload jsonb;
begin
  if to_regprocedure('public.enviar_google_sheets(text,text,jsonb,jsonb,text)') is null then
    return new;
  end if;

  v_payload := jsonb_build_object(
    'id_evento', new.id,
    'timestamp', new.ocorrido_em,
    'usuario_id', new.usuario_id,
    'usuario_nome', new.usuario_nome,
    'role', new.usuario_perfil,
    'acao', new.acao,
    'modulo', new.modulo,
    'entidade', new.entidade,
    'entidade_id', new.registro_id,
    'valor_anterior', coalesce(new.dados_anteriores, '{}'::jsonb),
    'valor_novo', coalesce(new.dados_novos, '{}'::jsonb),
    'ip_origem', new.ip,
    'user_agent', new.navegador,
    'resultado', new.resultado,
    'erro', null,
    'origem_app', new.origem
  );

  perform public.enviar_google_sheets(
    'auditoria_eventos',
    'INSERT',
    v_payload,
    '{}'::jsonb,
    coalesce(new.usuario_nome, 'Sistema')
  );

  return new;
exception when others then
  -- O espelho no Drive nunca pode derrubar a operação principal.
  return new;
end;
$$;

drop trigger if exists trg_google_log_auditoria on public.log_auditoria;
create trigger trg_google_log_auditoria
after insert on public.log_auditoria
for each row execute function public.tg_google_log_auditoria();

-- Backfill controlado do histórico já existente.
create or replace function public.backfill_log_auditoria_google()
returns integer
language plpgsql
security definer
set search_path = public
as $$
declare
  r public.log_auditoria%rowtype;
  total integer := 0;
  v_payload jsonb;
begin
  for r in
    select *
    from public.log_auditoria
    order by ocorrido_em asc
  loop
    v_payload := jsonb_build_object(
      'id_evento', r.id,
      'timestamp', r.ocorrido_em,
      'usuario_id', r.usuario_id,
      'usuario_nome', r.usuario_nome,
      'role', r.usuario_perfil,
      'acao', r.acao,
      'modulo', r.modulo,
      'entidade', r.entidade,
      'entidade_id', r.registro_id,
      'valor_anterior', coalesce(r.dados_anteriores, '{}'::jsonb),
      'valor_novo', coalesce(r.dados_novos, '{}'::jsonb),
      'ip_origem', r.ip,
      'user_agent', r.navegador,
      'resultado', r.resultado,
      'erro', null,
      'origem_app', r.origem
    );

    perform public.enviar_google_sheets(
      'auditoria_eventos',
      'UPSERT',
      v_payload,
      '{}'::jsonb,
      coalesce(r.usuario_nome, 'Sistema')
    );

    total := total + 1;
  end loop;

  return total;
end;
$$;

select 'PONTE AUDITORIA GOOGLE CRIADA' as status;
