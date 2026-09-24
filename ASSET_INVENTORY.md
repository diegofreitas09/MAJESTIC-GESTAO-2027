# Asset Inventory

## Código e entrega
- GitHub: `diegofreitas09/MAJESTIC-GESTAO-2027`
- branch produção: `main`
- Netlify: `majestic-gestao-2027`

## Dados
- Supabase/PostgreSQL: base transacional principal observada.
- Google Sheets: espelho operacional/auditoria com 10 abas.
- Apps Script: ponte de sincronização.

## Dados críticos
- usuários/perfis;
- responsáveis/alunos;
- contatos/endereço;
- atendimentos;
- matrículas;
- produtos;
- mensalidades;
- descontos/autorizações;
- logs de auditoria.

## Segredos
Valores não são documentados aqui. Tipos identificados:
- chave pública Supabase no frontend;
- credencial interna/service role fora do browser;
- token da integração Apps Script armazenado em configuração protegida/Script Properties.
