# Arquitetura — MAJESTIC 2027

Status: auditado em 2026-09-24. Documento em evolução.

## Fluxo principal

USUÁRIO
→ Netlify / Vite + React
→ Supabase Auth
→ RLS / RBAC no PostgreSQL
→ Tabelas operacionais Supabase
→ triggers de auditoria e sincronização
→ Apps Script Web App
→ Google Sheets "MAJESTIC 2027 — Base Espelho e Auditoria"

## Entrega

DESENVOLVEDOR
→ GitHub `diegofreitas09/MAJESTIC-GESTAO-2027`
→ GitHub Actions
→ Netlify
→ produção

Integração externa adicional detectada:
GitHub → Cloudflare Workers build check. Não há configuração Cloudflare no repositório; o check está falhando e a integração precisa ser revisada no provedor.

## Baseline conhecido

- Branch: `main`
- Commit: `d70585645935067b3e0e2c87a64cbcbad479bb8a`
- Deploy Netlify: `6aa9d30916807e0008ca07d2`
- Banco: Supabase/PostgreSQL 17
- Frontend: React 18 + Vite 6
- Autenticação: Supabase Auth, PKCE
- Google OAuth do usuário final: não identificado; integração Google observada usa Apps Script + token de aplicação.

## Observações

O mesmo projeto Supabase contém objetos do Majestic e do Aurora. Correções desta auditoria foram limitadas ao escopo Majestic para evitar regressão cruzada.
