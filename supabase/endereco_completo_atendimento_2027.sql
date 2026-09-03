-- MAJESTIC 2027 — ENDEREÇO COMPLETO NO CRM DE ATENDIMENTO
-- Execute uma vez no SQL Editor do Supabase antes de usar os novos campos.

alter table public.gestao_clientes add column if not exists cep text;
alter table public.gestao_clientes add column if not exists logradouro text;
alter table public.gestao_clientes add column if not exists numero text;
alter table public.gestao_clientes add column if not exists complemento text;
alter table public.gestao_clientes add column if not exists cidade text;
alter table public.gestao_clientes add column if not exists uf text;
alter table public.gestao_clientes add column if not exists ponto_referencia text;

create index if not exists idx_gestao_clientes_cep on public.gestao_clientes(cep);
create index if not exists idx_gestao_clientes_cidade on public.gestao_clientes(cidade);

comment on column public.gestao_clientes.cep is 'CEP da família';
comment on column public.gestao_clientes.logradouro is 'Rua, avenida ou logradouro';
comment on column public.gestao_clientes.numero is 'Número do endereço';
comment on column public.gestao_clientes.complemento is 'Complemento do endereço';
comment on column public.gestao_clientes.cidade is 'Cidade do endereço';
comment on column public.gestao_clientes.uf is 'UF do endereço';
comment on column public.gestao_clientes.ponto_referencia is 'Ponto de referência do endereço';

-- Atualiza a view detalhada, quando ela já existir, para também expor o endereço completo.
do $$
begin
  if to_regclass('public.vw_gestao_atendimentos_detalhado') is not null then
    execute $view$
      create or replace view public.vw_gestao_atendimentos_detalhado
      with (security_invoker = true)
      as
      select a.id,a.cliente_id,a.funcionario_id,a.funcionario_nome,a.status,a.etapa,a.progresso_percentual,
             a.iniciado_at,a.encerrado_at,a.updated_at,a.proximo_passo,a.proximo_contato_at,
             c.nome_responsavel,c.nome_aluno,c.telefone,c.email,c.data_nascimento,c.idade,
             c.cep,c.logradouro,c.numero,c.complemento,c.bairro,c.cidade,c.uf,c.ponto_referencia,
             c.escola_atual,c.possui_laudo,c.serie,c.turno_preferencia,c.modalidade,c.tipo_aluno,c.origem,
             c.interesse_principal,c.matriculado,c.matriculado_at,c.motivo_perda
      from public.gestao_atendimentos a
      join public.gestao_clientes c on c.id=a.cliente_id
    $view$;
  end if;
end $$;