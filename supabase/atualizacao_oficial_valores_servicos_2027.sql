-- MAJESTIC 2027 — atualização oficial de serviços, materiais, STI e mensalidades
-- Fonte: tabelas oficiais fornecidas pela escola em 15/09/2026.
-- A tabela public.produtos_comerciais continua sendo a fonte única dos dois apps.

begin;

-- Garante as colunas já consumidas pelo frontend atual.
alter table public.produtos_comerciais add column if not exists plano text;
alter table public.produtos_comerciais add column if not exists turma_aplicavel text[] default '{}'::text[];
alter table public.produtos_comerciais add column if not exists quantidade_parcelas integer;
alter table public.produtos_comerciais add column if not exists valor_parcela_2026 numeric;
alter table public.produtos_comerciais add column if not exists valor_parcela_2027 numeric;
alter table public.produtos_comerciais add column if not exists primeira_parcela_2026 numeric;
alter table public.produtos_comerciais add column if not exists primeira_parcela_2027 numeric;
alter table public.produtos_comerciais add column if not exists valor_apos_vencimento numeric;
alter table public.produtos_comerciais add column if not exists vigencia_inicio date default date '2027-01-01';
alter table public.produtos_comerciais add column if not exists vigencia_fim date;

-- Valores oficiais 2027 de serviços e materiais.
with novos(id,produto,categoria,plano,valor_2027,periodicidade,observacao) as (
 values
 ('farda-educacao-fisica','Farda Educação Física','Fardamento',null,137.00,'avulso','Valor oficial 2027.'),
 ('farda-sti','Farda STI','Fardamento',null,127.00,'avulso','Valor oficial 2027.'),
 ('farda-fundamental','Farda Fundamental','Fardamento',null,207.00,'avulso','Valor oficial 2027.'),
 ('farda-educacao-infantil','Farda Educação Infantil','Fardamento',null,179.00,'avulso','Valor oficial 2027.'),
 ('plano-utilizacao','Plano de Utilização','Material/Serviço',null,116.00,'avulso','Valor oficial 2027.'),
 ('bloco-atividades-infantil-i','Bloco de Atividades – Infantil I','Material Didático',null,360.00,'avulso','R$ 360,00 ou 2x de R$ 180,00 no crédito.'),
 ('diaria-sti','Diária STI','Tempo Integral',null,190.00,'diaria','Valor oficial 2027.'),
 ('meia-diaria','Meia Diária','Tempo Integral',null,110.00,'diaria','Valor oficial 2027.'),
 ('lanche-diario','Lanche Diário','Alimentação',null,15.00,'diaria','Valor oficial 2027.'),
 ('lanche-mensal-nutricional','Lanche Mensal c/ Acompanhamento Nutricional','Alimentação',null,240.00,'mensal','Valor oficial 2027.'),
 ('almoco-jantar-diario','Almoço ou Jantar Diário','Alimentação',null,20.00,'diaria','Valor oficial 2027.'),
 ('almoco-jantar-diario-cuidados','Almoço ou Jantar Diário (com cuidados)','Alimentação',null,49.00,'diaria','Valor oficial 2027.'),
 ('almoco-jantar-mensal','Almoço ou Jantar Mensal','Alimentação',null,270.00,'mensal','Valor oficial 2027.'),
 ('day-care-mensal','Adicional Day Care (Mensal)','Day Care',null,128.00,'mensal','Valor oficial 2027.'),
 ('day-care-diaria','Adicional Day Care (por diária)','Day Care',null,25.00,'diaria','Valor oficial 2027.'),
 ('esporte-futsal','Futsal','Esportes',null,110.00,'mensal','Valor oficial 2027.'),
 ('esporte-ballet','Ballet','Esportes',null,120.00,'mensal','Valor oficial 2027.'),
 ('esporte-capoeira','Capoeira','Esportes',null,90.00,'mensal','Valor oficial 2027.'),
 ('esporte-natacao','Natação','Esportes',null,150.00,'mensal','Valor oficial 2027.'),
 ('sti-infantil-1','STI Infantil I ao 5º ano • Opção 1 • 7h às 13h','Tempo Integral','Opção 1',1250.49,'mensal','2 refeições + cuidados + vantagens do STI. Desconto interno de até R$ 1.150,00 – sem lanche.'),
 ('sti-infantil-2','STI Infantil I ao 5º ano • Opção 2 • 7h às 15h','Tempo Integral','Opção 2',1550.61,'mensal','3 refeições + cuidados + vantagens do STI. Desconto interno de até R$ 1.300,00 – sem lanche.'),
 ('sti-infantil-3','STI Infantil I ao 5º ano • Opção 3 • 7h às 17h','Tempo Integral','Opção 3',1829.52,'mensal','3 refeições + cuidados + vantagens do STI. Desconto interno de até R$ 1.600,00 – sem lanche. Contempla gratuidade da Colônia de Férias conforme regras.'),
 ('sti-infantil-4','STI Infantil I ao 5º ano • Opção 4 • 7h às 18h','Tempo Integral','Opção 4',1910.91,'mensal','4 refeições + cuidados + vantagens do STI. Desconto interno de até R$ 1.800,00 – sem lanche. Contempla gratuidade da Colônia de Férias conforme regras.'),
 ('bercario-integral','Berçário • 7h às 17h • Integral','Berçário','Opção 1',1696.72,'mensal','STI + Escola. Até o vencimento.'),
 ('bercario-integral-estendido','Berçário • 7h às 18h • Integral Estendido','Berçário','Opção 2',1855.40,'mensal','STI + Escola. Até o vencimento.'),
 ('bercario-semi-integral','Berçário • 7h às 13h ou 13h às 18h • Semi integral','Berçário','Opção 3',1209.60,'mensal','STI + Escola. Até o vencimento.'),
 ('bercario-7-11','Berçário • 7h às 11h • sem almoço','Berçário','Opção 4',939.40,'mensal','STI + Escola. Até o vencimento.')
)
insert into public.produtos_comerciais
(id,produto,categoria,plano,valor_2027,periodicidade,obrigatorio,ativo,observacao,vigencia_inicio,updated_at)
select id,produto,categoria,plano,valor_2027,periodicidade,false,true,observacao,date '2027-01-01',now() from novos
on conflict (id) do update set
 produto=excluded.produto,categoria=excluded.categoria,plano=excluded.plano,
 valor_2027=excluded.valor_2027,periodicidade=excluded.periodicidade,
 ativo=true,observacao=excluded.observacao,vigencia_inicio=date '2027-01-01',updated_at=now();

