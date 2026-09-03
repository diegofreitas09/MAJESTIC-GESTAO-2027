-- MAJESTIC 2027 — TESTE FINAL DE SEGURANÇA SEM TABELA TEMPORÁRIA
-- Compatível com o SQL Editor do Supabase no celular.
-- NÃO altera dados de negócio.

with checks as (
  select
    'RLS tabelas críticas'::text as teste,
    case when not exists (
      select 1
      from pg_class c
      join pg_namespace n on n.oid=c.relnamespace
      where n.nspname='public'
        and c.relkind='r'
        and c.relname in (
          'profiles','gestao_clientes','gestao_atendimentos','autorizacoes_gestao','atendentes',
          'produtos_comerciais','mensalidades_config_2027','alunos','matriculas_academicas',
          'log_auditoria','integracao_config'
        )
        and c.relrowsecurity=false
    ) then 'OK' else 'FALHA' end::text as resultado,
    'Todas as tabelas críticas existentes devem estar com RLS ativo.'::text as detalhe

  union all
  select
    'ANON sem acesso direto',
    case when not exists (
      select 1
      from information_schema.role_table_grants
      where table_schema='public'
        and grantee='anon'
        and table_name in (
          'profiles','gestao_clientes','gestao_atendimentos','autorizacoes_gestao','atendentes',
          'produtos_comerciais','mensalidades_config_2027','alunos','matriculas_academicas',
          'log_auditoria','integracao_config'
        )
    ) then 'OK' else 'FALHA' end,
    'O papel anon não deve possuir privilégios nas tabelas críticas.'

  union all
  select
    'Gestão não altera preços',
    case when exists (
      select 1 from pg_policies
      where schemaname='public' and tablename='produtos_comerciais'
        and policyname='produtos_write_direcao'
        and cmd='ALL'
    )
    and not exists (
      select 1 from pg_policies
      where schemaname='public' and tablename='produtos_comerciais'
        and cmd in ('INSERT','UPDATE','DELETE','ALL')
        and policyname <> 'produtos_write_direcao'
    )
    then 'OK' else 'FALHA' end,
    'Somente a política de escrita da Direção deve existir para produtos.'

  union all
  select
    'Gestão não altera mensalidades',
    case when to_regclass('public.mensalidades_config_2027') is null then 'ATENÇÃO'
         when exists (
           select 1 from pg_policies
           where schemaname='public' and tablename='mensalidades_config_2027'
             and policyname='mensalidades_write_direcao'
             and cmd='ALL'
         )
         and not exists (
           select 1 from pg_policies
           where schemaname='public' and tablename='mensalidades_config_2027'
             and cmd in ('INSERT','UPDATE','DELETE','ALL')
             and policyname <> 'mensalidades_write_direcao'
         ) then 'OK' else 'FALHA' end,
    'Mensalidades devem ser gravadas apenas pela Direção.'

  union all
  select
    'Proteção de autorização',
    case when exists (
      select 1 from information_schema.triggers
      where trigger_schema='public'
        and trigger_name='trg_proteger_decisao_autorizacao'
    ) then 'OK' else 'FALHA' end,
    'Trigger deve impedir a equipe de autorizar ou negar o próprio pedido.'

  union all
  select
    'Integração restrita à Direção',
    case when to_regclass('public.integracao_config') is null then 'ATENÇÃO'
         when exists (
           select 1 from pg_policies
           where schemaname='public' and tablename='integracao_config'
             and policyname='integracao_config_direcao'
         ) then 'OK' else 'FALHA' end,
    'Configuração sensível de integração deve ser acessível apenas pela Direção.'

  union all
  select
    'Auditoria restrita à Direção',
    case when to_regclass('public.log_auditoria') is null then 'ATENÇÃO'
         when exists (
           select 1 from pg_policies
           where schemaname='public' and tablename='log_auditoria'
             and policyname='log_auditoria_select_direcao'
         ) then 'OK' else 'FALHA' end,
    'Equipe operacional não deve ler diretamente o log de auditoria.'

  union all
  select
    'Realtime comercial',
    case when
      exists (
        select 1 from pg_publication_tables
        where pubname='supabase_realtime'
          and schemaname='public'
          and tablename='produtos_comerciais'
      )
      and (
        to_regclass('public.mensalidades_config_2027') is null
        or exists (
          select 1 from pg_publication_tables
          where pubname='supabase_realtime'
            and schemaname='public'
            and tablename='mensalidades_config_2027'
        )
      )
    then 'OK' else 'FALHA' end,
    'Produtos e mensalidades devem sincronizar em tempo real com o Atendimento.'

  union all
  select
    'Usuários ativos por perfil',
    case when exists (select 1 from public.profiles where ativo=true and role::text='direcao')
          and exists (select 1 from public.profiles where ativo=true and role::text in ('gestao','matricula'))
         then 'OK' else 'ATENÇÃO' end,
    'Deve existir pelo menos uma Direção ativa e um usuário operacional ativo.'
)
select teste, resultado, detalhe
from checks
order by case resultado when 'FALHA' then 1 when 'ATENÇÃO' then 2 else 3 end, teste;
