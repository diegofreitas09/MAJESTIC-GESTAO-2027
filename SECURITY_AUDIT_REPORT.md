# SECURITY AUDIT REPORT — MAJESTIC 2027

Data: 2026-09-24  
Status: EM EXECUÇÃO  
Status de produção: **PRODUCTION BLOCKED**

## Progresso registrado neste relatório

A auditoria ainda não está em 100%. Este arquivo acompanha o estado verificável; NOT RUN nunca é tratado como PASS.

## Achados principais

### SEC-001 — CRITICAL — RETESTADO
A função SECURITY DEFINER `enviar_google_sheets` podia ser executada por `anon`, usando a credencial real da integração para chamadas server-side.

Correção: acesso direto removido de public/anon/authenticated; service_role mantido.

Evidência de reteste: `anon_execute=false`, `authenticated_execute=false`, `service_role_execute=true`.

### SEC-002 — HIGH — RETESTADO
`vw_atendimentos_por_equipe` e `vw_resumo_executivo` eram views privilegiadas com grants amplos.

Correção: `security_invoker=true`, sem anon; authenticated recebe somente SELECT. O advisor deixou de reportar `security_definer_view`.

### SEC-003 — HIGH — RETESTADO
Funções internas Majestic SECURITY DEFINER tinham execução anônima.

Correção: ACLs endurecidas. Alertas anon restantes pertencem ao Aurora e ficaram fora do escopo desta alteração.

### FIN-001 — HIGH — RETESTADO
Valores críticos não tinham guardrails de faixa no banco.

Correção: CHECKs para não-negatividade, NaN, parcelas >=1 e desconto solicitado 0..100. Dados existentes: 0 incompatibilidades. Constraints: validadas.

### INT-001 — HIGH — EM CORREÇÃO
A ponte Apps Script lê `body.action`, enquanto o Supabase envia `operation`. DELETE individual pode não ser aplicado corretamente no espelho. Patch criado em branch; deploy vivo ainda pendente.

### INT-002 — HIGH — PENDENTE
A operação chamada de `transaction` no Apps Script pode aplicar operações anteriores e continuar após falha, produzindo estado parcial.

### FIN-002 — HIGH — PENDENTE
Guardrails básicos existem, mas cálculos/relações financeiras ainda são formados no frontend e não há um único serviço backend recalculando todos os totais críticos.

### BACKUP-001 — HIGH — PARCIAL
Snapshot e restore de teste do Google Sheets foram validados por checksum. Cópia independente de outra credencial e restore completo do PostgreSQL ainda não foram validados.

## Testes

| Teste | Estado |
|---|---|
| BUILD | PASS no commit de produção via GitHub Actions |
| dependency audit | PASS no commit de produção |
| TYPECHECK | NOT RUN |
| LINT | NOT RUN |
| UNIT | NOT RUN |
| INTEGRATION | NOT RUN |
| SAST | NOT RUN |
| SECRET SCAN nativo/histórico | NOT RUN / NÃO VERIFICADO |
| E2E | NOT RUN |
| SMOKE live | NOT RUN |
| restore Sheets em cópia | PASS |
| rollback Netlify | NOT RUN |

## Bloqueadores atuais

- Apps Script corrigido ainda não foi publicado/retestado no deploy vivo;
- atomicidade/idempotência da sincronização ainda insuficiente;
- backup independente/restore completo do banco não comprovados;
- cobertura de testes/CI de segurança ainda insuficiente para READY FOR PRODUCTION.
