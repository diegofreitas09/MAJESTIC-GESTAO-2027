-- MAJESTIC GESTÃO 2027
-- Estrutura inicial do banco Supabase/PostgreSQL

create extension if not exists "pgcrypto";

create type public.user_role as enum ('direcao','gestao','matricula');
create type public.lead_stage as enum ('novo','contato','visita','proposta','aguardando_documentacao','aguardando_pagamento','matriculado','perdido');
create type public.question_status as enum ('pendente','respondida','arquivada');

create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  nome text not null,
  email text,
  role public.user_role not null default 'matricula',
  ativo boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.interessados (
  id uuid primary key default gen_random_uuid(),
  nome_aluno text not null,
  nome_responsavel text not null,
  telefone text,
  email text,
  serie_interesse text,
  origem text,
  etapa public.lead_stage not null default 'novo',
  observacoes text,
  atendente_id uuid references public.profiles(id),
  proximo_contato_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.produtos (
  id uuid primary key default gen_random_uuid(),
  nome text not null,
  descricao text,
  categoria text,
  valor numeric(12,2),
  segmento text,
  vigencia_inicio date,
  vigencia_fim date,
  publicado boolean not null default false,
  ativo boolean not null default true,
  criado_por uuid references public.profiles(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.condicoes_comerciais (
  id uuid primary key default gen_random_uuid(),
  titulo text not null,
  descricao text not null,
  tipo text,
  percentual numeric(5,2),
  valor numeric(12,2),
  segmento text,
  vigencia_inicio date,
  vigencia_fim date,
  publicado boolean not null default false,
  ativo boolean not null default true,
  autorizado_por uuid references public.profiles(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.perguntas_direcao (
  id uuid primary key default gen_random_uuid(),
  interessado_id uuid references public.interessados(id) on delete set null,
  titulo text not null,
  pergunta text not null,
  prioridade text not null default 'normal',
  status public.question_status not null default 'pendente',
  criada_por uuid not null references public.profiles(id),
  respondida_por uuid references public.profiles(id),
  resposta text,
  transformar_em_orientacao boolean not null default false,
  created_at timestamptz not null default now(),
  responded_at timestamptz,
  updated_at timestamptz not null default now()
);

create table public.orientacoes (
  id uuid primary key default gen_random_uuid(),
  titulo text not null,
  conteudo text not null,
  categoria text,
  publicado boolean not null default true,
  origem_pergunta_id uuid references public.perguntas_direcao(id) on delete set null,
  criado_por uuid references public.profiles(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.matriculas (
  id uuid primary key default gen_random_uuid(),
  interessado_id uuid not null references public.interessados(id),
  ano_letivo integer not null default 2027,
  serie text,
  valor_matricula numeric(12,2),
  valor_mensalidade numeric(12,2),
  desconto_percentual numeric(5,2) default 0,
  status text not null default 'em_andamento',
  registrado_por uuid references public.profiles(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.audit_logs (
  id bigint generated always as identity primary key,
  user_id uuid references public.profiles(id),
  acao text not null,
  tabela text,
  registro_id uuid,
  detalhes jsonb,
  created_at timestamptz not null default now()
);

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.profiles (id, nome, email, role)
  values (
    new.id,
    coalesce(new.raw_user_meta_data ->> 'nome', split_part(new.email, '@', 1)),
    new.email,
    coalesce((new.raw_user_meta_data ->> 'role')::public.user_role, 'matricula')
  );
  return new;
end;
$$;

create trigger on_auth_user_created
after insert on auth.users
for each row execute procedure public.handle_new_user();

alter table public.profiles enable row level security;
alter table public.interessados enable row level security;
alter table public.produtos enable row level security;
alter table public.condicoes_comerciais enable row level security;
alter table public.perguntas_direcao enable row level security;
alter table public.orientacoes enable row level security;
alter table public.matriculas enable row level security;
alter table public.audit_logs enable row level security;

create policy "usuario ve proprio perfil" on public.profiles
for select to authenticated using (id = auth.uid());

create policy "usuarios autenticados veem interessados" on public.interessados
for select to authenticated using (true);
create policy "usuarios autenticados criam interessados" on public.interessados
for insert to authenticated with check (true);
create policy "usuarios autenticados atualizam interessados" on public.interessados
for update to authenticated using (true) with check (true);

create policy "usuarios autenticados veem produtos" on public.produtos
for select to authenticated using (true);
create policy "direcao e gestao gerenciam produtos" on public.produtos
for all to authenticated
using (exists(select 1 from public.profiles p where p.id = auth.uid() and p.role in ('direcao','gestao')))
with check (exists(select 1 from public.profiles p where p.id = auth.uid() and p.role in ('direcao','gestao')));

create policy "usuarios autenticados veem condicoes" on public.condicoes_comerciais
for select to authenticated using (true);
create policy "direcao e gestao gerenciam condicoes" on public.condicoes_comerciais
for all to authenticated
using (exists(select 1 from public.profiles p where p.id = auth.uid() and p.role in ('direcao','gestao')))
with check (exists(select 1 from public.profiles p where p.id = auth.uid() and p.role in ('direcao','gestao')));

create policy "usuarios autenticados veem perguntas" on public.perguntas_direcao
for select to authenticated using (true);
create policy "usuarios autenticados criam perguntas" on public.perguntas_direcao
for insert to authenticated with check (criada_por = auth.uid());
create policy "direcao e gestao respondem perguntas" on public.perguntas_direcao
for update to authenticated
using (exists(select 1 from public.profiles p where p.id = auth.uid() and p.role in ('direcao','gestao')))
with check (exists(select 1 from public.profiles p where p.id = auth.uid() and p.role in ('direcao','gestao')));

create policy "usuarios autenticados veem orientacoes" on public.orientacoes
for select to authenticated using (true);
create policy "direcao e gestao gerenciam orientacoes" on public.orientacoes
for all to authenticated
using (exists(select 1 from public.profiles p where p.id = auth.uid() and p.role in ('direcao','gestao')))
with check (exists(select 1 from public.profiles p where p.id = auth.uid() and p.role in ('direcao','gestao')));

create policy "usuarios autenticados veem matriculas" on public.matriculas
for select to authenticated using (true);
create policy "usuarios autenticados criam matriculas" on public.matriculas
for insert to authenticated with check (true);
create policy "direcao e gestao atualizam matriculas" on public.matriculas
for update to authenticated
using (exists(select 1 from public.profiles p where p.id = auth.uid() and p.role in ('direcao','gestao')))
with check (exists(select 1 from public.profiles p where p.id = auth.uid() and p.role in ('direcao','gestao')));

create policy "direcao ve auditoria" on public.audit_logs
for select to authenticated
using (exists(select 1 from public.profiles p where p.id = auth.uid() and p.role = 'direcao'));

create index idx_interessados_etapa on public.interessados(etapa);
create index idx_interessados_atendente on public.interessados(atendente_id);
create index idx_perguntas_status on public.perguntas_direcao(status);
create index idx_matriculas_ano on public.matriculas(ano_letivo);
