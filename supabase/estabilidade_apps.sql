-- MAJESTIC 2027 — ESTABILIDADE DOS DOIS APPS
-- Execute uma vez no SQL Editor do Supabase.
-- Esta migração é idempotente e preserva os dados existentes.

-- 1) Garante colunas usadas pela versão atual do Atendimento.
alter table public.gestao_atendimentos add column if not exists orcamento_json jsonb not null default '[]'::jsonb;
alter table public.gestao_atendimentos add column if not exists valor_orcamento numeric(12,2) not null default 0;
alter table public.gestao_atendimentos add column if not exists progresso_percentual integer not null default 10;
alter table public.gestao_atendimentos add column if not exists proximo_passo text;
alter table public.gestao_atendimentos add column if not exists proximo_contato_at timestamptz;
alter table public.gestao_atendimentos add column if not exists visita_realizada boolean not null default false;
alter table public.gestao_atendimentos add column if not exists proposta_apresentada boolean not null default false;
alter table public.gestao_atendimentos add column if not exists familia_confirmou_interesse boolean not null default false;

-- 2) A interface atual usa nomes de etapas mais simples (interesse, visita, decisao).
-- O schema antigo aceitava apenas interesse_confirmado / visita_realizada etc.
-- Mantemos os dois conjuntos para compatibilidade com registros antigos e novos.
alter table public.gestao_clientes drop constraint if exists gestao_clientes_status_funil_check;
alter table public.gestao_clientes
  add constraint gestao_clientes_status_funil_check check (
    status_funil in (
      'novo','contato','perfil','interesse','interesse_confirmado',
      'visita','visita_agendada','visita_realizada','proposta','decisao',
      'aguardando_autorizacao','documentacao','pagamento','matriculado','perdido'
    )
  );

alter table public.gestao_atendimentos drop constraint if exists gestao_atendimentos_etapa_check;
alter table public.gestao_atendimentos
  add constraint gestao_atendimentos_etapa_check check (
    etapa in (
      'novo','contato','perfil','interesse','interesse_confirmado',
      'visita','visita_agendada','visita_realizada','proposta','decisao',
      'aguardando_autorizacao','documentacao','pagamento','matriculado','perdido'
    )
  );

-- 3) Índices usados nas telas e relatórios.
create index if not exists idx_gestao_atendimentos_funcionario_inicio
  on public.gestao_atendimentos(funcionario_id,iniciado_at desc);
create index if not exists idx_gestao_clientes_updated
  on public.gestao_clientes(updated_at desc);

-- 4) Recria views compartilhadas sem alterar dados.
drop view if exists public.vw_gestao_atendimentos_detalhado;
create view public.vw_gestao_atendimentos_detalhado
with (security_invoker = true)
as
select
  a.id,a.cliente_id,a.funcionario_id,a.funcionario_nome,a.status,a.etapa,a.progresso_percentual,
  a.iniciado_at,a.encerrado_at,a.updated_at,a.proximo_passo,a.proximo_contato_at,
  a.orcamento_json,a.valor_orcamento,
  c.nome_responsavel,c.nome_aluno,c.telefone,c.email,c.data_nascimento,c.idade,c.bairro,
  c.escola_atual,c.possui_laudo,c.serie,c.turno_preferencia,c.modalidade,c.tipo_aluno,c.origem,
  c.interesse_principal,c.matriculado,c.matriculado_at,c.motivo_perda
from public.gestao_atendimentos a
join public.gestao_clientes c on c.id=a.cliente_id;

-- 5) Diagnóstico final: deve retornar OK nas quatro linhas.
select 'profiles' as item, case when to_regclass('public.profiles') is not null then 'OK' else 'FALTA' end as status
union all
select 'gestao_clientes', case when to_regclass('public.gestao_clientes') is not null then 'OK' else 'FALTA' end
union all
select 'gestao_atendimentos', case when to_regclass('public.gestao_atendimentos') is not null then 'OK' else 'FALTA' end
union all
select 'autorizacoes_gestao', case when to_regclass('public.autorizacoes_gestao') is not null then 'OK' else 'FALTA' end;
