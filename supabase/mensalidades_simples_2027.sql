-- MAJESTIC 2027 — MENSALIDADES SIMPLES
-- Configuração única para Infantil I ao 5º ano.
-- 2026 fica como base comparativa; 2027 possui somente Plano A e Plano B.
-- Seguro para reexecutar.

-- Remove estruturas experimentais anteriores de mensalidade/fechamento.
drop table if exists public.mensalidades_2027 cascade;
drop table if exists public.fechamento_comercial_2027 cascade;

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

insert into public.mensalidades_config_2027
(id,aplicacao,valor_2026_ate_vencimento,valor_2026_apos_vencimento,
 plano_a_parcelas,plano_a_ate_vencimento,plano_a_apos_vencimento,
 plano_b_parcelas,plano_b_ate_vencimento,plano_b_apos_vencimento)
values
(1,'Infantil I ao 5º ano',608.27,670.00,13,637.00,685.00,12,690.00,742.00)
on conflict (id) do nothing;

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

do $$ begin
  alter publication supabase_realtime add table public.mensalidades_config_2027;
exception when duplicate_object then null; end $$;

select 'MENSALIDADES SIMPLES 2027 LIBERADAS' as status;