-- Desativa itens antigos equivalentes que não pertencem mais ao catálogo oficial 2027,
-- sem apagar histórico de atendimentos/orçamentos.
update public.produtos_comerciais
set ativo=false, updated_at=now()
where id in ('lanche-integral-avulso','almoco-jantar-avulso','almoco-jantar-cuidados','almoco-mensal-nutricional','jantar-mensal-nutricional','day-care-hora','flamengo')
  and id not in ('lanche-diario','almoco-jantar-diario');

-- Mensalidade oficial 2027 — Infantil I ao 5º ano.
-- Documento: anuidade R$ 8.905,00; 13 parcelas R$ 685,00 / R$ 637,00*;
-- 12 parcelas R$ 690,00 / R$ 742,00*. Mantemos os valores exatamente como fornecidos.
insert into public.produtos_comerciais
(id,produto,categoria,plano,serie_aplicavel,valor_2027,quantidade_parcelas,valor_parcela_2027,periodicidade,obrigatorio,ativo,observacao,vigencia_inicio,updated_at)
values
('mensalidade-plano-a','Mensalidade 2027 • 13 parcelas','Mensalidade','13 parcelas',array['Infantil I','Infantil II','Infantil III','Infantil IV','Infantil V','1º ano','2º ano','3º ano','4º ano','5º ano'],685.00,13,685.00,'mensal',true,true,'Tabela interna: anuidade R$ 8.905,00. Valor principal informado: R$ 685,00; documento também registra R$ 637,00*.',date '2027-01-01',now()),
('mensalidade-plano-b','Mensalidade 2027 • 12 parcelas','Mensalidade','12 parcelas',array['Infantil I','Infantil II','Infantil III','Infantil IV','Infantil V','1º ano','2º ano','3º ano','4º ano','5º ano'],690.00,12,690.00,'mensal',true,true,'Tabela interna: anuidade R$ 8.905,00. Valor principal informado: R$ 690,00; documento também registra R$ 742,00*.',date '2027-01-01',now())
on conflict (id) do update set
 produto=excluded.produto,categoria=excluded.categoria,plano=excluded.plano,serie_aplicavel=excluded.serie_aplicavel,
 valor_2027=excluded.valor_2027,quantidade_parcelas=excluded.quantidade_parcelas,valor_parcela_2027=excluded.valor_parcela_2027,
 periodicidade='mensal',obrigatorio=true,ativo=true,observacao=excluded.observacao,vigencia_inicio=date '2027-01-01',updated_at=now();

-- Regras comerciais oficiais em CONFIG JSON, sem misturá-las ao preço do produto.
create table if not exists public.regras_comerciais_2027 (
 id text primary key,
 titulo text not null,
 valor_percentual numeric,
 descricao text not null,
 ativo boolean not null default true,
 updated_at timestamptz not null default now()
);
alter table public.regras_comerciais_2027 enable row level security;

insert into public.regras_comerciais_2027(id,titulo,valor_percentual,descricao,ativo,updated_at) values
('anuidade-semestralidade','Anuidade e semestralidade',12,'Desconto informado: 12%.',true,now()),
('desconto-irmaos','Desconto de irmãos',10,'10% no irmão mais velho.',true,now()),
('colonia-planos-3-4','Colônia de Férias',null,'Plano 3 e Plano 4 do STI contemplam gratuidade da Colônia de Férias.',true,now()),
('colonia-cancelamento','Cancelamento do Integral',null,'Se o Integral for cancelado durante o ano letivo, o aluno perde automaticamente o benefício da Colônia de Férias.',true,now()),
('colonia-carencia','Carência STI',null,'O aluno deve estar inscrito no STI por no mínimo 3 meses para garantir o benefício da Colônia de Férias.',true,now())
on conflict (id) do update set titulo=excluded.titulo,valor_percentual=excluded.valor_percentual,descricao=excluded.descricao,ativo=true,updated_at=now();

-- Leitura autenticada; alterações ficam reservadas ao backend/direção conforme políticas já aplicadas ao projeto.
drop policy if exists regras_2027_leitura_autenticada on public.regras_comerciais_2027;
create policy regras_2027_leitura_autenticada on public.regras_comerciais_2027 for select to authenticated using (true);

commit;

-- Conferência final: os dois apps leem este mesmo catálogo.
select categoria,produto,valor_2027,periodicidade,ativo
from public.produtos_comerciais
where ativo=true
order by categoria,produto;
