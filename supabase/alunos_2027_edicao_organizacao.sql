-- MAJESTIC 2027 — EDIÇÃO E ORGANIZAÇÃO ACADÊMICA
-- Expõe os campos necessários para editar aluno, turma e chamada pelo App da Direção.

create or replace view public.vw_lista_alunos_2027
with (security_invoker=true)
as
select
  m.id as matricula_id,
  a.id as aluno_id,
  a.cliente_id,
  a.codigo_aluno,
  coalesce(nullif(a.nome_social,''),a.nome_completo) as aluno,
  a.nome_completo,
  a.nome_social,
  a.data_nascimento,
  a.sexo,
  a.cpf,
  a.rg,
  a.nacionalidade,
  a.naturalidade,
  a.endereco,
  a.numero,
  a.complemento,
  a.bairro,
  a.cidade,
  a.uf,
  a.cep,
  m.ano_letivo,
  m.serie,
  m.turma,
  m.turno,
  m.sala,
  m.modalidade,
  m.numero_chamada,
  m.ordem_alfabetica,
  coalesce(nullif(m.nome_para_lista,''),nullif(a.nome_social,''),a.nome_completo) as nome_lista,
  m.nome_para_lista,
  m.status,
  m.data_matricula,
  m.data_inicio,
  m.data_saida,
  m.responsavel_nome,
  m.responsavel_telefone,
  m.responsavel_email,
  m.origem,
  m.atendente_id,
  m.atendente_nome,
  m.autorizado_imagem,
  m.observacao_pedagogica,
  m.observacoes
from public.matriculas_academicas m
join public.alunos a on a.id=m.aluno_id
where m.ano_letivo=2027 and m.status='matriculado';

create or replace view public.vw_turmas_resumo_2027
with (security_invoker=true)
as
select
  serie,
  coalesce(turma,'A definir') as turma,
  turno,
  coalesce(sala,'A definir') as sala,
  count(*) as total_alunos
from public.matriculas_academicas
where ano_letivo=2027 and status='matriculado'
group by serie,coalesce(turma,'A definir'),turno,coalesce(sala,'A definir')
order by serie,turno,turma,sala;

select 'EDIÇÃO E ORGANIZAÇÃO DOS ALUNOS 2027 LIBERADA' as status;
