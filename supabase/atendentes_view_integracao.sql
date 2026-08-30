-- MAJESTIC 2027 — ATENDENTE RESPONSÁVEL NA VISÃO EXECUTIVA
-- Execute após supabase/atendentes_operacionais.sql

alter table public.gestao_atendimentos
  add column if not exists atendente_id uuid references public.atendentes(id);

alter table public.gestao_atendimentos
  add column if not exists atendente_nome text;

drop view if exists public.vw_gestao_atendimentos_detalhado;

create view public.vw_gestao_atendimentos_detalhado
with (security_invoker = true)
as
select
  a.id,
  a.cliente_id,
  a.funcionario_id,
  a.funcionario_nome,
  a.atendente_id,
  a.atendente_nome,
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

create or replace view public.vw_desempenho_atendentes
with (security_invoker = true)
as
select
  coalesce(a.atendente_id::text, 'sem-atendente') as atendente_chave,
  coalesce(a.atendente_nome, a.funcionario_nome, 'Não informado') as atendente_nome,
  count(*) as atendimentos,
  count(*) filter (where a.status = 'em_andamento') as em_andamento,
  count(*) filter (where a.status = 'concluido') as concluidos,
  count(*) filter (where c.matriculado = true) as matriculas,
  round(
    case when count(*) > 0
      then (count(*) filter (where c.matriculado = true))::numeric / count(*)::numeric * 100
      else 0
    end,
    2
  ) as conversao_percentual
from public.gestao_atendimentos a
join public.gestao_clientes c on c.id = a.cliente_id
group by 1,2
order by atendimentos desc, atendente_nome;

select 'ATENDENTE RESPONSÁVEL INTEGRADO À VISÃO EXECUTIVA' as status;
