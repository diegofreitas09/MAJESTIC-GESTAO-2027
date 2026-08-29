-- MAJESTIC 2027 — SINCRONIZAÇÃO ENTRE APP EXECUTIVO E APP DA EQUIPE
-- Execute uma vez no SQL Editor do Supabase depois de criar os usuários em Authentication.

-- Garante funções de autorização baseadas no usuário autenticado.
create or replace function public.is_direcao()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists(
    select 1 from public.profiles
    where id = auth.uid() and role = 'direcao' and ativo = true
  );
$$;

create or replace function public.is_staff()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists(
    select 1 from public.profiles
    where id = auth.uid() and role in ('direcao','gestao','matricula') and ativo = true
  );
$$;

-- RLS do CRM compartilhado.
alter table public.gestao_clientes enable row level security;
alter table public.gestao_atendimentos enable row level security;
alter table public.autorizacoes_gestao enable row level security;

drop policy if exists "staff ve clientes gestao" on public.gestao_clientes;
drop policy if exists "staff cria clientes gestao" on public.gestao_clientes;
drop policy if exists "staff atualiza clientes gestao" on public.gestao_clientes;
create policy "staff ve clientes gestao" on public.gestao_clientes for select to authenticated using (public.is_staff());
create policy "staff cria clientes gestao" on public.gestao_clientes for insert to authenticated with check (public.is_staff());
create policy "staff atualiza clientes gestao" on public.gestao_clientes for update to authenticated using (public.is_staff()) with check (public.is_staff());

drop policy if exists "staff ve atendimentos gestao" on public.gestao_atendimentos;
drop policy if exists "staff cria atendimentos gestao" on public.gestao_atendimentos;
drop policy if exists "staff atualiza atendimentos gestao" on public.gestao_atendimentos;
create policy "staff ve atendimentos gestao" on public.gestao_atendimentos for select to authenticated using (public.is_staff());
create policy "staff cria atendimentos gestao" on public.gestao_atendimentos for insert to authenticated with check (public.is_staff() and funcionario_id = auth.uid());
create policy "staff atualiza atendimentos gestao" on public.gestao_atendimentos for update to authenticated using (public.is_staff()) with check (public.is_staff());

-- Views executivas respeitam o usuário/RLS.
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
  a.id,a.cliente_id,c.nome_aluno,c.nome_responsavel,c.telefone,c.tipo_aluno,c.status_funil,
  a.funcionario_id,a.funcionario_nome,a.status,a.etapa,a.iniciado_at,a.updated_at
from public.gestao_atendimentos a
join public.gestao_clientes c on c.id = a.cliente_id
where a.status='em_andamento';

-- Adiciona tabelas ao Realtime quando ainda não estiverem publicadas.
do $$
begin
  begin
    alter publication supabase_realtime add table public.gestao_clientes;
  exception when duplicate_object then null;
  end;
  begin
    alter publication supabase_realtime add table public.gestao_atendimentos;
  exception when duplicate_object then null;
  end;
  begin
    alter publication supabase_realtime add table public.autorizacoes_gestao;
  exception when duplicate_object then null;
  end;
end $$;

-- Consulta útil para conferir os usuários e papéis após criá-los.
select id,nome,email,role,ativo from public.profiles order by nome;
