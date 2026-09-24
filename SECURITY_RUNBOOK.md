# Security Runbook

## Rotacionar segredo
Inventariar → emitir novo → trocar consumidores → testar → revogar antigo → revisar histórico/logs.

## Recuperar Sheets
Ativar read-only → restaurar snapshot em cópia → validar schema/checksum → aprovar troca → monitorar.

## Rollback Netlify
Escolher deploy estável compatível → publicar rollback → smoke test de homepage/login/API → monitorar.

## Bloquear usuário
Desativar perfil/autenticação → revogar sessões quando suportado → preservar logs → investigar atividade.

## Investigar alteração financeira
Localizar evento no log → comparar before/after → confirmar usuário/role → reconciliar Supabase e Sheets → corrigir somente após preservar evidência.

## Read-only mode
Ainda não implementado como chave operacional única. Em incidente, bloquear temporariamente rotas de escrita/RPCs e manter leitura mínima autorizada.
