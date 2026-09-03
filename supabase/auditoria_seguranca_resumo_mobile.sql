-- MAJESTIC 2027 — RESUMO MOBILE DA AUDITORIA DE SEGURANÇA
-- Somente leitura. Não altera nenhum dado.

with checks as (
  select
    'RLS tabelas críticas'::text as verificacao,
    case when count(*) filter (where relrowsecurity = false) = 0 then 'OK' else 'FALHA' end as status,
    format('%s/%s com RLS ativo', count(*) filter (where relrowsecurity), count(*)) as detalhe
  from pg_class c
  join pg_namespace n on n.oid=c.relnamespace
  where n.nspname='public'
    and c.relkind='r'
    and c.relname in (
      'profiles','gestao_clientes','gestao_atendimentos','autorizacoes_gestao','atendentes',
      'produtos_comerciais','mensalidades_config_2027','alunos','matriculas_academicas',
      'log_auditoria','integracao_config'
    )

  union all

  select
    'Privilégios ANON',
    case when count(*) = 0 then 'OK' else 'FALHA' end,
    format('%s privilégio(s) encontrado(s)', count(*))
  from information_schema.role_table_grants
  where table_schema='public'
    and grantee='anon'
    and table_name in (
      'profiles','gestao_clientes','gestao_atendimentos','autorizacoes_gestao','atendentes',
      'produtos_comerciais','mensalidades_config_2027','alunos','matriculas_academicas',
      'log_auditoria','integracao_config'
    )

  union all

  select
    'Trigger anti-autorização indevida',
    case when exists (
      select 1 from information_schema.triggers
      where trigger_schema='public'
        and trigger_name='trg_proteger_decisao_autorizacao'
    ) then 'OK' else 'FALHA' end,
    case when exists (
      select 1 from information_schema.triggers
      where trigger_schema='public'
        and trigger_name='trg_proteger_decisao_autorizacao'
    ) then 'trigger instalado' else 'trigger ausente' end

  union all

  select
    'Realtime comercial',
    case when count(*) = 2 then 'OK' else 'ATENÇÃO' end,
    format('%s/2 tabelas na publicação realtime', count(*))
  from pg_publication_tables
  where pubname='supabase_realtime'
    and schemaname='public'
    and tablename in ('produtos_comerciais','mensalidades_config_2027')

  union all

  select
    'Funções de autorização',
    case when count(*) = 3 and count(*) filter (where prosecdef) = 3 then 'OK' else 'FALHA' end,
    format('%s/3 funções SECURITY DEFINER', count(*) filter (where prosecdef))
  from pg_proc p
  join pg_namespace n on n.oid=p.pronamespace
  where n.nspname='public'
    and p.proname in ('majestic_usuario_ativo','majestic_tem_role','tg_proteger_decisao_autorizacao')

  union all

  select
    'Políticas de preços',
    case when count(*) >= 4 then 'OK' else 'ATENÇÃO' end,
    format('%s política(s) comercial(is)', count(*))
  from pg_policies
  where schemaname='public'
    and tablename in ('produtos_comerciais','mensalidades_config_2027')

  union all

  select
    'Perfis ativos',
    case when count(*) > 0 then 'OK' else 'ATENÇÃO' end,
    format('%s usuário(s) ativo(s)', count(*))
  from public.profiles
  where ativo=true
)
select * from checks
order by case status when 'FALHA' then 1 when 'ATENÇÃO' then 2 else 3 end, verificacao;

select
  case when exists (
    select 1 from (
      select 1
      from information_schema.role_table_grants
      where table_schema='public'
        and grantee='anon'
        and table_name in (
          'profiles','gestao_clientes','gestao_atendimentos','autorizacoes_gestao','atendentes',
          'produtos_comerciais','mensalidades_config_2027','alunos','matriculas_academicas',
          'log_auditoria','integracao_config'
        )
      union all
      select 1
      from pg_class c join pg_namespace n on n.oid=c.relnamespace
      where n.nspname='public'
        and c.relkind='r'
        and c.relname in (
          'profiles','gestao_clientes','gestao_atendimentos','autorizacoes_gestao','atendentes',
          'produtos_comerciais','mensalidades_config_2027','alunos','matriculas_academicas',
          'log_auditoria','integracao_config'
        )
        and c.relrowsecurity=false
    ) x
  ) then 'AUDITORIA COM PENDENCIAS'
  else 'AUDITORIA BASICA DE SEGURANCA: OK'
  end as status_final;
