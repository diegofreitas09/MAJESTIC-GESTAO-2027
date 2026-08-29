-- MAJESTIC 2027 — ATENDIMENTO INTELIGENTE
-- Execute uma vez no SQL Editor do Supabase.

alter table public.gestao_clientes add column if not exists data_nascimento date;
alter table public.gestao_clientes add column if not exists idade integer;
alter table public.gestao_clientes add column if not exists bairro text;
alter table public.gestao_clientes add column if not exists escola_atual text;
alter table public.gestao_clientes add column if not exists possui_laudo boolean not null default false;
alter table public.gestao_clientes add column if not exists observacao_laudo text;
alter table public.gestao_clientes add column if not exists turno_preferencia text;
alter table public.gestao_clientes add column if not exists modalidade text;
alter table public.gestao_clientes add column if not exists interesse_principal text;
alter table public.gestao_clientes add column if not exists proximo_contato_at timestamptz;
alter table public.gestao_clientes add column if not exists motivo_perda text;

alter table public.gestao_atendimentos add column if not exists progresso_percentual integer not null default 10;
alter table public.gestao_atendimentos add column if not exists proximo_passo text;
alter table public.gestao_atendimentos add column if not exists proximo_contato_at timestamptz;
alter table public.gestao_atendimentos add column if not exists visita_agendada_at timestamptz;
alter table public.gestao_atendimentos add column if not exists visita_realizada boolean not null default false;
alter table public.gestao_atendimentos add column if not exists proposta_apresentada boolean not null default false;
alter table public.gestao_atendimentos add column if not exists familia_confirmou_interesse boolean not null default false;

create index if not exists idx_gestao_clientes_bairro on public.gestao_clientes(bairro);
create index if not exists idx_gestao_clientes_serie on public.gestao_clientes(serie);
create index if not exists idx_gestao_clientes_turno on public.gestao_clientes(turno_preferencia);
create index if not exists idx_gestao_atendimentos_funcionario on public.gestao_atendimentos(funcionario_id);
create index if not exists idx_gestao_atendimentos_periodo on public.gestao_atendimentos(iniciado_at desc);

create or replace view public.vw_gestao_atendimentos_detalhado
with (security_invoker = true)
as
select a.id,a.cliente_id,a.funcionario_id,a.funcionario_nome,a.status,a.etapa,a.progresso_percentual,
       a.iniciado_at,a.encerrado_at,a.updated_at,a.proximo_passo,a.proximo_contato_at,
       c.nome_responsavel,c.nome_aluno,c.telefone,c.email,c.data_nascimento,c.idade,c.bairro,
       c.escola_atual,c.possui_laudo,c.serie,c.turno_preferencia,c.modalidade,c.tipo_aluno,c.origem,
       c.interesse_principal,c.matriculado,c.matriculado_at,c.motivo_perda
from public.gestao_atendimentos a
join public.gestao_clientes c on c.id=a.cliente_id;
