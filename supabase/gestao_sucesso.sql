-- GESTÃO DE SUCESSO — fluxo de autorização comercial

create table if not exists public.autorizacoes_gestao (
  id uuid primary key default gen_random_uuid(),
  responsavel text not null,
  aluno text not null,
  telefone text,
  serie text,
  valor_solicitado numeric(12,2) not null default 0,
  observacao_solicitacao text,
  status text not null default 'aguardando' check (status in ('aguardando','autorizado','negado','concluido')),
  valor_autorizado numeric(12,2),
  observacao_direcao text,
  observacao_final text,
  solicitado_por uuid references public.profiles(id),
  autorizado_por uuid references public.profiles(id),
  concluido_por uuid references public.profiles(id),
  autorizado_at timestamptz,
  concluido_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_autorizacoes_gestao_status on public.autorizacoes_gestao(status);
create index if not exists idx_autorizacoes_gestao_created_at on public.autorizacoes_gestao(created_at desc);

alter table public.autorizacoes_gestao enable row level security;

-- leitura para a equipe autenticada
create policy "staff ve autorizacoes gestao" on public.autorizacoes_gestao
for select to authenticated using (public.is_staff());

-- Gestão/equipe cria pedido, mas não pode se autoautorizar
create policy "staff cria pedido gestao" on public.autorizacoes_gestao
for insert to authenticated
with check (
  public.is_staff()
  and status = 'aguardando'
  and autorizado_por is null
  and autorizado_at is null
  and concluido_por is null
  and concluido_at is null
);

-- Direção decide e define valor/observação
create policy "direcao autoriza gestao" on public.autorizacoes_gestao
for update to authenticated
using (public.is_direcao())
with check (public.is_direcao());

-- função segura para conclusão pela Gestão somente após autorização
create or replace function public.concluir_atendimento_gestao(p_id uuid, p_observacao_final text default null)
returns public.autorizacoes_gestao
language plpgsql
security definer
set search_path = public
as $$
declare
  v_reg public.autorizacoes_gestao;
begin
  if not public.is_staff() then
    raise exception 'Usuário sem permissão';
  end if;

  select * into v_reg from public.autorizacoes_gestao where id = p_id for update;
  if v_reg.id is null then
    raise exception 'Atendimento não encontrado';
  end if;
  if v_reg.status <> 'autorizado' then
    raise exception 'Atendimento ainda não autorizado pela Direção';
  end if;

  update public.autorizacoes_gestao
     set status='concluido',
         observacao_final=p_observacao_final,
         concluido_por=auth.uid(),
         concluido_at=now(),
         updated_at=now()
   where id=p_id
   returning * into v_reg;

  return v_reg;
end;
$$;

grant execute on function public.concluir_atendimento_gestao(uuid,text) to authenticated;

-- auditoria básica de mudanças de status/valor
create or replace function public.audit_autorizacoes_gestao()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.audit_logs(user_id,acao,tabela,registro_id,detalhes)
  values (
    auth.uid(),
    case when TG_OP='INSERT' then 'CRIAR_PEDIDO_GESTAO' else 'ALTERAR_PEDIDO_GESTAO' end,
    'autorizacoes_gestao',
    new.id,
    jsonb_build_object(
      'status_anterior',case when TG_OP='UPDATE' then old.status else null end,
      'status_novo',new.status,
      'valor_solicitado',new.valor_solicitado,
      'valor_autorizado',new.valor_autorizado
    )
  );
  return new;
end;
$$;

drop trigger if exists trg_audit_autorizacoes_gestao on public.autorizacoes_gestao;
create trigger trg_audit_autorizacoes_gestao
after insert or update on public.autorizacoes_gestao
for each row execute function public.audit_autorizacoes_gestao();
