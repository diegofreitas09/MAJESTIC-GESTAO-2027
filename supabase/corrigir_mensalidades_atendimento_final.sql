-- MAJESTIC 2027 — CORREÇÃO FINAL E AUTOCONTIDA DE MENSALIDADES
-- Seguro para executar mesmo se mensalidades_config_2027 ou colunas comerciais ainda não existirem.
-- NÃO apaga produtos, histórico, atendimentos ou valores complementares.

-- 0) Compatibiliza a tabela produtos_comerciais com a estrutura usada pelo app.
-- O banco atual foi criado com a versão enxuta, então estas colunas podem não existir.
alter table public.produtos_comerciais
  add column if not exists plano text,
  add column if not exists primeira_parcela_2026 numeric(12,2),
  add column if not exists primeira_parcela_2027 numeric(12,2),
  add column if not exists quantidade_parcelas integer,
  add column if not exists valor_parcela_2026 numeric(12,2),
  add column if not exists valor_parcela_2027 numeric(12,2);

-- 1) Garante a tabela principal de mensalidades sem DROP.
create table if not exists public.mensalidades_config_2027 (
  id integer primary key default 1 check (id = 1),
  aplicacao text not null default 'Infantil I ao 5º ano',
  valor_2026_ate_vencimento numeric(12,2) not null default 608.27,
  valor_2026_apos_vencimento numeric(12,2) not null default 670.00,
  plano_a_parcelas integer not null default 13,
  plano_a_ate_vencimento numeric(12,2) not null default 637.00,
  plano_a_apos_vencimento numeric(12,2) not null default 685.00,
  plano_b_parcelas integer not null default 12,
  plano_b_ate_vencimento numeric(12,2) not null default 690.00,
  plano_b_apos_vencimento numeric(12,2) not null default 742.00,
  observacao text,
  atualizado_em timestamptz not null default now(),
  alterado_por uuid references public.profiles(id) on delete set null
);

-- Só cria o registro padrão se ele não existir. Nunca sobrescreve valores já salvos.
insert into public.mensalidades_config_2027
(id,aplicacao,valor_2026_ate_vencimento,valor_2026_apos_vencimento,
 plano_a_parcelas,plano_a_ate_vencimento,plano_a_apos_vencimento,
 plano_b_parcelas,plano_b_ate_vencimento,plano_b_apos_vencimento)
values
(1,'Infantil I ao 5º ano',608.27,670.00,13,637.00,685.00,12,690.00,742.00)
on conflict (id) do nothing;

-- 2) RLS: equipe lê, Direção altera.
alter table public.mensalidades_config_2027 enable row level security;
drop policy if exists mensalidades_config_select on public.mensalidades_config_2027;
create policy mensalidades_config_select
on public.mensalidades_config_2027 for select to authenticated
using (exists(select 1 from public.profiles p where p.id=auth.uid() and p.ativo=true));

drop policy if exists mensalidades_config_direcao_write on public.mensalidades_config_2027;
create policy mensalidades_config_direcao_write
on public.mensalidades_config_2027 for all to authenticated
using (exists(select 1 from public.profiles p where p.id=auth.uid() and p.ativo=true and p.role::text='direcao'))
with check (exists(select 1 from public.profiles p where p.id=auth.uid() and p.ativo=true and p.role::text='direcao'));

-- 3) Atualização de auditoria sem sobrescrever preço.
create or replace function public.tg_mensalidades_config_2027()
returns trigger language plpgsql security definer set search_path=public as $$
begin
  new.atualizado_em := now();
  new.alterado_por := auth.uid();
  return new;
end;$$;

drop trigger if exists trg_mensalidades_config_2027 on public.mensalidades_config_2027;
create trigger trg_mensalidades_config_2027
before update on public.mensalidades_config_2027
for each row execute function public.tg_mensalidades_config_2027();

-- 4) Desativa mensalidades antigas, sem excluir histórico.
update public.produtos_comerciais
set ativo=false, updated_at=now()
where categoria='Mensalidade'
  and id not in ('mensalidade-plano-a','mensalidade-plano-b');

