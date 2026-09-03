# Auditoria de Segurança — MAJESTIC 2027

Data: 02/09/2026

## Escopo

- App Direção / Executivo
- App Majestic Atendimento / Gestão de Sucesso
- Supabase Auth, Postgres, RLS e Realtime
- Catálogo comercial e mensalidades
- CRM e autorizações
- Base acadêmica
- Integração Google Sheets
- Pipeline GitHub Actions
- Headers HTTP / CSP

## Resultado da auditoria

### Corrigido no código

1. **Separação de sessão entre os dois apps** já existe por `storageKey` distinto.
2. **Tokens de autenticação na URL**: `detectSessionInUrl` foi desativado porque o projeto usa login por e-mail/senha.
3. **Headers de proteção** adicionados para Cloudflare/Netlify:
   - Content-Security-Policy
   - X-Content-Type-Options
   - X-Frame-Options
   - Referrer-Policy
   - Permissions-Policy
   - Cross-Origin-Opener-Policy
   - Cross-Origin-Resource-Policy
4. **Dependências vulneráveis**:
   - Vite atualizado para 6.4.3 após auditoria automática detectar advisory de alta severidade.
   - jsPDF atualizado para 4.2.1.
   - jspdf-autotable atualizado para 5.0.8.
5. **CI de segurança**:
   - Node 24.
   - `npm audit --audit-level=high` obrigatório.
   - build obrigatório após a auditoria.
   - pipeline confirmado com sucesso após as correções.
6. **Segredos**:
   - frontend usa somente `VITE_SUPABASE_ANON_KEY`.
   - nenhuma chave `service_role` deve existir no frontend ou no repositório.
   - arquivos `.env` e `.env.local` estão ignorados pelo Git.

### Hardening Supabase preparado

Arquivo: `supabase/seguranca_hardening_2027.sql`

O script:

- não apaga tabelas nem dados;
- habilita RLS nas tabelas críticas;
- remove acesso do papel `anon` às tabelas operacionais;
- cria funções centrais de autorização baseadas em usuário ativo + role;
- restringe produtos e mensalidades para escrita somente pela Direção;
- restringe CRM às roles Direção/Gestão/Matrícula;
- restringe atendentes para administração pela Direção;
- restringe base acadêmica às roles autorizadas;
- protege a tabela de autorizações contra tentativa de a equipe se autoautorizar via REST;
- restringe configuração de integração e logs de auditoria;
- gera um relatório final das políticas RLS e privilégios `anon`.

## Arquitetura de autorização esperada

| Área | Direção | Gestão / Matrícula | Anônimo |
|---|---|---|---|
| Produtos e mensalidades | Ler / alterar | Ler | Sem acesso |
| CRM clientes | Ler / alterar | Ler / alterar | Sem acesso |
| Atendimentos | Ler / alterar | Ler / alterar | Sem acesso |
| Autorizações | Autorizar / negar | Solicitar / concluir autorizado | Sem acesso |
| Atendentes | Administrar | Ler | Sem acesso |
| Base acadêmica | Administrar | Operar | Sem acesso |
| Logs de auditoria | Ler | Sem acesso direto | Sem acesso |
| Configuração de integrações | Administrar | Sem acesso | Sem acesso |

## Pontos que exigem verificação operacional

1. Executar `supabase/seguranca_hardening_2027.sql` no SQL Editor e guardar o resultado da auditoria.
2. Confirmar que usuários inativos não conseguem consultar dados mesmo mantendo uma sessão antiga.
3. Confirmar que uma conta `gestao` não consegue alterar `produtos_comerciais` nem `mensalidades_config_2027` via REST.
4. Confirmar que uma conta `gestao` não consegue mudar uma autorização de `aguardando` para `autorizado`.
5. Confirmar que a Direção continua conseguindo aprovar/recusar solicitações.
6. Confirmar que o App Atendimento continua lendo os valores em Realtime.
7. Revisar compartilhamento da planilha Google para impedir acesso por link público.
8. Manter quaisquer tokens de integração somente em Script Properties / Supabase, nunca no código público.

## Risco residual

O frontend é uma SPA e mantém a sessão do Supabase no armazenamento do navegador. Isso é padrão para este tipo de aplicação, mas torna uma política de XSS/CSP essencial. Por isso a CSP foi adicionada. A proteção real dos dados continua sendo o RLS do Supabase; esconder botões no frontend não é considerado controle de segurança.

## Status

- Dependências: **AUDITADAS — sem vulnerabilidade alta no pipeline após correções**
- Build: **APROVADO**
- Headers de segurança: **IMPLEMENTADOS NO REPOSITÓRIO**
- Cliente Supabase: **ENDURECIDO**
- RLS/Autorização: **SCRIPT DE HARDENING PRONTO PARA EXECUÇÃO NO SUPABASE**
