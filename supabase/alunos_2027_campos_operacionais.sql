-- MAJESTIC 2027 — COMPLEMENTO DA BASE ACADÊMICA
-- Campos operacionais para listas de chamada, assinatura, etiquetas e organização por turma.

alter table public.alunos
  add column if not exists nome_social text,
  add column if not exists sexo text,
  add column if not exists cpf text,
  add column if not exists rg text,
  add column if not exists nacionalidade text,
  add column if not exists naturalidade text,
  add column if not exists endereco text,
  add column if not exists numero text,
  add column if not exists complemento text,
  add column if not exists bairro text,
  add column if not exists cidade text,
  add column if not exists uf text,
  add column if not exists cep text;

alter table public.matriculas_academicas
  add column if not exists sala text,
  add column if not exists ordem_alfabetica integer,
  add column if not exists nome_para_lista text,
  add column if not exists autorizado_imagem boolean,
  add column if not exists observacao_pedagogica text;

create index if not exists ix_matriculas_lista_2027
  on public.matriculas_academicas (ano_letivo, serie, turno, turma, numero_chamada, status);

create or replace view public.vw_lista_alunos_2027
with (security_invoker=true)
as
select
  m.matricula_id,
  m.aluno_id,
  m.codigo_aluno,
  coalesce(nullif(a.nome_social,''),a.nome_completo) as aluno,
  a.nome_completo,
  a.data_nascimento,
  a.sexo,
  m.serie,
  m.turma,
  m.turno,
  m.modalidade,
  m.numero_chamada,
  m.status,
  m.data_matricula,
  m.responsavel_nome,
  m.responsavel_telefone,
  m.responsavel_email,
  m.origem,
  m.atendente_nome
from public.vw_alunos_matriculados_2027 m
join public.alunos a on a.id=m.aluno_id;

create or replace view public.vw_turmas_resumo_2027
with (security_invoker=true)
as
select
  serie,
  coalesce(turma,'A definir') as turma,
  turno,
  count(*) as total_alunos
from public.vw_alunos_matriculados_2027
group by serie,coalesce(turma,'A definir'),turno
order by serie,turno,turma;

select 'CAMPOS OPERACIONAIS DOS ALUNOS 2027 INSTALADOS' as status;