-- 5) Função oficial de espelhamento para o Atendimento.
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
    ('mensalidade-plano-a','Plano A • '||new.plano_a_parcelas||'x','Mensalidade','Plano A',series,
     new.valor_2026_ate_vencimento,
     case when new.valor_2026_ate_vencimento<>0 then ((new.plano_a_ate_vencimento-new.valor_2026_ate_vencimento)/new.valor_2026_ate_vencimento)*100 else 0 end,
     new.plano_a_ate_vencimento,new.plano_a_parcelas,new.valor_2026_ate_vencimento,new.plano_a_ate_vencimento,
     'mensal',true,true,
     'Até o vencimento: R$ '||replace(to_char(new.plano_a_ate_vencimento,'FM999999990D00'),'.',',')||
     ' • Após o vencimento: R$ '||replace(to_char(new.plano_a_apos_vencimento,'FM999999990D00'),'.',',')||
     ' • Aplicável do Infantil I ao 5º ano.','2027-01-01')
  on conflict (id) do update set
    produto=excluded.produto,categoria=excluded.categoria,plano=excluded.plano,serie_aplicavel=excluded.serie_aplicavel,
    valor_2026=excluded.valor_2026,reajuste_percentual=excluded.reajuste_percentual,valor_2027=excluded.valor_2027,
    quantidade_parcelas=excluded.quantidade_parcelas,valor_parcela_2026=excluded.valor_parcela_2026,
    valor_parcela_2027=excluded.valor_parcela_2027,periodicidade=excluded.periodicidade,
    obrigatorio=true,ativo=true,observacao=excluded.observacao,updated_at=now();

  insert into public.produtos_comerciais
    (id,produto,categoria,plano,serie_aplicavel,valor_2026,reajuste_percentual,valor_2027,
     quantidade_parcelas,valor_parcela_2026,valor_parcela_2027,periodicidade,obrigatorio,ativo,observacao,vigencia_inicio)
  values
    ('mensalidade-plano-b','Plano B • '||new.plano_b_parcelas||'x','Mensalidade','Plano B',series,
     new.valor_2026_ate_vencimento,
     case when new.valor_2026_ate_vencimento<>0 then ((new.plano_b_ate_vencimento-new.valor_2026_ate_vencimento)/new.valor_2026_ate_vencimento)*100 else 0 end,
     new.plano_b_ate_vencimento,new.plano_b_parcelas,new.valor_2026_ate_vencimento,new.plano_b_ate_vencimento,
     'mensal',true,true,
     'Até o vencimento: R$ '||replace(to_char(new.plano_b_ate_vencimento,'FM999999990D00'),'.',',')||
     ' • Após o vencimento: R$ '||replace(to_char(new.plano_b_apos_vencimento,'FM999999990D00'),'.',',')||
     ' • Aplicável do Infantil I ao 5º ano.','2027-01-01')
  on conflict (id) do update set
    produto=excluded.produto,categoria=excluded.categoria,plano=excluded.plano,serie_aplicavel=excluded.serie_aplicavel,
    valor_2026=excluded.valor_2026,reajuste_percentual=excluded.reajuste_percentual,valor_2027=excluded.valor_2027,
    quantidade_parcelas=excluded.quantidade_parcelas,valor_parcela_2026=excluded.valor_parcela_2026,
    valor_parcela_2027=excluded.valor_parcela_2027,periodicidade=excluded.periodicidade,
    obrigatorio=true,ativo=true,observacao=excluded.observacao,updated_at=now();

  return new;
end;$$;

drop trigger if exists trg_sincronizar_mensalidades_atendimento_2027 on public.mensalidades_config_2027;
create trigger trg_sincronizar_mensalidades_atendimento_2027
after insert or update on public.mensalidades_config_2027
for each row execute function public.sincronizar_mensalidades_atendimento_2027();

-- 6) Realtime.
do $$ begin
 alter publication supabase_realtime add table public.produtos_comerciais;
exception when duplicate_object then null; end $$;

do $$ begin
 alter publication supabase_realtime add table public.mensalidades_config_2027;
exception when duplicate_object then null; end $$;

-- 7) Força apenas o espelhamento do registro atual; não muda preço.
update public.mensalidades_config_2027
set atualizado_em=atualizado_em
where id=1;

-- 8) Conferência final.
select id,aplicacao,valor_2026_ate_vencimento,valor_2026_apos_vencimento,
       plano_a_parcelas,plano_a_ate_vencimento,plano_a_apos_vencimento,
       plano_b_parcelas,plano_b_ate_vencimento,plano_b_apos_vencimento
from public.mensalidades_config_2027 where id=1;

select id,produto,plano,valor_2026,reajuste_percentual,valor_2027,quantidade_parcelas,ativo
from public.produtos_comerciais
where id in ('mensalidade-plano-a','mensalidade-plano-b')
order by id;

select count(*) as mensalidades_ativas
from public.produtos_comerciais
where categoria='Mensalidade' and ativo=true;

select 'MENSALIDADES DO ATENDIMENTO CRIADAS, CORRIGIDAS E INTEGRADAS' as status;
