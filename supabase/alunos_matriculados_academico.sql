-- MAJESTIC 2027 — BASE ACADÊMICA DE ALUNOS MATRICULADOS
-- Objetivo: transformar a matrícula comercial em cadastro acadêmico reutilizável
-- para listas por série/turma, chamada, assinatura, etiquetas e documentos.

create table if not exists public.alunos (
  id uuid primary key default gen_random_uuid(),
  cliente_id uuid references public.gestao_clientes(id) on delete set null,
  nome_completo text not null,
  data_nascimento date,
  sexo text,
  cpf text,
  rg text,
  codigo_aluno text,
  observacoes text,
  ativo boolean not null default true,
  criado_em timestamptz not null default now(),
  atualizado_em timestamptz not null default now()
);

create unique index if not exists ux_alunos_codigo_aluno
  on public.alunos (codigo_aluno)
  where codigo_aluno is not null;

create index if not exists ix_alunos_nome on public.alunos (lower(nome_completo));
create index if not exists ix_alunos_cliente on public.alunos (cliente_id);

create table if not exists public.matriculas_academicas (
  id uuid primary key default gen_random_uuid(),
  aluno_id uuid not null references public.alunos(id) on delete restrict,
  ano_letivo integer not null default 2027,
  serie text not null,
  turma text,
  turno text not null,
  modalidade text default 'Regular',
  numero_chamada integer,
  status text not null default 'matriculado',
  data_matricula date not null default current_date,
  data_inicio date,
  data_saida date,
  origem text,
  atendente_id uuid references public.atendentes(id) on delete set null,
  atendente_nome text,
  responsavel_nome text,
  responsavel_telefone text,
  responsavel_email text,
  observacoes text,
  criado_em timestamptz not null default now(),
  atualizado_em timestamptz not null default now(),
  constraint ck_matriculas_status check (status in ('pre_matricula','matriculado','transferido','cancelado','inativo'))
);

create unique index if not exists ux_matricula_aluno_ano
  on public.matriculas_academicas (aluno_id, ano_letivo)
  where status in ('pre_matricula','matriculado');

create index if not exists ix_matriculas_serie_turno
  on public.matriculas_academicas (ano_letivo, serie, turma, turno, status);

-- RLS
alter table public.alunos enable row level security;
alter table public.matriculas_academicas enable row level security;

-- Leitura: qualquer usuário autenticado e ativo do sistema.
drop policy if exists "alunos_select_ativos" on public.alunos;
create policy "alunos_select_ativos"
on public.alunos for select to authenticated
using (exists (select 1 from public.profiles p where p.id=auth.uid() and p.ativo=true));

drop policy if exists "matriculas_academicas_select_ativos" on public.matriculas_academicas;
create policy "matriculas_academicas_select_ativos"
on public.matriculas_academicas for select to authenticated
using (exists (select 1 from public.profiles p where p.id=auth.uid() and p.ativo=true));

-- Escrita: Direção, Gestão e Matrícula.
drop policy if exists "alunos_insert_equipe" on public.alunos;
create policy "alunos_insert_equipe"
on public.alunos for insert to authenticated
with check (exists (select 1 from public.profiles p where p.id=auth.uid() and p.ativo=true and p.role::text in ('direcao','gestao','matricula')));

drop policy if exists "alunos_update_equipe" on public.alunos;
create policy "alunos_update_equipe"
on public.alunos for update to authenticated
using (exists (select 1 from public.profiles p where p.id=auth.uid() and p.ativo=true and p.role::text in ('direcao','gestao','matricula')))
with check (exists (select 1 from public.profiles p where p.id=auth.uid() and p.ativo=true and p.role::text in ('direcao','gestao','matricula')));

drop policy if exists "matriculas_academicas_insert_equipe" on public.matriculas_academicas;
create policy "matriculas_academicas_insert_equipe"
on public.matriculas_academicas for insert to authenticated
with check (exists (select 1 from public.profiles p where p.id=auth.uid() and p.ativo=true and p.role::text in ('direcao','gestao','matricula')));

