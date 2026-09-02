-- MAJESTIC 2027 — RESTAURAÇÃO DOS VALORES INFORMADOS PELA DIREÇÃO
-- Não apaga tabelas. Apenas atualiza os itens existentes conforme os valores das fotos.
-- Seguro para reexecutar.

update public.produtos_comerciais set valor_2026=131.00, reajuste_percentual=5.00, valor_2027=137.55, periodicidade='único', ativo=true where id='farda-educacao-fisica';
update public.produtos_comerciais set valor_2026=170.93, reajuste_percentual=5.00, valor_2027=179.48, periodicidade='único', ativo=true where id='farda-educacao-infantil';
update public.produtos_comerciais set valor_2026=198.00, reajuste_percentual=5.00, valor_2027=207.90, periodicidade='único', ativo=true where id='farda-fundamental';
update public.produtos_comerciais set valor_2026=121.00, reajuste_percentual=5.00, valor_2027=127.05, periodicidade='único', ativo=true where id='farda-sti';

update public.produtos_comerciais set valor_2026=320.00, reajuste_percentual=12.50, valor_2027=360.00, periodicidade='mensal', ativo=true where id='blocos-atividades';
update public.produtos_comerciais set valor_2026=105.00, reajuste_percentual=10.50, valor_2027=116.02, periodicidade='mensal', ativo=true where id='plano-utilizacao';

update public.produtos_comerciais set valor_2026=854.00, reajuste_percentual=10.00, valor_2027=939.40, periodicidade='mensal', ativo=true where id='bercario-manha';
update public.produtos_comerciais set valor_2026=1679.92, reajuste_percentual=1.00, valor_2027=1696.72, periodicidade='mensal', ativo=true where id='bercario-integral';
update public.produtos_comerciais set valor_2026=1801.36, reajuste_percentual=3.00, valor_2027=1855.40, periodicidade='mensal', ativo=true where id='bercario-estendido';
update public.produtos_comerciais set valor_2026=1120.00, reajuste_percentual=8.00, valor_2027=1209.60, periodicidade='mensal', ativo=true where id='bercario-semi';

update public.produtos_comerciais set valor_2026=180.00, reajuste_percentual=6.00, valor_2027=190.80, periodicidade='diária', ativo=true where id='diaria-sti';
update public.produtos_comerciais set valor_2026=110.00, reajuste_percentual=9.10, valor_2027=120.01, periodicidade='diária', ativo=true where id='meia-diaria';
update public.produtos_comerciais set valor_2026=1264.50, reajuste_percentual=6.80, valor_2027=1350.49, periodicidade='mensal', ativo=true where id='integral-1';
update public.produtos_comerciais set valor_2026=1570.51, reajuste_percentual=5.10, valor_2027=1650.61, periodicidade='mensal', ativo=true where id='integral-2';
update public.produtos_comerciais set valor_2026=1760.85, reajuste_percentual=3.90, valor_2027=1829.52, periodicidade='mensal', ativo=true where id='integral-3';
update public.produtos_comerciais set valor_2026=1898.00, reajuste_percentual=0.68, valor_2027=1910.91, periodicidade='mensal', ativo=true where id='integral-4';

update public.produtos_comerciais set valor_2026=292.00, reajuste_percentual=9.80, valor_2027=320.62, periodicidade='mensal', ativo=true where id='almoco-mensal-nutricional';
update public.produtos_comerciais set valor_2026=49.00, reajuste_percentual=12.25, valor_2027=55.00, periodicidade='avulso', ativo=true where id='almoco-jantar-cuidados-avulso';
update public.produtos_comerciais set valor_2026=20.00, reajuste_percentual=0.00, valor_2027=20.00, periodicidade='avulso', ativo=true where id='almoco-jantar-avulso';
update public.produtos_comerciais set valor_2026=265.00, reajuste_percentual=2.00, valor_2027=270.30, periodicidade='mensal', ativo=true where id='jantar-mensal-nutricional';
update public.produtos_comerciais set valor_2026=13.00, reajuste_percentual=15.40, valor_2027=15.00, periodicidade='avulso', ativo=true where id='lanche-integral-avulso';
update public.produtos_comerciais set valor_2026=230.00, reajuste_percentual=15.00, valor_2027=264.50, periodicidade='mensal', ativo=true where id='lanche-mensal-nutricional';

update public.produtos_comerciais set valor_2026=128.00, reajuste_percentual=0.00, valor_2027=128.00, periodicidade='mensal', ativo=true where id='day-care-mensal';
update public.produtos_comerciais set valor_2026=20.00, reajuste_percentual=25.00, valor_2027=25.00, periodicidade='hora', ativo=true where id='day-care-hora';

-- Nas fotos, Ballet/Capoeira/Futsal estavam com base 2026 = 100 e reajuste de 10%.
update public.produtos_comerciais set valor_2026=100.00, reajuste_percentual=10.00, valor_2027=110.00, periodicidade='mensal', ativo=true where id='esporte-ballet';
update public.produtos_comerciais set valor_2026=100.00, reajuste_percentual=10.00, valor_2027=110.00, periodicidade='mensal', ativo=true where id='esporte-capoeira';
update public.produtos_comerciais set valor_2026=100.00, reajuste_percentual=10.00, valor_2027=110.00, periodicidade='mensal', ativo=true where id='esporte-futsal';

select 'VALORES 2027 RESTAURADOS DAS FOTOS' as status;
