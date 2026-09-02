-- MAJESTIC 2027 — RESTAURAÇÃO GARANTIDA DOS VALORES DAS FOTOS
-- NÃO apaga nenhuma tabela.
-- Faz UPSERT: se o item não existir, cria; se existir, substitui pelos valores informados nas imagens.
-- Seguro para reexecutar.

insert into public.produtos_comerciais
(id,produto,categoria,serie_aplicavel,valor_2026,reajuste_percentual,valor_2027,periodicidade,obrigatorio,ativo,observacao)
values
-- FARDAMENTO
('farda-educacao-fisica','Farda Educação Física','Fardamento',array['1º ano','2º ano','3º ano','4º ano','5º ano'],131.00,5.00,137.55,'único',false,true,'Composição 2026.'),
('farda-educacao-infantil','Farda Educação Infantil','Fardamento',array['Infantil I','Infantil II','Infantil III','Infantil IV','Infantil V'],170.93,5.00,179.48,'único',false,true,'Composição 2026.'),
('farda-fundamental','Farda Fundamental','Fardamento',array['1º ano','2º ano','3º ano','4º ano','5º ano'],198.00,5.00,207.90,'único',false,true,'Composição 2026.'),
('farda-sti','Farda STI','Fardamento',array['Berçário'],121.00,5.00,127.05,'único',false,true,'Composição 2026.'),

-- MATERIAL DIDÁTICO / SERVIÇO
('blocos-atividades','Blocos de Atividades · Berçário e Infantil I','Material Didático',array['Berçário','Infantil I'],320.00,12.50,360.00,'mensal',true,true,'2026: R$ 320,00.'),
('plano-utilizacao','Plano de Utilização','Material/Serviço',array['Berçário','Infantil I','Infantil II','Infantil III','Infantil IV','Infantil V','1º ano','2º ano','3º ano','4º ano','5º ano'],105.00,10.50,116.02,'mensal',true,true,'Valor informado na tabela interna.'),

-- BERÇÁRIO
('bercario-manha','Berçário · 7h às 11h','Berçário',array['Berçário'],854.00,10.00,939.40,'mensal',true,true,'Plano Berçário 7h às 11h.'),
('bercario-integral','Berçário · 7h às 17h','Berçário',array['Berçário'],1679.92,1.00,1696.72,'mensal',true,true,'Plano Berçário 7h às 17h.'),
('bercario-estendido','Berçário · 7h às 18h','Berçário',array['Berçário'],1801.36,3.00,1855.40,'mensal',true,true,'Plano Berçário 7h às 18h.'),
('bercario-semi','Berçário · Semi-integral','Berçário',array['Berçário'],1120.00,8.00,1209.60,'mensal',true,true,'Plano Berçário semi-integral.'),

-- TEMPO INTEGRAL
('diaria-sti','Diária STI','Tempo Integral',array['Berçário','Infantil I','Infantil II','Infantil III','Infantil IV','Infantil V','1º ano','2º ano','3º ano','4º ano','5º ano'],180.00,6.00,190.80,'diária',false,true,'Valor de diária.'),
('meia-diaria','Meia Diária','Tempo Integral',array['Berçário','Infantil I','Infantil II','Infantil III','Infantil IV','Infantil V','1º ano','2º ano','3º ano','4º ano','5º ano'],110.00,9.10,120.01,'diária',false,true,'Valor de meia diária.'),
('integral-1','Plano 1 · 7h às 13h','Tempo Integral',array['Infantil I','Infantil II','Infantil III','Infantil IV','Infantil V','1º ano','2º ano','3º ano','4º ano','5º ano'],1264.50,6.80,1350.49,'mensal',false,true,'Até o vencimento.'),
('integral-2','Plano 2 · 7h às 15h','Tempo Integral',array['Infantil I','Infantil II','Infantil III','Infantil IV','Infantil V','1º ano','2º ano','3º ano','4º ano','5º ano'],1570.51,5.10,1650.61,'mensal',false,true,'Até o vencimento.'),
('integral-3','Plano 3 · 7h às 17h','Tempo Integral',array['Infantil I','Infantil II','Infantil III','Infantil IV','Infantil V','1º ano','2º ano','3º ano','4º ano','5º ano'],1760.85,3.90,1829.52,'mensal',false,true,'Até o vencimento.'),
('integral-4','Plano 4 · 7h às 18h','Tempo Integral',array['Infantil I','Infantil II','Infantil III','Infantil IV','Infantil V','1º ano','2º ano','3º ano','4º ano','5º ano'],1898.00,0.68,1910.91,'mensal',false,true,'Até o vencimento.'),

