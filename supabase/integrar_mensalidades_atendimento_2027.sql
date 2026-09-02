-- MAJESTIC 2027 — INTEGRAÇÃO MENSALIDADES -> ATENDIMENTO
-- Mantém Plano A e Plano B espelhados em produtos_comerciais.
-- Assim o Atendimento usa a mesma fonte oficial e recebe alterações via Realtime.
-- Não apaga nenhuma tabela nem histórico.

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
     'Plano A • '||new.plano_a_parcelas||'x • até o vencimento',
     'Mensalidade','Plano A',series,
     new.valor_2026_ate_vencimento,
     case when new.valor_2026_ate_vencimento<>0 then ((new.plano_a_ate_vencimento-new.valor_2026_ate_vencimento)/new.valor_2026_ate_vencimento)*100 else 0 end,
     new.plano_a_ate_vencimento,new.plano_a_parcelas,new.valor_2026_ate_vencimento,new.plano_a_ate_vencimento,
     'mensal',true,true,
     'Após o vencimento: R$ '||replace(to_char(new.plano_a_apos_vencimento,'FM999999990D00'),'.',',')||'. Aplicável do Infantil I ao 5º ano.',
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
     'Plano B • '||new.plano_b_parcelas||'x • até o vencimento',
     'Mensalidade','Plano B',series,
     new.valor_2026_ate_vencimento,
     case when new.valor_2026_ate_vencimento<>0 then ((new.plano_b_ate_vencimento-new.valor_2026_ate_vencimento)/new.valor_2026_ate_vencimento)*100 else 0 end,
     new.plano_b_ate_vencimento,new.plano_b_parcelas,new.valor_2026_ate_vencimento,new.plano_b_ate_vencimento,
     'mensal',true,true,
     'Após o vencimento: R$ '||replace(to_char(new.plano_b_apos_vencimento,'FM999999990D00'),'.',',')||'. Aplicável do Infantil I ao 5º ano.',
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

-- Sincronização imediata do registro já existente.
do $$
declare r public.mensalidades_config_2027%rowtype;
begin
  select * into r from public.mensalidades_config_2027 where id=1;
  if found then
    update public.mensalidades_config_2027 set atualizado_em=now() where id=1;
  end if;
end $$;

select 'MENSALIDADES INTEGRADAS AO ATENDIMENTO EM TEMPO REAL' as status;
