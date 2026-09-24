-- MAJESTIC 2027 — REGISTRO DOS HOTFIXES DE SEGURANÇA
-- Data: 2026-09-24
-- Baseline de produção: main @ d70585645935067b3e0e2c87a64cbcbad479bb8a
-- ATENÇÃO: as migrações abaixo já foram aplicadas no projeto Supabase de produção
-- durante a auditoria. Este arquivo registra o estado esperado e não deve ser
-- executado cegamente em ambientes já corrigidos.

-- 1) security_hotfix_lock_google_bridge_rpc
revoke all on function public.enviar_google_sheets(text,text,jsonb,jsonb,text)
from public, anon, authenticated;
grant execute on function public.enviar_google_sheets(text,text,jsonb,jsonb,text)
to service_role;

-- 2) security_hotfix_views_invoker
alter view public.vw_atendimentos_por_equipe set (security_invoker = true);
alter view public.vw_resumo_executivo set (security_invoker = true);
revoke all on table public.vw_atendimentos_por_equipe from public, anon, authenticated;
revoke all on table public.vw_resumo_executivo from public, anon, authenticated;
grant select on table public.vw_atendimentos_por_equipe to authenticated;
grant select on table public.vw_resumo_executivo to authenticated;

-- 3) security_hotfix_majestic_function_acl
revoke all on function public.is_direcao() from public, anon;
grant execute on function public.is_direcao() to authenticated;
revoke all on function public.is_role(public.user_role[]) from public, anon;
grant execute on function public.is_role(public.user_role[]) to authenticated;
revoke all on function public.is_staff() from public, anon;
grant execute on function public.is_staff() to authenticated;
revoke all on function public.concluir_atendimento_gestao(uuid,text) from public, anon;
grant execute on function public.concluir_atendimento_gestao(uuid,text) to authenticated;

revoke all on function public.backfill_google_sheets() from public, anon, authenticated;
revoke all on function public.backfill_log_auditoria_google() from public, anon, authenticated;
revoke all on function public.backfill_produtos_comerciais_google() from public, anon, authenticated;
revoke all on function public.backfill_produtos_comerciais_google_lote() from public, anon, authenticated;
revoke all on function public.teste_auditoria_majestic() from public, anon, authenticated;
grant execute on function public.backfill_google_sheets() to service_role;
grant execute on function public.backfill_log_auditoria_google() to service_role;
grant execute on function public.backfill_produtos_comerciais_google() to service_role;
grant execute on function public.backfill_produtos_comerciais_google_lote() to service_role;
grant execute on function public.teste_auditoria_majestic() to service_role;

revoke all on function public.audit_autorizacoes_gestao() from public, anon, authenticated;
revoke all on function public.fn_auditoria_majestic() from public, anon, authenticated;
revoke all on function public.fn_sincronizar_aluno_matriculado_2027() from public, anon, authenticated;
revoke all on function public.handle_new_user() from public, anon, authenticated;
revoke all on function public.sincronizar_mensalidades_atendimento_2027() from public, anon, authenticated;
revoke all on function public.tg_google_log_auditoria() from public, anon, authenticated;
revoke all on function public.tg_google_produtos_comerciais() from public, anon, authenticated;
revoke all on function public.tg_google_sheets_mirror() from public, anon, authenticated;
revoke all on function public.tg_mensalidades_config_2027() from public, anon, authenticated;

-- 4) financial_integrity_guardrails
-- Os três CHECKs foram aplicados e validados em produção.
-- Consulte CHANGELOG_SECURITY.md e SECURITY_AUDIT_REPORT.md para evidências.

-- 5) security_harden_majestic_table_view_grants
-- Aplicada em produção: anon sem acesso direto aos objetos Majestic;
-- authenticated sem TRUNCATE, REFERENCES ou TRIGGER.
-- DML continua condicionado por RLS/policies.
