-- MAJESTIC 2027 — MENSALIDADES EM FORMATO FINAL
-- Mantém apenas as séries do Infantil I ao 5º ano.
-- 2026 fica apenas como comparativo (até e após vencimento).
-- 2027 passa a ser definido somente pelos planos A (12x) e B (13x),
-- cada um com valor até e após o vencimento.

alter table public.fechamento_comercial_2027
  add column if not exists valor_2026_ate_vencimento numeric(12,2),
  add column if not exists valor_2026_apos_vencimento numeric(12,2);

-- Preserva os valores-base históricos já conhecidos de 2026.
update public.fechamento_comercial_2027
set valor_2026_ate_vencimento = case
      when serie='Infantil I' then 677.48
      when serie in ('Infantil II','Infantil III','Infantil IV','Infantil V','1º ano','2º ano','3º ano','4º ano','5º ano') then 608.27
      else valor_2026_ate_vencimento
    end,
    valor_2026_apos_vencimento = case
      when serie='Infantil I' then 730.73
      when serie in ('Infantil II','Infantil III','Infantil IV','Infantil V','1º ano','2º ano','3º ano','4º ano','5º ano') then 670.00
      else valor_2026_apos_vencimento
    end,
    modalidade='Regular',
    plano_a_parcelas=12,
    plano_b_parcelas=13
where serie in ('Infantil I','Infantil II','Infantil III','Infantil IV','Infantil V','1º ano','2º ano','3º ano','4º ano','5º ano');

-- Remove do fechamento de mensalidade linhas que não pertencem ao recorte solicitado.
update public.fechamento_comercial_2027
set ativo=false
where serie not in ('Infantil I','Infantil II','Infantil III','Infantil IV','Infantil V','1º ano','2º ano','3º ano','4º ano','5º ano');

-- Garante uma linha por série, sem inventar valores 2027.
insert into public.fechamento_comercial_2027
(ordem,serie,modalidade,valor_base_2026,valor_2026_ate_vencimento,valor_2026_apos_vencimento,plano_a_parcelas,plano_b_parcelas,ativo)
values
(1,'Infantil I','Regular',677.48,677.48,730.73,12,13,true),
(2,'Infantil II','Regular',608.27,608.27,670.00,12,13,true),
(3,'Infantil III','Regular',608.27,608.27,670.00,12,13,true),
(4,'Infantil IV','Regular',608.27,608.27,670.00,12,13,true),
(5,'Infantil V','Regular',608.27,608.27,670.00,12,13,true),
(6,'1º ano','Regular',608.27,608.27,670.00,12,13,true),
(7,'2º ano','Regular',608.27,608.27,670.00,12,13,true),
(8,'3º ano','Regular',608.27,608.27,670.00,12,13,true),
(9,'4º ano','Regular',608.27,608.27,670.00,12,13,true),
(10,'5º ano','Regular',608.27,608.27,670.00,12,13,true)
on conflict do nothing;

select 'MENSALIDADES 2027 NO FORMATO FINAL LIBERADAS' as status;
