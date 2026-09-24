# Threat Model — STRIDE

| STRIDE | Ameaça | Controle atual | Estado |
|---|---|---|---|
| Spoofing | uso indevido de sessão/token | Supabase Auth + RLS | parcial |
| Tampering | chamada anônima à ponte Google | RPC restringido a service_role | corrigido/retestado |
| Tampering | valor financeiro manipulado no cliente | CHECKs básicos no banco | reduzido; recálculo central pendente |
| Repudiation | alteração sem trilha | log de auditoria + espelho | parcial; Apps Script ainda tolera falha de log |
| Information Disclosure | view SECURITY DEFINER | security_invoker + sem anon | corrigido/retestado |
| Information Disclosure | token em query string GET | patch em branch | pendente deploy Apps Script |
| DoS | chamadas repetidas à ponte | sem rate limit dedicado identificado | pendente |
| Elevation | funções SECURITY DEFINER abertas a anon | ACLs Majestic endurecidas | corrigido/retestado |
| Tampering | cross-system no Supabase compartilhado | escopo Majestic/Aurora coexistente | requer governança |
| Tampering | formula injection no Sheets | sanitização preparada no patch | pendente deploy Apps Script |

Risco residual permanece relevante enquanto o Apps Script vivo não receber o patch e enquanto as regras financeiras críticas não forem recalculadas no backend.
