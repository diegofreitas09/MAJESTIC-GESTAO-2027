# Data Flow — MAJESTIC 2027

## Classificação

| Dado | Origem | Destino | Classe |
|---|---|---|---|
| login/sessão | usuário | Supabase Auth | CRÍTICO |
| responsáveis/alunos | frontend | Supabase → Sheets | CONFIDENCIAL |
| contatos/endereço | frontend | Supabase → Sheets | CONFIDENCIAL |
| dados escolares | frontend | Supabase → Sheets | CONFIDENCIAL |
| valores/descontos | frontend + regras | Supabase → Sheets | CRÍTICO |
| autorizações | equipe/direção | Supabase → Sheets | CRÍTICO |
| auditoria | banco | Supabase → Sheets | CRÍTICO |
| catálogo | direção | Supabase → Sheets | INTERNO/CRÍTICO |

## Fluxo

1. Usuário autentica no Supabase.
2. Frontend consulta `profiles`.
3. RLS define o acesso efetivo às tabelas.
4. Operações críticas são gravadas no PostgreSQL.
5. Triggers geram auditoria e sincronização.
6. Ponte envia eventos ao Apps Script.
7. Apps Script escreve no Google Sheets espelho.
8. Snapshot/restore de teste da planilha foi validado em 2026-09-24.

## Lacunas

- operação transacional do Apps Script ainda pode ficar parcial;
- idempotência por `operation_id` ainda não é universal;
- backup independente de outra credencial/conta ainda não foi validado;
- protected ranges da planilha: NÃO VERIFICADO.
