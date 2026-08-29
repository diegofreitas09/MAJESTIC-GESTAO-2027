-- MAJESTIC 2027 — ORÇAMENTO DO ATENDIMENTO
-- Execute uma vez no SQL Editor do Supabase.

alter table public.gestao_atendimentos
  add column if not exists orcamento_json jsonb not null default '[]'::jsonb;

alter table public.gestao_atendimentos
  add column if not exists valor_orcamento numeric(12,2) not null default 0;

-- A view já existe com outra ordem de colunas. PostgreSQL não permite
-- create or replace quando a nova definição muda a posição/nome das colunas.
-- Por isso, recriamos a view de forma segura.
drop view if exists public.vw_gestao_atendimentos_detalhado;

create view public.vw_gestao_atendimentos_detalhado
with (security_invoker = true)
as
select
  a.id,
  a.cliente_id,
  a.funcionario_id,
  a.funcionario_nome,
  a.status,
  a.etapa,
  a.progresso_percentual,
  a.iniciado_at,
  a.encerrado_at,
  a.updated_at,
  a.proximo_passo,
  a.proximo_contato_at,
  a.orcamento_json,
  a.valor_orcamento,
  c.nome_responsavel,
  c.nome_aluno,
  c.telefone,
  c.email,
  c.data_nascimento,
  c.idade,
  c.bairro,
  c.escola_atual,
  c.possui_laudo,
  c.serie,
  c.turno_preferencia,
  c.modalidade,
  c.tipo_aluno,
  c.origem,
  c.interesse_principal,
  c.matriculado,
  c.matriculado_at,
  c.motivo_perda
from public.gestao_atendimentos a
join public.gestao_clientes c on c.id = a.cliente_id;
