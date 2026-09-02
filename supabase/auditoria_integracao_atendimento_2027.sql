-- MAJESTIC 2027 — AUDITORIA E CORREÇÃO FINAL DA INTEGRAÇÃO COM O ATENDIMENTO
-- Objetivo:
-- 1) garantir Plano A e Plano B como únicas mensalidades ativas para o Atendimento;
-- 2) manter produtos/serviços oficiais na mesma fonte;
-- 3) garantir Realtime;
-- 4) não apagar histórico de atendimentos nem produtos.

-- Desativa mensalidades legadas/duplicadas. Mantém apenas os dois planos oficiais atuais.
update public.produtos_comerciais
set ativo=false, updated_at=now()
where categoria='Mensalidade'
  and id not in ('mensalidade-plano-a','mensalidade-plano-b');

-- Recria/garante o sincronizador Mensalidades -> Produtos Comerciais.
create or replace function public.sincronizar_mensalidades_atendimento_2027()
returns trigger
language plpgsql
security definer
set search_path=public
as $$
declare
  series text[] := array['Infantil I','Infantil II','Infantil III','Infantil IV','Infantil V','1º ano','2º ano','3º ano','4º ano','5º ano'];
begin
  insert into public.produtos_comerciais
    (id,produto,categoria,plano,serie_aplicavel,valor_2026,reajuste_percentual,valor_2027,
     quantidade_parcelas,valor_parcela_2026,valor_parcela_2027,periodicidade,obrigatorio,ativo,observacao,vigencia_inicio)
  values
    ('mensalidade-plano-a',
     'Plano A • '||new.plano_a_parcelas||'x',
     'Mensalidade','Plano A',series,
     new.valor_2026_ate_vencimento,
     case when new.valor_2026_ate_vencimento<>0 then ((new.plano_a_ate_vencimento-new.valor_2026_ate_vencimento)/new.valor_2026_ate_vencimento)*100 else 0 end,
     new.plano_a_ate_vencimento,new.plano_a_parcelas,new.valor_2026_ate_vencimento,new.plano_a_ate_vencimento,
     'mensal',true,true,
     'Até o vencimento: R$ '||replace(to_char(new.plano_a_ate_vencimento,'FM999999990D00'),'.',',')||
     ' • Após o vencimento: R$ '||replace(to_char(new.plano_a_apos_vencimento,'FM999999990D00'),'.',',')||
     ' • Aplicável do Infantil I ao 5º ano.',
     '2027-01-01')
  on conflict (id) do update set
    produto=excluded.produto,categoria=excluded.categoria,plano=excluded.plano,serie_aplicavel=excluded.serie_aplicavel,
    valor_2026=excluded.valor_2026,reajuste_percentual=excluded.reajuste_percentual,valor_2027=excluded.valor_2027,
    quantidade_parcelas=excluded.quantidade_parcelas,valor_parcela_2026=excluded.valor_parcela_2026,
    valor_parcela_2027=excluded.valor_parcela_2027,periodicidade=excluded.periodicidade,obrigatorio=true,ativo=true,
    observacao=excluded.observacao,updated_at=now();

  insert into public.produtos_comerciais
    (id,produto,categoria,plano,serie_aplicavel,valor_2026,reajuste_percentual,valor_2027,
     quantidade_parcelas,valor_parcela_2026,valor_parcela_2027,periodicidade,obrigatorio,ativo,observacao,vigencia_inicio)
  values
    ('mensalidade-plano-b',
     'Plano B • '||new.plano_b_parcelas||'x',
     'Mensalidade','Plano B',series,
     new.valor_2026_ate_vencimento,
     case when new.valor_2026_ate_vencimento<>0 then ((new.plano_b_ate_vencimento-new.valor_2026_ate_vencimento)/new.valor_2026_ate_vencimento)*100 else 0 end,
     new.plano_b_ate_vencimento,new.plano_b_parcelas,new.valor_2026_ate_vencimento,new.plano_b_ate_vencimento,
     'mensal',true,true,
     'Até o vencimento: R$ '||replace(to_char(new.plano_b_ate_vencimento,'FM999999990D00'),'.',',')||
     ' • Após o vencimento: R$ '||replace(to_char(new.plano_b_apos_vencimento,'FM999999990D00'),'.',',')||
     ' • Aplicável do Infantil I ao 5º ano.',
     '2027-01-01')
  on conflict (id) do update set
    produto=excluded.produto,categoria=excluded.categoria,plano=excluded.plano,serie_aplicavel=excluded.serie_aplicavel,
    valor_2026=excluded.valor_2026,reajuste_percentual=excluded.reajuste_percentual,valor_2027=excluded.valor_2027,
    quantidade_parcelas=excluded.quantidade_parcelas,valor_parcela_2026=excluded.valor_parcela_2026,
    valor_parcela_2027=excluded.valor_parcela_2027,periodicidade=excluded.periodicidade,obrigatorio=true,ativo=true,
    observacao=excluded.observacao,updated_at=now();

  return new;
end;$$;

drop trigger if exists trg_sincronizar_mensalidades_atendimento_2027 on public.mensalidades_config_2027;
create trigger trg_sincronizar_mensalidades_atendimento_2027
after insert or update on public.mensalidades_config_2027
for each row execute function public.sincronizar_mensalidades_atendimento_2027();

-- Garante Realtime nas duas fontes utilizadas pelo Atendimento.
do $$ begin
  alter publication supabase_realtime add table public.produtos_comerciais;
exception when duplicate_object then null; end $$;

do $$ begin
  alter publication supabase_realtime add table public.mensalidades_config_2027;
exception when duplicate_object then null; end $$;

-- Força sincronização imediata do registro atual sem alterar valores.
update public.mensalidades_config_2027
set atualizado_em=now()
where id=1;

-- Conferência final.
select id, produto, categoria, valor_2026, reajuste_percentual, valor_2027, periodicidade, ativo
from public.produtos_comerciais
where ativo=true
order by categoria, produto;

select count(*) as mensalidades_ativas
from public.produtos_comerciais
where categoria='Mensalidade' and ativo=true;

select 'INTEGRACAO ATENDIMENTO 2027 AUDITADA E CORRIGIDA' as status;
