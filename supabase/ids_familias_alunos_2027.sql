-- MAJESTIC 2027 — IDENTIFICAÇÃO ORGANIZADA DE FAMÍLIAS E ALUNOS
-- Uma família possui um ID único; cada aluno possui seu próprio ID.

alter table public.gestao_clientes
  add column if not exists codigo_familia text;

create unique index if not exists ux_gestao_clientes_codigo_familia
  on public.gestao_clientes(codigo_familia)
  where codigo_familia is not null;

create sequence if not exists public.seq_codigo_familia_2027 start 1;
create sequence if not exists public.seq_codigo_aluno_2027 start 1;

create or replace function public.fn_codigo_familia_2027()
returns trigger
language plpgsql
set search_path=public
as $$
begin
  if new.codigo_familia is null or btrim(new.codigo_familia)='' then
    new.codigo_familia := 'F2027-' || lpad(nextval('public.seq_codigo_familia_2027')::text,5,'0');
  end if;
  return new;
end;
$$;

drop trigger if exists trg_codigo_familia_2027 on public.gestao_clientes;
create trigger trg_codigo_familia_2027
before insert on public.gestao_clientes
for each row execute function public.fn_codigo_familia_2027();

create or replace function public.fn_codigo_aluno_2027()
returns trigger
language plpgsql
set search_path=public
as $$
begin
  if new.codigo_aluno is null or btrim(new.codigo_aluno)='' then
    new.codigo_aluno := 'A2027-' || lpad(nextval('public.seq_codigo_aluno_2027')::text,5,'0');
  end if;
  return new;
end;
$$;

drop trigger if exists trg_codigo_aluno_2027 on public.alunos;
create trigger trg_codigo_aluno_2027
before insert on public.alunos
for each row execute function public.fn_codigo_aluno_2027();

-- Backfill seguro dos registros existentes.
update public.gestao_clientes
set codigo_familia='F2027-' || lpad(nextval('public.seq_codigo_familia_2027')::text,5,'0')
where codigo_familia is null or btrim(codigo_familia)='';

update public.alunos
set codigo_aluno='A2027-' || lpad(nextval('public.seq_codigo_aluno_2027')::text,5,'0'),
    atualizado_em=now()
where codigo_aluno is null or btrim(codigo_aluno)='';

-- View de famílias: preparada para futuramente agrupar irmãos sob o mesmo responsável.
create or replace view public.vw_familias_2027
with (security_invoker=true)
as
select
  c.id as cliente_id,
  c.codigo_familia,
  c.nome_responsavel,
  c.telefone,
  c.email,
  c.bairro,
  c.origem,
  count(distinct a.id) as total_alunos
from public.gestao_clientes c
left join public.alunos a on a.cliente_id=c.id
where c.matriculado=true
group by c.id,c.codigo_familia,c.nome_responsavel,c.telefone,c.email,c.bairro,c.origem;

select 'IDS DE FAMILIAS E ALUNOS 2027 ORGANIZADOS' as status;
