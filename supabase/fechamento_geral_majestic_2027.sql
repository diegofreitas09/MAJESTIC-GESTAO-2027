-- MAJESTIC 2027 — FECHAMENTO GERAL NO MODELO CORA
-- Uma linha por série/modalidade, com Plano A (12x) e Plano B (13x),
-- ambos com valor até o vencimento e após o vencimento.
-- Todos os campos comerciais ficam editáveis pela Direção.

create table if not exists public.fechamento_comercial_2027 (
  id uuid primary key default gen_random_uuid(),
  ordem integer not null default 0,
  serie text not null,
  modalidade text not null default 'Regular',
  valor_base_2026 numeric(12,2) not null default 0,
  reajuste_percentual numeric(8,3) not null default 0,
  plano_a_parcelas integer not null default 12,
  plano_a_ate_vencimento numeric(12,2) not null default 0,
  plano_a_apos_vencimento numeric(12,2) not null default 0,
  plano_b_parcelas integer not null default 13,
  plano_b_ate_vencimento numeric(12,2) not null default 0,
  plano_b_apos_vencimento numeric(12,2) not null default 0,
  observacao text,
  ativo boolean not null default true,
  criado_em timestamptz not null default now(),
  atualizado_em timestamptz not null default now(),
  alterado_por uuid references public.profiles(id) on delete set null
);

create unique index if not exists ux_fechamento_2027_serie_modalidade
  on public.fechamento_comercial_2027 (serie, modalidade)
  where ativo=true;

alter table public.fechamento_comercial_2027 enable row level security;

drop policy if exists fechamento_2027_select on public.fechamento_comercial_2027;
create policy fechamento_2027_select
on public.fechamento_comercial_2027 for select to authenticated
using (exists(select 1 from public.profiles p where p.id=auth.uid() and p.ativo=true));

drop policy if exists fechamento_2027_direcao_write on public.fechamento_comercial_2027;
create policy fechamento_2027_direcao_write
on public.fechamento_comercial_2027 for all to authenticated
using (exists(select 1 from public.profiles p where p.id=auth.uid() and p.ativo=true and p.role::text='direcao'))
with check (exists(select 1 from public.profiles p where p.id=auth.uid() and p.ativo=true and p.role::text='direcao'));

create or replace function public.tg_fechamento_2027_auditoria()
returns trigger language plpgsql security definer set search_path=public as $$
begin
  new.atualizado_em := now();
  new.alterado_por := auth.uid();
  return new;
end;$$;

drop trigger if exists trg_fechamento_2027_auditoria on public.fechamento_comercial_2027;
create trigger trg_fechamento_2027_auditoria
before insert or update on public.fechamento_comercial_2027
for each row execute function public.tg_fechamento_2027_auditoria();

-- Base Majestic: séries separadas. Não inventa valores de 2027.
-- Usa apenas a referência 2026 já conhecida para deixar o fechamento pronto para preenchimento.
insert into public.fechamento_comercial_2027
(ordem,serie,modalidade,valor_base_2026,plano_a_parcelas,plano_b_parcelas)
values
(1,'Berçário','Regular',0,12,13),
(2,'Infantil I','Regular',677.48,12,13),
(3,'Infantil II','Regular',608.27,12,13),
(4,'Infantil III','Regular',608.27,12,13),
(5,'Infantil IV','Regular',608.27,12,13),
(6,'Infantil V','Regular',608.27,12,13),
(7,'1º ano','Regular',608.27,12,13),
(8,'2º ano','Regular',608.27,12,13),
(9,'3º ano','Regular',608.27,12,13),
(10,'4º ano','Regular',608.27,12,13),
(11,'5º ano','Regular',608.27,12,13)
on conflict do nothing;

do $$ begin
  alter publication supabase_realtime add table public.fechamento_comercial_2027;
exception when duplicate_object then null; end $$;

select 'FECHAMENTO GERAL MAJESTIC 2027 LIBERADO' as status;
