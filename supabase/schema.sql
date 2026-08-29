-- MAJESTIC GESTÃO 2027
-- Banco inicial Supabase/PostgreSQL

create extension if not exists "pgcrypto";

create type public.user_role as enum ('direcao','gestao','matricula');
create type public.lead_stage as enum ('novo','contato','visita','proposta','aguardando_documentacao','aguardando_pagamento','matriculado','perdido');
create type public.question_status as enum ('pendente','respondida','arquivada');
create type public.atendimento_tipo as enum ('procura','ligacao','whatsapp','visita','retorno','proposta','observacao');

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

create table public.atendimentos (
  id uuid primary key default gen_random_uuid(),
  interessado_id uuid references public.interessados(id) on delete cascade,
  tipo public.atendimento_tipo not null default 'procura',
  canal text,
  resumo text,
  resultado text,
  atendente_id uuid not null references public.profiles(id),
  created_at timestamptz not null default now()
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
  produto_id uuid references public.produtos(id),
  condicao_id uuid references public.condicoes_comerciais(id),
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

create or replace function public.is_direcao()
returns boolean language sql stable security definer set search_path = public as $$
  select exists(select 1 from public.profiles where id = auth.uid() and role = 'direcao' and ativo = true);
$$;

create or replace function public.is_staff()
returns boolean language sql stable security definer set search_path = public as $$
  select exists(select 1 from public.profiles where id = auth.uid() and role in ('direcao','gestao','matricula') and ativo = true);
$$;

alter table public.profiles enable row level security;
alter table public.interessados enable row level security;
alter table public.atendimentos enable row level security;
alter table public.produtos enable row level security;
alter table public.condicoes_comerciais enable row level security;
alter table public.perguntas_direcao enable row level security;
alter table public.orientacoes enable row level security;
alter table public.matriculas enable row level security;
alter table public.audit_logs enable row level security;

-- PERFIS
create policy "usuario ve proprio perfil" on public.profiles
for select to authenticated using (id = auth.uid() or public.is_direcao());
create policy "direcao gerencia perfis" on public.profiles
for update to authenticated using (public.is_direcao()) with check (public.is_direcao());

-- INTERESSADOS / CRM
create policy "staff ve interessados" on public.interessados
for select to authenticated using (public.is_staff());
create policy "staff cria interessados" on public.interessados
for insert to authenticated with check (public.is_staff());
create policy "staff atualiza interessados" on public.interessados
for update to authenticated using (public.is_staff()) with check (public.is_staff());

-- ATENDIMENTOS
create policy "staff ve atendimentos" on public.atendimentos
for select to authenticated using (public.is_staff());
create policy "staff registra atendimentos" on public.atendimentos
for insert to authenticated with check (public.is_staff() and atendente_id = auth.uid());
create policy "direcao ajusta atendimentos" on public.atendimentos
for update to authenticated using (public.is_direcao()) with check (public.is_direcao());

-- PRODUTOS E VALORES: SOMENTE DIREÇÃO ALTERA
create policy "staff consulta produtos" on public.produtos
for select to authenticated using (public.is_staff());
create policy "somente direcao cria produtos" on public.produtos
for insert to authenticated with check (public.is_direcao() and criado_por = auth.uid());
create policy "somente direcao altera produtos" on public.produtos
for update to authenticated using (public.is_direcao()) with check (public.is_direcao());
create policy "somente direcao exclui produtos" on public.produtos
for delete to authenticated using (public.is_direcao());

-- CONDIÇÕES COMERCIAIS: SOMENTE DIREÇÃO ALTERA
create policy "staff consulta condicoes" on public.condicoes_comerciais
for select to authenticated using (public.is_staff());
create policy "somente direcao cria condicoes" on public.condicoes_comerciais
for insert to authenticated with check (public.is_direcao() and autorizado_por = auth.uid());
create policy "somente direcao altera condicoes" on public.condicoes_comerciais
for update to authenticated using (public.is_direcao()) with check (public.is_direcao());
create policy "somente direcao exclui condicoes" on public.condicoes_comerciais
for delete to authenticated using (public.is_direcao());

-- PERGUNTAS / ORIENTAÇÕES
create policy "staff ve perguntas" on public.perguntas_direcao
for select to authenticated using (public.is_staff());
create policy "staff cria perguntas" on public.perguntas_direcao
for insert to authenticated with check (public.is_staff() and criada_por = auth.uid());
create policy "somente direcao responde perguntas" on public.perguntas_direcao
for update to authenticated using (public.is_direcao()) with check (public.is_direcao());

create policy "staff ve orientacoes" on public.orientacoes
for select to authenticated using (public.is_staff());
create policy "somente direcao cria orientacoes" on public.orientacoes
for insert to authenticated with check (public.is_direcao() and criado_por = auth.uid());
create policy "somente direcao altera orientacoes" on public.orientacoes
for update to authenticated using (public.is_direcao()) with check (public.is_direcao());
create policy "somente direcao exclui orientacoes" on public.orientacoes
for delete to authenticated using (public.is_direcao());

-- MATRÍCULAS
create policy "staff ve matriculas" on public.matriculas
for select to authenticated using (public.is_staff());
create policy "staff cria matriculas" on public.matriculas
for insert to authenticated with check (public.is_staff() and registrado_por = auth.uid());
create policy "direcao e gestao atualizam status de matriculas" on public.matriculas
for update to authenticated
using (exists(select 1 from public.profiles p where p.id = auth.uid() and p.role in ('direcao','gestao') and p.ativo = true))
with check (exists(select 1 from public.profiles p where p.id = auth.uid() and p.role in ('direcao','gestao') and p.ativo = true));

-- AUDITORIA: VISÍVEL À DIREÇÃO
create policy "direcao ve auditoria" on public.audit_logs
for select to authenticated using (public.is_direcao());

-- VISÃO EXECUTIVA PARA PAINEL E PDF
create or replace view public.vw_resumo_executivo as
select
  count(*) as total_procuras,
  count(*) filter (where etapa <> 'novo') as total_em_atendimento,
  count(*) filter (where etapa = 'visita') as visitas,
  count(*) filter (where etapa = 'proposta') as propostas,
  count(*) filter (where etapa = 'matriculado') as matriculas,
  round((count(*) filter (where etapa = 'matriculado')::numeric / nullif(count(*),0)) * 100, 2) as conversao_percentual
from public.interessados;

create or replace view public.vw_atendimentos_por_equipe as
select
  p.id as atendente_id,
  p.nome as atendente,
  count(a.id) as atendimentos,
  count(a.id) filter (where a.tipo = 'procura') as procuras,
  count(a.id) filter (where a.tipo = 'visita') as visitas,
  count(a.id) filter (where a.tipo = 'proposta') as propostas
from public.profiles p
left join public.atendimentos a on a.atendente_id = p.id
group by p.id, p.nome;

create index idx_interessados_etapa on public.interessados(etapa);
create index idx_interessados_atendente on public.interessados(atendente_id);
create index idx_atendimentos_tipo on public.atendimentos(tipo);
create index idx_atendimentos_atendente on public.atendimentos(atendente_id);
create index idx_perguntas_status on public.perguntas_direcao(status);
create index idx_matriculas_ano on public.matriculas(ano_letivo);
