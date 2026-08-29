-- MAJESTIC 2027 — CRM DA GESTÃO DE SUCESSO
-- Cadastro único da família/aluno + histórico de atendimentos + conversão em matrícula.

create table if not exists public.gestao_clientes (
  id uuid primary key default gen_random_uuid(),
  nome_responsavel text not null,
  nome_aluno text not null,
  telefone text,
  email text,
  serie text,
  tipo_aluno text not null default 'novato' check (tipo_aluno in ('novato','veterano')),
  origem text,
  status_funil text not null default 'novo' check (status_funil in ('novo','contato','interesse_confirmado','visita_agendada','visita_realizada','proposta','aguardando_autorizacao','documentacao','pagamento','matriculado','perdido')),
  matriculado boolean not null default false,
  matriculado_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.gestao_atendimentos (
  id uuid primary key default gen_random_uuid(),
  cliente_id uuid not null references public.gestao_clientes(id) on delete cascade,
  funcionario_id uuid references public.profiles(id),
  funcionario_nome text not null,
  status text not null default 'em_andamento' check (status in ('em_andamento','concluido')),
  etapa text not null default 'contato' check (etapa in ('novo','contato','interesse_confirmado','visita_agendada','visita_realizada','proposta','aguardando_autorizacao','documentacao','pagamento','matriculado','perdido')),
  observacao_abertura text,
  observacao_fechamento text,
  iniciado_at timestamptz not null default now(),
  encerrado_at timestamptz,
  updated_at timestamptz not null default now()
);

create index if not exists idx_gestao_clientes_telefone on public.gestao_clientes(telefone);
create index if not exists idx_gestao_clientes_email on public.gestao_clientes(email);
create index if not exists idx_gestao_clientes_status on public.gestao_clientes(status_funil);
create index if not exists idx_gestao_clientes_tipo on public.gestao_clientes(tipo_aluno);
create index if not exists idx_gestao_atendimentos_cliente on public.gestao_atendimentos(cliente_id);
create index if not exists idx_gestao_atendimentos_status on public.gestao_atendimentos(status);
create index if not exists idx_gestao_atendimentos_inicio on public.gestao_atendimentos(iniciado_at desc);

alter table public.gestao_clientes enable row level security;
alter table public.gestao_atendimentos enable row level security;

drop policy if exists "staff ve clientes gestao" on public.gestao_clientes;
drop policy if exists "staff cria clientes gestao" on public.gestao_clientes;
drop policy if exists "staff atualiza clientes gestao" on public.gestao_clientes;
drop policy if exists "staff ve atendimentos gestao" on public.gestao_atendimentos;
drop policy if exists "staff cria atendimentos gestao" on public.gestao_atendimentos;
drop policy if exists "staff atualiza atendimentos gestao" on public.gestao_atendimentos;

create policy "staff ve clientes gestao" on public.gestao_clientes
for select to authenticated using (public.is_staff());
create policy "staff cria clientes gestao" on public.gestao_clientes
for insert to authenticated with check (public.is_staff());
create policy "staff atualiza clientes gestao" on public.gestao_clientes
for update to authenticated using (public.is_staff()) with check (public.is_staff());

create policy "staff ve atendimentos gestao" on public.gestao_atendimentos
for select to authenticated using (public.is_staff());
create policy "staff cria atendimentos gestao" on public.gestao_atendimentos
for insert to authenticated with check (public.is_staff());
create policy "staff atualiza atendimentos gestao" on public.gestao_atendimentos
for update to authenticated using (public.is_staff()) with check (public.is_staff());

create or replace view public.vw_gestao_funil
with (security_invoker = true)
as
select
  count(*) as cadastros,
  count(*) filter (where status_funil not in ('matriculado','perdido')) as em_andamento,
  count(*) filter (where matriculado = true and tipo_aluno = 'novato') as matriculas_novatos,
  count(*) filter (where matriculado = true and tipo_aluno = 'veterano') as matriculas_veteranos,
  count(*) filter (where matriculado = true) as matriculas_total,
  round((count(*) filter (where matriculado = true)::numeric / nullif(count(*),0))*100,2) as conversao_percentual
from public.gestao_clientes;

create or replace view public.vw_gestao_atendimentos_abertos
with (security_invoker = true)
as
select
  a.id,
  a.cliente_id,
  c.nome_aluno,
  c.nome_responsavel,
  c.telefone,
  c.tipo_aluno,
  c.status_funil,
  a.funcionario_nome,
  a.status,
  a.etapa,
  a.iniciado_at,
  a.updated_at
from public.gestao_atendimentos a
join public.gestao_clientes c on c.id = a.cliente_id
where a.status = 'em_andamento';
