# Disaster Recovery

## Objetivos iniciais propostos

- RPO operacional: até 24 horas enquanto backup diário for a camada disponível.
- RTO inicial: 4 horas para restauração controlada de aplicação + dados.
- Valores definitivos dependem de decisão do negócio.

## Cenários

### Deploy defeituoso
1. identificar último deploy estável;
2. validar compatibilidade;
3. rollback;
4. smoke test;
5. monitorar.

### Planilha perdida/corrompida
1. congelar escrita / read-only;
2. selecionar snapshot validado;
3. restaurar em cópia;
4. validar abas, schema e checksum;
5. trocar integração apenas após aprovação.

### Segredo comprometido
1. identificar consumidores;
2. criar substituição;
3. trocar consumidores;
4. testar;
5. revogar antigo;
6. revisar logs.

### Supabase comprometido
Bloquear acesso, preservar evidências, revisar chaves/policies, restaurar de backup oficial se disponível e validar reconciliação com o espelho.

## Lacuna atual

Rollback Netlify real e restore completo do Supabase ainda não foram executados em teste.
