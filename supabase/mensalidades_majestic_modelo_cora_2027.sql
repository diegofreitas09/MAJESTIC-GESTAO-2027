-- MAJESTIC 2027 — MENSALIDADES POR SÉRIE NO MODELO CORA GESTÃO
-- Estrutura: cada série possui Plano A (1ª parcela + 12) e Plano B (1ª parcela + 11).
-- Valores 2026 são copiados da tabela oficial já existente; 1ª parcela fica em branco
-- para a Direção preencher sem inventarmos condição comercial.
-- Seguro para reexecutar.

-- Garante colunas da estrutura comercial nova.
alter table public.produtos_comerciais
  add column if not exists plano text,
  add column if not exists primeira_parcela_2026 numeric(12,2),
  add column if not exists primeira_parcela_2027 numeric(12,2),
  add column if not exists quantidade_parcelas integer,
  add column if not exists valor_parcela_2026 numeric(12,2),
  add column if not exists valor_parcela_2027 numeric(12,2);

-- Infantil I — base oficial 2026 já utilizada pelo Majestic.
insert into public.produtos_comerciais
(id,produto,categoria,serie_aplicavel,valor_2026,reajuste_percentual,valor_2027,
 plano,quantidade_parcelas,valor_parcela_2026,valor_parcela_2027,periodicidade,obrigatorio,ativo,observacao)
values
('mens-inf1-a','Infantil I','Mensalidade',array['Infantil I'],677.48,0,677.48,'Plano A',12,677.48,677.48,'mensal',true,true,'Modelo A: primeira parcela + 12 parcelas. Primeira parcela editável pela Direção.'),
('mens-inf1-b','Infantil I','Mensalidade',array['Infantil I'],733.95,0,733.95,'Plano B',11,733.95,733.95,'mensal',true,true,'Modelo B: primeira parcela + 11 parcelas. Primeira parcela editável pela Direção.')
on conflict (id) do nothing;

-- Infantil II ao Infantil V e Fundamental I — a base 2026 era única para este grupo.
do $$
declare
  s text;
  slug text;
begin
  foreach s in array array['Infantil II','Infantil III','Infantil IV','Infantil V','1º ano','2º ano','3º ano','4º ano','5º ano']
  loop
    slug := case s
      when 'Infantil II' then 'inf2'
      when 'Infantil III' then 'inf3'
      when 'Infantil IV' then 'inf4'
      when 'Infantil V' then 'inf5'
      when '1º ano' then '1ano'
      when '2º ano' then '2ano'
      when '3º ano' then '3ano'
      when '4º ano' then '4ano'
      when '5º ano' then '5ano'
    end;

    insert into public.produtos_comerciais
    (id,produto,categoria,serie_aplicavel,valor_2026,reajuste_percentual,valor_2027,
     plano,quantidade_parcelas,valor_parcela_2026,valor_parcela_2027,periodicidade,obrigatorio,ativo,observacao)
    values
    ('mens-'||slug||'-a',s,'Mensalidade',array[s],608.27,0,608.27,'Plano A',12,608.27,608.27,'mensal',true,true,'Modelo A: primeira parcela + 12 parcelas. Base 2026 do grupo Infantil II ao 5º ano.'),
    ('mens-'||slug||'-b',s,'Mensalidade',array[s],658.00,0,658.00,'Plano B',11,658.00,658.00,'mensal',true,true,'Modelo B: primeira parcela + 11 parcelas. Base 2026 do grupo Infantil II ao 5º ano.')
    on conflict (id) do nothing;
  end loop;
end $$;

-- Desativa apenas as quatro linhas antigas agrupadas de mensalidade, para não duplicar
-- opções no Atendimento. Histórico continua preservado no banco.
update public.produtos_comerciais
set ativo=false,
    observacao=concat(coalesce(observacao,''),' • Substituído pela tabela por série no modelo Cora Gestão.')
where id in ('inf1-13','inf1-12','inf2-5-13','inf2-5-12');

-- Berçário continua com seus planos próprios de permanência/horário já existentes.
-- Não criamos Plano A/B de mensalidade do Berçário porque a base 2026 disponível
-- é composta por planos de horário distintos, e não devemos inventar equivalência.

select 'MENSALIDADES MAJESTIC 2027 ORGANIZADAS NO MODELO CORA' as status;
