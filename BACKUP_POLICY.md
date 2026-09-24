# Política de Backup

## Estado em 2026-09-24

Foi criado snapshot privado da planilha operacional e um restore de teste derivado do snapshot.

Validação por SHA-256 nas faixas operacionais auditadas:
`d9475c35cae090891cd83d0ad57969a4f8147b46e0d2b0e2c827c4729babcd98`

Fonte = snapshot = restore de teste, com 10 abas.

## Política alvo

- diário: snapshot da base/espelho;
- semanal: cópia versionada;
- mensal: restore test;
- retenção inicial proposta: 30 diários, 12 mensais;
- checksum em exportações/artefatos;
- pelo menos uma cópia sob credencial/conta independente.

## Status

- snapshot Google Sheets: VALIDADO;
- restore em cópia de teste: VALIDADO;
- backup independente/off-account: PENDENTE;
- backup/restore completo do PostgreSQL Supabase: NÃO VERIFICADO.
