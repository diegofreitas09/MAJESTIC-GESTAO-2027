-- MAJESTIC 2027 — ATENDENTES OPERACIONAIS
-- Direção cadastra a equipe; Gestão seleciona quem realizou cada atendimento.

create table if not exists public.atendentes (
  id uuid primary key default gen_random_uuid(),
  nome text not null,
  ativo boolean not null default true,
  ordem integer not null default 0,
  criado_em timestamptz not null default now(),
  atualizado_em timestamptz not null default now()
);

create unique index if not exists ux_atendentes_nome_lower
  on public.atendentes (lower(nome));

alter table public.gestao_atendimentos
  add column if not exists atendente_id uuid references public.atendentes(id);

alter table public.gestao_atendimentos
  add column if not exists atendente_nome text;

alter table public.atendentes enable row level security;

drop policy if exists "atendentes_select_ativos" on public.atendentes;
create policy "atendentes_select_ativos"
on public.atendentes
for select
to authenticated
using (
  exists (
    select 1 from public.profiles p
    where p.id = auth.uid() and p.ativo = true
  )
);

drop policy if exists "atendentes_direcao_insert" on public.atendentes;
create policy "atendentes_direcao_insert"
on public.atendentes
for insert
to authenticated
with check (
  exists (
    select 1 from public.profiles p
    where p.id = auth.uid() and p.ativo = true and p.role::text = 'direcao'
  )
);

drop policy if exists "atendentes_direcao_update" on public.atendentes;
create policy "atendentes_direcao_update"
on public.atendentes
for update
to authenticated
using (
  exists (
    select 1 from public.profiles p
    where p.id = auth.uid() and p.ativo = true and p.role::text = 'direcao'
  )
)
with check (
  exists (
    select 1 from public.profiles p
    where p.id = auth.uid() and p.ativo = true and p.role::text = 'direcao'
  )
);

drop policy if exists "atendentes_direcao_delete" on public.atendentes;
create policy "atendentes_direcao_delete"
on public.atendentes
for delete
to authenticated
using (
  exists (
    select 1 from public.profiles p
    where p.id = auth.uid() and p.ativo = true and p.role::text = 'direcao'
  )
);

-- Auditoria automática, se a função já existir.
do $$
begin
  if to_regprocedure('public.fn_auditoria_majestic()') is not null then
    drop trigger if exists trg_auditoria_atendentes on public.atendentes;
    create trigger trg_auditoria_atendentes
    after insert or update or delete on public.atendentes
    for each row execute function public.fn_auditoria_majestic();
  end if;
end
$$;

select 'ATENDENTES OPERACIONAIS INSTALADOS' as status;
