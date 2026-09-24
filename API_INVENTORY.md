# API Inventory

## Supabase

- Auth: login/logout/sessão.
- REST de tabelas via `supabase-js`.
- RPCs Majestic deliberadamente acessíveis a authenticated:
  - `is_direcao()`
  - `is_role(user_role[])`
  - `is_staff()`
  - `majestic_tem_role(text[])`
  - `majestic_usuario_ativo()`
  - `concluir_atendimento_gestao(uuid,text)`
- Funções internas de trigger/backfill: acesso direto de anon/authenticated removido na auditoria.
- `enviar_google_sheets(...)`: acesso direto restrito a service_role.

## Apps Script

### GET
Após o patch desta branch, somente health público sem token/sem conteúdo da planilha.

### POST
Ações observadas:
- upsert
- delete
- batch
- transaction

Autorização: token de aplicação em Script Properties.

## Controles pendentes

- rate limit dedicado;
- idempotency key;
- contrato de schema versionado;
- transação realmente atômica ou compensação;
- deploy/reteste do Apps Script corrigido.
