-- MAJESTIC 2027 — EXPOR IDS DE FAMÍLIA E ALUNO NA BASE ACADÊMICA

drop view if exists public.vw_lista_alunos_2027;

create view public.vw_lista_alunos_2027
with (security_invoker = true)
as
select
  m.id as matricula_id,
  a.id as aluno_id,
  a.cliente_id,
  c.codigo_familia,
  a.codigo_aluno,
  coalesce(nullif(m.nome_para_lista,''),nullif(a.nome_social,''),a.nome_completo) as aluno,
  m.nome_para_lista as nome_lista,
  a.nome_completo,
  a.nome_social,
  a.data_nascimento,
  a.sexo,
  m.ano_letivo,
  m.serie,
  m.turma,
  m.turno,
  m.sala,
  m.modalidade,
  m.numero_chamada,
  m.ordem_alfabetica,
  m.status,
  m.data_matricula,
  coalesce(nullif(m.responsavel_nome,''),c.nome_responsavel) as responsavel_nome,
  coalesce(nullif(m.responsavel_telefone,''),c.telefone) as responsavel_telefone,
  coalesce(nullif(m.responsavel_email,''),c.email) as responsavel_email,
  coalesce(nullif(m.origem,''),c.origem) as origem,
  m.atendente_id,
  m.atendente_nome,
  m.observacoes,
  m.observacao_pedagogica
from public.matriculas_academicas m
join public.alunos a on a.id=m.aluno_id
left join public.gestao_clientes c on c.id=a.cliente_id
where m.ano_letivo=2027 and m.status='matriculado';

select 'IDS EXPOSTOS NA BASE ACADEMICA 2027' as status;
