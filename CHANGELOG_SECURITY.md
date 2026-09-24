# Changelog de Segurança

## 2026-09-24

| Alteração | Local | Risco reduzido | Teste | Resultado |
|---|---|---|---|---|
| RPC `enviar_google_sheets` restrita | Supabase | execução anônima privilegiada | catálogo de privilégios | PASS |
| views com `security_invoker` | Supabase | bypass de RLS | reloptions + grants + advisor | PASS |
| ACL de funções Majestic | Supabase | RPC/trigger exposto | advisor + privilégios | PASS |
| guardrails financeiros | Supabase | valores inválidos | precheck + constraints validated | PASS |
| snapshot/restore Sheets | Drive | perda/corrupção | SHA-256 comparativo | PASS |
| patch bridge Google | GitHub branch | token GET, delete sync, fórmula, auth_uid | revisão estática | IMPLEMENTADO; deploy/reteste vivo pendente |

Baseline: `main@d70585645935067b3e0e2c87a64cbcbad479bb8a`.