drop policy if exists "matriculas_academicas_update_equipe" on public.matriculas_academicas;
create policy "matriculas_academicas_update_equipe"
on public.matriculas_academicas for update to authenticated
using (exists (select 1 from public.profiles p where p.id=auth.uid() and p.ativo=true and p.role::text in ('direcao','gestao','matricula')))
with check (exists (select 1 from public.profiles p where p.id=auth.uid() and p.ativo=true and p.role::text in ('direcao','gestao','matricula')));

-- Visão acadêmica pronta para listas e relatórios.
create or replace view public.vw_alunos_matriculados_2027
with (security_invoker=true)
as
select
  m.id as matricula_id,
  a.id as aluno_id,
  a.cliente_id,
  a.codigo_aluno,
  a.nome_completo as aluno,
  a.data_nascimento,
  m.ano_letivo,
  m.serie,
  m.turma,
  m.turno,
  m.modalidade,
  m.numero_chamada,
  m.status,
  m.data_matricula,
  m.origem,
  m.atendente_id,
  m.atendente_nome,
  m.responsavel_nome,
  m.responsavel_telefone,
  m.responsavel_email,
  m.observacoes
from public.matriculas_academicas m
join public.alunos a on a.id=m.aluno_id
where m.ano_letivo=2027 and m.status='matriculado';

-- Função: ao confirmar matrícula no CRM, cria/atualiza automaticamente o cadastro acadêmico.
create or replace function public.fn_sincronizar_aluno_matriculado_2027()
returns trigger
language plpgsql
security definer
set search_path=public
as $$
declare
  v_aluno_id uuid;
  v_atendimento record;
begin
  if new.matriculado is distinct from true then
    return new;
  end if;

  select ga.atendente_id, ga.atendente_nome
    into v_atendimento
  from public.gestao_atendimentos ga
  where ga.cliente_id=new.id
  order by ga.iniciado_at desc
  limit 1;

  select id into v_aluno_id
  from public.alunos
  where cliente_id=new.id
  order by criado_em asc
  limit 1;

  if v_aluno_id is null then
    insert into public.alunos (cliente_id,nome_completo,data_nascimento)
    values (new.id,new.nome_aluno,new.data_nascimento)
    returning id into v_aluno_id;
  else
    update public.alunos
       set nome_completo=new.nome_aluno,
           data_nascimento=new.data_nascimento,
           atualizado_em=now(),
           ativo=true
     where id=v_aluno_id;
  end if;

  insert into public.matriculas_academicas (
    aluno_id,ano_letivo,serie,turno,modalidade,status,data_matricula,origem,
    atendente_id,atendente_nome,responsavel_nome,responsavel_telefone,responsavel_email
  ) values (
    v_aluno_id,2027,coalesce(new.serie,'Não informado'),coalesce(new.turno_preferencia,'Não informado'),
    coalesce(new.modalidade,'Regular'),'matriculado',coalesce(new.matriculado_at::date,current_date),new.origem,
    v_atendimento.atendente_id,v_atendimento.atendente_nome,new.nome_responsavel,new.telefone,new.email
  )
  on conflict (aluno_id,ano_letivo) where status in ('pre_matricula','matriculado')
  do update set
    serie=excluded.serie,
    turno=excluded.turno,
    modalidade=excluded.modalidade,
    status='matriculado',
    data_matricula=excluded.data_matricula,
    origem=excluded.origem,
    atendente_id=excluded.atendente_id,
    atendente_nome=excluded.atendente_nome,
    responsavel_nome=excluded.responsavel_nome,
    responsavel_telefone=excluded.responsavel_telefone,
    responsavel_email=excluded.responsavel_email,
    atualizado_em=now();

  return new;
end;
$$;

drop trigger if exists trg_sincronizar_aluno_matriculado_2027 on public.gestao_clientes;
create trigger trg_sincronizar_aluno_matriculado_2027
after insert or update of matriculado, nome_aluno, data_nascimento, serie, turno_preferencia, modalidade, origem, nome_responsavel, telefone, email
on public.gestao_clientes
for each row
when (new.matriculado=true)
execute function public.fn_sincronizar_aluno_matriculado_2027();

-- Backfill dos alunos já marcados como matriculados no CRM.
update public.gestao_clientes
set updated_at=now()
where matriculado=true;

select 'BASE ACADÊMICA DE ALUNOS 2027 INSTALADA' as status;