-- ALIMENTAÇÃO
('almoco-mensal-nutricional','Almoço Mensal c/ Acompanhamento Nutricional','Alimentação',array['Berçário','Infantil I','Infantil II','Infantil III','Infantil IV','Infantil V','1º ano','2º ano','3º ano','4º ano','5º ano'],292.00,9.80,320.62,'mensal',false,true,'Plano mensal.'),
('almoco-jantar-cuidados-avulso','Almoço ou Jantar (com cuidados) Avulso','Alimentação',array['Berçário','Infantil I','Infantil II','Infantil III','Infantil IV','Infantil V','1º ano','2º ano','3º ano','4º ano','5º ano'],49.00,12.25,55.00,'avulso',false,true,'Valor unitário.'),
('almoco-jantar-avulso','Almoço ou Jantar Avulso','Alimentação',array['Berçário','Infantil I','Infantil II','Infantil III','Infantil IV','Infantil V','1º ano','2º ano','3º ano','4º ano','5º ano'],20.00,0.00,20.00,'avulso',false,true,'Valor unitário.'),
('jantar-mensal-nutricional','Jantar Mensal c/ Acompanhamento Nutricional','Alimentação',array['Berçário','Infantil I','Infantil II','Infantil III','Infantil IV','Infantil V','1º ano','2º ano','3º ano','4º ano','5º ano'],265.00,2.00,270.30,'mensal',false,true,'Plano mensal.'),
('lanche-integral-avulso','Lanche Integral Avulso','Alimentação',array['Berçário','Infantil I','Infantil II','Infantil III','Infantil IV','Infantil V','1º ano','2º ano','3º ano','4º ano','5º ano'],13.00,15.40,15.00,'avulso',false,true,'Valor unitário.'),
('lanche-mensal-nutricional','Lanche Mensal c/ Acompanhamento Nutricional','Alimentação',array['Berçário','Infantil I','Infantil II','Infantil III','Infantil IV','Infantil V','1º ano','2º ano','3º ano','4º ano','5º ano'],230.00,15.00,264.50,'mensal',false,true,'Plano mensal.'),

-- DAY CARE
('day-care-mensal','Adicional Day Care · Mensal','Day Care',array['Berçário','Infantil I','Infantil II','Infantil III','Infantil IV','Infantil V'],128.00,0.00,128.00,'mensal',false,true,'Adicional mensal.'),
('day-care-hora','Adicional Day Care · Por Hora','Day Care',array['Berçário','Infantil I','Infantil II','Infantil III','Infantil IV','Infantil V'],20.00,25.00,25.00,'hora',false,true,'Adicional por hora.'),

-- ESPORTES
('esporte-ballet','Ballet','Esportes',array['Infantil I','Infantil II','Infantil III','Infantil IV','Infantil V','1º ano','2º ano','3º ano','4º ano','5º ano'],100.00,10.00,110.00,'mensal',false,true,'Mensalidade esporte.'),
('esporte-capoeira','Capoeira','Esportes',array['Infantil I','Infantil II','Infantil III','Infantil IV','Infantil V','1º ano','2º ano','3º ano','4º ano','5º ano'],100.00,10.00,110.00,'mensal',false,true,'Mensalidade esporte.'),
('esporte-futsal','Futsal','Esportes',array['Infantil I','Infantil II','Infantil III','Infantil IV','Infantil V','1º ano','2º ano','3º ano','4º ano','5º ano'],100.00,10.00,110.00,'mensal',false,true,'Mensalidade esporte.')
on conflict (id) do update set
 produto=excluded.produto,
 categoria=excluded.categoria,
 serie_aplicavel=excluded.serie_aplicavel,
 valor_2026=excluded.valor_2026,
 reajuste_percentual=excluded.reajuste_percentual,
 valor_2027=excluded.valor_2027,
 periodicidade=excluded.periodicidade,
 obrigatorio=excluded.obrigatorio,
 ativo=true,
 observacao=excluded.observacao,
 updated_at=now();

-- Mantém a Escolinha do Flamengo fora da lista porque ela não aparece na tabela restaurada das fotos.
update public.produtos_comerciais set ativo=false where id='esporte-flamengo';

-- Conferência imediata: deve retornar 26 linhas ativas, sem contar mensalidades espelhadas A/B.
select categoria, produto, valor_2026, reajuste_percentual, valor_2027, periodicidade
from public.produtos_comerciais
where id in (
'farda-educacao-fisica','farda-educacao-infantil','farda-fundamental','farda-sti',
'blocos-atividades','plano-utilizacao','bercario-manha','bercario-integral','bercario-estendido','bercario-semi',
'diaria-sti','meia-diaria','integral-1','integral-2','integral-3','integral-4',
'almoco-mensal-nutricional','almoco-jantar-cuidados-avulso','almoco-jantar-avulso','jantar-mensal-nutricional','lanche-integral-avulso','lanche-mensal-nutricional',
'day-care-mensal','day-care-hora','esporte-ballet','esporte-capoeira','esporte-futsal'
)
order by categoria,produto;

select 'VALORES DAS FOTOS RESTAURADOS COM UPSERT' as status;
