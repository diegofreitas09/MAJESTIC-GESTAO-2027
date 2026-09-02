-- MAJESTIC 2027 — CORREÇÃO FINAL DE MENSALIDADES NO ATENDIMENTO
-- Não apaga histórico. Garante leitura pela equipe, Plano A/B ativos e Realtime.

-- 1) Garante leitura da configuração por qualquer usuário autenticado ativo.
alter table public.mensalidades_config_2027 enable row level security;
drop policy if exists mensalidades_config_select on public.mensalidades_config_2027;
create policy mensalidades_config_select
on public.mensalidades_config_2027 for select to authenticated
using (exists(select 1 from public.profiles p where p.id=auth.uid() and p.ativo=true));

-- 2) Desativa mensalidades antigas, sem excluir histórico.
update public.produtos_comerciais
set ativo=false, updated_at=now()
where categoria='Mensalidade'
  and id not in ('mensalidade-plano-a','mensalidade-plano-b');

-- 3) Garante diretamente os dois planos oficiais a partir da configuração atual.
with cfg as (
 select * from public.mensalidades_config_2027 where id=1
), dados as (
 select
   'mensalidade-plano-a'::text id,
   'Plano A • '||plano_a_parcelas||'x' produto,
   'Plano A'::text plano,
   plano_a_parcelas parcelas,
   plano_a_ate_vencimento ate,
   plano_a_apos_vencimento apos,
   valor_2026_ate_vencimento base
 from cfg
 union all
 select
   'mensalidade-plano-b',
   'Plano B • '||plano_b_parcelas||'x',
   'Plano B',
   plano_b_parcelas,
   plano_b_ate_vencimento,
   plano_b_apos_vencimento,
   valor_2026_ate_vencimento
 from cfg
)
insert into public.produtos_comerciais
(id,produto,categoria,plano,serie_aplicavel,valor_2026,reajuste_percentual,valor_2027,
 quantidade_parcelas,valor_parcela_2026,valor_parcela_2027,periodicidade,obrigatorio,ativo,observacao,vigencia_inicio)
select
 id,produto,'Mensalidade',plano,
 array['Infantil I','Infantil II','Infantil III','Infantil IV','Infantil V','1º ano','2º ano','3º ano','4º ano','5º ano'],
 base,
 case when base<>0 then ((ate-base)/base)*100 else 0 end,
 ate,parcelas,base,ate,'mensal',true,true,
 'Até o vencimento: R$ '||replace(to_char(ate,'FM999999990D00'),'.',',')||
 ' • Após o vencimento: R$ '||replace(to_char(apos,'FM999999990D00'),'.',',')||
 ' • Aplicável do Infantil I ao 5º ano.',
 '2027-01-01'
from dados
on conflict (id) do update set
 produto=excluded.produto,categoria=excluded.categoria,plano=excluded.plano,
 serie_aplicavel=excluded.serie_aplicavel,valor_2026=excluded.valor_2026,
 reajuste_percentual=excluded.reajuste_percentual,valor_2027=excluded.valor_2027,
 quantidade_parcelas=excluded.quantidade_parcelas,valor_parcela_2026=excluded.valor_parcela_2026,
 valor_parcela_2027=excluded.valor_parcela_2027,periodicidade=excluded.periodicidade,
 obrigatorio=true,ativo=true,observacao=excluded.observacao,updated_at=now();

-- 4) Realtime nas duas fontes.
do $$ begin
 alter publication supabase_realtime add table public.produtos_comerciais;
exception when duplicate_object then null; end $$;
do $$ begin
 alter publication supabase_realtime add table public.mensalidades_config_2027;
exception when duplicate_object then null; end $$;

-- 5) Conferência objetiva.
select id,produto,valor_2026,reajuste_percentual,valor_2027,ativo
from public.produtos_comerciais
where id in ('mensalidade-plano-a','mensalidade-plano-b')
order by id;

select count(*) as mensalidades_ativas
from public.produtos_comerciais
where categoria='Mensalidade' and ativo=true;

select 'MENSALIDADES DO ATENDIMENTO CORRIGIDAS E INTEGRADAS' as status;
