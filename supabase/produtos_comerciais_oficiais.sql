-- MAJESTIC 2027 — CATÁLOGO COMERCIAL OFICIAL
-- Supabase passa a ser a fonte única de Produtos e Valores.
-- Execute uma vez no SQL Editor. Seguro para reexecutar.

create table if not exists public.produtos_comerciais (
  id text primary key,
  produto text not null,
  categoria text not null default 'Outros',
  serie_aplicavel text[] not null default '{}',
  turma_aplicavel text[] not null default '{}',
  valor_2026 numeric(12,2) not null default 0,
  reajuste_percentual numeric(8,3) not null default 0,
  valor_2027 numeric(12,2) not null default 0,
  periodicidade text not null default 'avulso',
  obrigatorio boolean not null default false,
  ativo boolean not null default true,
  observacao text,
  vigencia_inicio date default date '2027-01-01',
  vigencia_fim date,
  alterado_por uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.produtos_comerciais enable row level security;

drop policy if exists produtos_comerciais_select on public.produtos_comerciais;
create policy produtos_comerciais_select on public.produtos_comerciais
for select to authenticated
using (exists(select 1 from public.profiles p where p.id=auth.uid() and p.ativo=true));

drop policy if exists produtos_comerciais_direcao_write on public.produtos_comerciais;
create policy produtos_comerciais_direcao_write on public.produtos_comerciais
for all to authenticated
using (public.is_role(array['direcao']::public.user_role[]))
with check (public.is_role(array['direcao']::public.user_role[]));

create or replace function public.tg_produtos_comerciais_auditoria()
returns trigger
language plpgsql
security definer
set search_path=public
as $$
begin
  new.updated_at := now();
  new.alterado_por := auth.uid();
  return new;
end;
$$;

drop trigger if exists trg_produtos_comerciais_auditoria on public.produtos_comerciais;
create trigger trg_produtos_comerciais_auditoria
before insert or update on public.produtos_comerciais
for each row execute function public.tg_produtos_comerciais_auditoria();

-- Catálogo-base 2026. Em reexecução, preserva reajuste e valor 2027 já definidos pela Direção.
insert into public.produtos_comerciais
(id,produto,categoria,serie_aplicavel,valor_2026,reajuste_percentual,valor_2027,periodicidade,obrigatorio,observacao)
values
('inf1-13','Infantil I · 13 parcelas','Mensalidade',array['Infantil I'],677.48,0,677.48,'mensal',true,'Pagamento em dia. Valor real 2026: R$ 730,73.'),
('inf1-12','Infantil I · 12 parcelas','Mensalidade',array['Infantil I'],733.95,0,733.95,'mensal',true,'Pagamento em dia. Valor real 2026: R$ 780,79.'),
('inf2-5-13','Infantil II ao 5º ano · 13 parcelas','Mensalidade',array['Infantil II','Infantil III','Infantil IV','Infantil V','1º ano','2º ano','3º ano','4º ano','5º ano'],608.27,0,608.27,'mensal',true,'Pagamento em dia. Valor real 2026: R$ 670,00.'),
('inf2-5-12','Infantil II ao 5º ano · 12 parcelas','Mensalidade',array['Infantil II','Infantil III','Infantil IV','Infantil V','1º ano','2º ano','3º ano','4º ano','5º ano'],658.00,0,658.00,'mensal',true,'Pagamento em dia. Valor real 2026: R$ 725,03.'),
('integral-1','Plano 1 · 7h às 13h','Tempo Integral',array['Infantil I','Infantil II','Infantil III','Infantil IV','Infantil V','1º ano','2º ano','3º ano','4º ano','5º ano'],1264.50,0,1264.50,'mensal',false,'Até o vencimento. Após vencimento 2026: R$ 1.345,22.'),
('integral-2','Plano 2 · 7h às 15h','Tempo Integral',array['Infantil I','Infantil II','Infantil III','Infantil IV','Infantil V','1º ano','2º ano','3º ano','4º ano','5º ano'],1570.51,0,1570.51,'mensal',false,'Até o vencimento. Após vencimento 2026: R$ 1.670,76.'),
('integral-3','Plano 3 · 7h às 17h','Tempo Integral',array['Infantil I','Infantil II','Infantil III','Infantil IV','Infantil V','1º ano','2º ano','3º ano','4º ano','5º ano'],1760.85,0,1760.85,'mensal',false,'Até o vencimento. Após vencimento 2026: R$ 1.873,00.'),
('integral-4','Plano 4 · 7h às 18h','Tempo Integral',array['Infantil I','Infantil II','Infantil III','Infantil IV','Infantil V','1º ano','2º ano','3º ano','4º ano','5º ano'],1898.00,0,1898.00,'mensal',false,'Até o vencimento. Após vencimento 2026: R$ 2.019,00.'),
('bercario-integral','Berçário · 7h às 17h','Berçário',array['Berçário'],1679.92,0,1679.92,'mensal',true,'Com pontualidade. Sem pontualidade 2026: R$ 1.910,00.'),
('bercario-estendido','Berçário · 7h às 18h','Berçário',array['Berçário'],1801.36,0,1801.36,'mensal',true,'Integral estendido. Sem pontualidade 2026: R$ 1.960,00.'),
('bercario-semi','Berçário · Semi-integral','Berçário',array['Berçário'],1120.00,0,1120.00,'mensal',true,'7h às 13h ou 13h às 18h. Sem pontualidade 2026: R$ 1.320,00.'),
('bercario-manha','Berçário · 7h às 11h','Berçário',array['Berçário'],854.00,0,854.00,'mensal',true,'Sem almoço. Sem pontualidade 2026: R$ 985,00.'),
('farda-educacao-fisica','Farda Educação Física','Fardamento',array['1º ano','2º ano','3º ano','4º ano','5º ano'],131.00,0,131.00,'único',false,'Composição 2026: blusa R$ 60,50 + short R$ 70,50.'),
('farda-sti','Farda STI','Fardamento',array['Berçário'],121.00,0,121.00,'único',false,'Composição 2026: blusa R$ 60,50 + short R$ 60,50.'),
('farda-fundamental','Farda Fundamental','Fardamento',array['1º ano','2º ano','3º ano','4º ano','5º ano'],198.00,0,198.00,'único',false,'Composição 2026: blusa R$ 88,00 + calça R$ 110,00.'),
('farda-educacao-infantil','Farda Educação Infantil','Fardamento',array['Infantil I','Infantil II','Infantil III','Infantil IV','Infantil V'],170.93,0,170.93,'único',false,'Composição 2026: blusa R$ 75,15 + short R$ 95,80.'),
('plano-utilizacao','Plano de Utilização','Material/Serviço',array['Berçário','Infantil I','Infantil II','Infantil III','Infantil IV','Infantil V','1º ano','2º ano','3º ano','4º ano','5º ano'],105.00,0,105.00,'único',true,'Valor informado na tabela interna de Serviços/Materiais 2026.'),
('blocos-atividades','Blocos de Atividades · Berçário e Infantil I','Material Didático',array['Berçário','Infantil I'],320.00,0,320.00,'único',true,'2026: R$ 320,00 no Pix ou débito; crédito em 2x de R$ 160,00.'),
('diaria-sti','Diária STI','Tempo Integral',array['Berçário','Infantil I','Infantil II','Infantil III','Infantil IV','Infantil V','1º ano','2º ano','3º ano','4º ano','5º ano'],180.00,0,180.00,'diária',false,'Valor de diária avulsa 2026.'),
('meia-diaria','Meia Diária','Tempo Integral',array['Berçário','Infantil I','Infantil II','Infantil III','Infantil IV','Infantil V','1º ano','2º ano','3º ano','4º ano','5º ano'],110.00,0,110.00,'diária',false,'Valor de meia diária 2026.'),
('lanche-integral-avulso','Lanche Integral Avulso','Alimentação',array['Berçário','Infantil I','Infantil II','Infantil III','Infantil IV','Infantil V','1º ano','2º ano','3º ano','4º ano','5º ano'],13.00,0,13.00,'avulso',false,'Valor unitário 2026.'),
('almoco-jantar-avulso','Almoço ou Jantar Avulso','Alimentação',array['Berçário','Infantil I','Infantil II','Infantil III','Infantil IV','Infantil V','1º ano','2º ano','3º ano','4º ano','5º ano'],20.00,0,20.00,'avulso',false,'Valor unitário 2026.'),
('almoco-jantar-cuidados-avulso','Almoço ou Jantar (com cuidados) Avulso','Alimentação',array['Berçário','Infantil I','Infantil II','Infantil III','Infantil IV','Infantil V','1º ano','2º ano','3º ano','4º ano','5º ano'],49.00,0,49.00,'avulso',false,'Valor unitário 2026 para serviço com cuidados.'),
('lanche-mensal-nutricional','Lanche Mensal c/ Acompanhamento Nutricional','Alimentação',array['Berçário','Infantil I','Infantil II','Infantil III','Infantil IV','Infantil V','1º ano','2º ano','3º ano','4º ano','5º ano'],230.00,0,230.00,'mensal',false,'Plano mensal 2026 com acompanhamento nutricional.'),
('almoco-mensal-nutricional','Almoço Mensal c/ Acompanhamento Nutricional','Alimentação',array['Berçário','Infantil I','Infantil II','Infantil III','Infantil IV','Infantil V','1º ano','2º ano','3º ano','4º ano','5º ano'],292.00,0,292.00,'mensal',false,'Plano mensal 2026 com acompanhamento nutricional.'),
('jantar-mensal-nutricional','Jantar Mensal c/ Acompanhamento Nutricional','Alimentação',array['Berçário','Infantil I','Infantil II','Infantil III','Infantil IV','Infantil V','1º ano','2º ano','3º ano','4º ano','5º ano'],265.00,0,265.00,'mensal',false,'Plano mensal 2026 com acompanhamento nutricional.'),
('day-care-mensal','Adicional Day Care · Mensal','Day Care',array['Berçário','Infantil I','Infantil II','Infantil III','Infantil IV','Infantil V'],128.00,0,128.00,'mensal',false,'Adicional mensal 2026.'),
('day-care-hora','Adicional Day Care · Por Hora','Day Care',array['Berçário','Infantil I','Infantil II','Infantil III','Infantil IV','Infantil V'],20.00,0,20.00,'hora',false,'Adicional por hora 2026.'),
('esporte-futsal','Futsal','Esportes',array['Infantil I','Infantil II','Infantil III','Infantil IV','Infantil V','1º ano','2º ano','3º ano','4º ano','5º ano'],80.00,0,80.00,'mensal',false,'Esporte 2026.'),
('esporte-ballet','Ballet','Esportes',array['Infantil I','Infantil II','Infantil III','Infantil IV','Infantil V','1º ano','2º ano','3º ano','4º ano','5º ano'],80.00,0,80.00,'mensal',false,'Esporte 2026.'),
('esporte-capoeira','Capoeira','Esportes',array['Infantil I','Infantil II','Infantil III','Infantil IV','Infantil V','1º ano','2º ano','3º ano','4º ano','5º ano'],80.00,0,80.00,'mensal',false,'Esporte 2026.'),
('esporte-flamengo','Escolinha do Flamengo','Esportes',array['Infantil I','Infantil II','Infantil III','Infantil IV','Infantil V','1º ano','2º ano','3º ano','4º ano','5º ano'],150.00,0,150.00,'mensal',false,'Esporte 2026.')
on conflict (id) do update set
  produto=excluded.produto,
  categoria=excluded.categoria,
  serie_aplicavel=excluded.serie_aplicavel,
  valor_2026=excluded.valor_2026,
  periodicidade=excluded.periodicidade,
  obrigatorio=excluded.obrigatorio,
  observacao=coalesce(public.produtos_comerciais.observacao,excluded.observacao);

-- Realtime para Direção e Atendimento receberem mudanças sem recarregar.
do $$ begin
  alter publication supabase_realtime add table public.produtos_comerciais;
exception when duplicate_object then null; end $$;

-- Espelho no Google Sheets: reaproveita o nome lógico "produtos", já mapeado no Apps Script.
create or replace function public.tg_google_produtos_comerciais()
returns trigger
language plpgsql
security definer
set search_path=public
as $$
begin
  if to_regprocedure('public.enviar_google_sheets(text,text,jsonb,jsonb,text)') is null then
    return coalesce(new,old);
  end if;
  if tg_op='DELETE' then
    perform public.enviar_google_sheets('produtos','DELETE','{}'::jsonb,to_jsonb(old));
    return old;
  end if;
  perform public.enviar_google_sheets('produtos',tg_op,to_jsonb(new),case when tg_op='UPDATE' then to_jsonb(old) else '{}'::jsonb end);
  return new;
end;
$$;

drop trigger if exists trg_google_produtos_comerciais on public.produtos_comerciais;
create trigger trg_google_produtos_comerciais
after insert or update or delete on public.produtos_comerciais
for each row execute function public.tg_google_produtos_comerciais();

-- Backfill específico do catálogo para a planilha, sem depender da tabela legada public.produtos.
create or replace function public.backfill_produtos_comerciais_google()
returns integer
language plpgsql
security definer
set search_path=public
as $$
declare r record; total integer:=0;
begin
  for r in select to_jsonb(p.*) j from public.produtos_comerciais p order by categoria,produto loop
    perform public.enviar_google_sheets('produtos','INSERT',r.j);
    total:=total+1;
  end loop;
  return total;
end;
$$;

select count(*) as produtos_oficiais from public.produtos_comerciais;