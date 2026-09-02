-- MAJESTIC 2027 — PLANOS COMERCIAIS EDITÁVEIS
-- Modelo inspirado na organização usada no Cora: Plano A / Plano B,
-- primeira parcela + quantidade de parcelas, preservando a base 2026.
-- Seguro para reexecutar.

alter table public.produtos_comerciais
  add column if not exists plano text,
  add column if not exists primeira_parcela_2026 numeric(12,2),
  add column if not exists primeira_parcela_2027 numeric(12,2),
  add column if not exists quantidade_parcelas integer,
  add column if not exists valor_parcela_2026 numeric(12,2),
  add column if not exists valor_parcela_2027 numeric(12,2);

-- Migração dos registros atuais: o valor já existente passa a ser também
-- a referência de parcela, sem alterar nenhum valor comercial salvo.
update public.produtos_comerciais
set valor_parcela_2026 = coalesce(valor_parcela_2026, valor_2026),
    valor_parcela_2027 = coalesce(valor_parcela_2027, valor_2027)
where periodicidade='mensal';

-- Mensalidades escolares atuais: organiza as opções existentes como A/B.
-- A = primeira parcela + 12 parcelas; B = primeira parcela + 11 parcelas.
-- A primeira parcela fica editável e não é inventada por esta migration.
update public.produtos_comerciais
set plano='Plano A', quantidade_parcelas=12
where id in ('inf1-13','inf2-5-13') and plano is null;

update public.produtos_comerciais
set plano='Plano B', quantidade_parcelas=11
where id in ('inf1-12','inf2-5-12') and plano is null;

-- Validação leve: quantidade nunca negativa.
alter table public.produtos_comerciais
  drop constraint if exists produtos_comerciais_quantidade_parcelas_check;
alter table public.produtos_comerciais
  add constraint produtos_comerciais_quantidade_parcelas_check
  check (quantidade_parcelas is null or quantidade_parcelas >= 0);

select 'PLANOS COMERCIAIS 2027 EDITAVEIS LIBERADOS' as status;
