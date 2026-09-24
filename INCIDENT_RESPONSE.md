# Incident Response — MAJESTIC

## Fluxo

DETECTAR → CONTER → PRESERVAR EVIDÊNCIA → ERRADICAR → RECUPERAR → RETESTAR → DOCUMENTAR

## Incidentes prioritários

- segredo/token exposto;
- conta GitHub/Netlify/Google/Supabase comprometida;
- alteração financeira indevida;
- exclusão/corrupção de dados;
- deploy malicioso;
- acesso indevido a dados pessoais;
- falha de sincronização Supabase ↔ Sheets.

## Evidências mínimas

- timestamp;
- request/event ID;
- usuário/role quando disponível;
- commit/deploy;
- diff;
- logs;
- entidade afetada;
- antes/depois sem segredos.

## Regra

Não apagar logs ou evidências para “limpar” o incidente. Rotação de segredo deve ocorrer com substituição validada antes da revogação quando a continuidade exigir.
