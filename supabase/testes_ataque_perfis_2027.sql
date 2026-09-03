-- MAJESTIC 2027 — TESTES DE ATAQUE POR PERFIL
-- Testes controlados de RLS/permissões. Tudo executa dentro de transação e termina em ROLLBACK.
-- Nenhum dado de negócio permanece alterado.

begin;

create temp table security_attack_results (
  teste text,
  resultado text,
  detalhe text
);

grant all on table pg_temp.security_attack_results to authenticated, anon;

-- Utilitário para configurar auth.uid() a partir de um perfil real.
create or replace function pg_temp.set_user_by_role(p_role text, p_ativo boolean default true)
returns uuid
language plpgsql
as $$
declare v_uid uuid;
begin
  select id into v_uid
  from public.profiles
  where ativo = p_ativo and role::text = p_role
  order by id
  limit 1;

  if v_uid is null then return null; end if;
  perform set_config('request.jwt.claim.sub', v_uid::text, true);
  perform set_config('request.jwt.claim.role', 'authenticated', true);
  return v_uid;
end;
$$;

-- 1) SEM LOGIN / ANON não pode ler valores oficiais.
do $$
declare v_count bigint;
begin
  begin
    execute 'set local role anon';
    execute 'select count(*) from public.produtos_comerciais' into v_count;
    execute 'reset role';
    if v_count = 0 then
      insert into pg_temp.security_attack_results values ('ANON lê produtos','OK','bloqueado por RLS (0 linhas)');
    else
      insert into pg_temp.security_attack_results values ('ANON lê produtos','FALHA','anon enxergou '||v_count||' linhas');
    end if;
  exception when others then
    execute 'reset role';
    insert into pg_temp.security_attack_results values ('ANON lê produtos','OK','bloqueado: '||sqlstate);
  end;
end $$;

-- 2) GESTÃO pode ler produtos, mas não alterar preço.
do $$
declare v_uid uuid; v_count bigint; v_rows bigint;
begin
  v_uid := pg_temp.set_user_by_role('gestao', true);
  if v_uid is null then
    insert into pg_temp.security_attack_results values ('GESTAO altera preço','ATENÇÃO','sem usuário gestao ativo para teste');
    return;
  end if;

  execute 'set local role authenticated';
  select count(*) into v_count from public.produtos_comerciais;
  if v_count > 0 then
    insert into pg_temp.security_attack_results values ('GESTAO lê produtos','OK','linhas visíveis='||v_count);
  else
    insert into pg_temp.security_attack_results values ('GESTAO lê produtos','FALHA','nenhum produto visível');
  end if;

  update public.produtos_comerciais
     set valor_2027 = valor_2027
   where id = (select id from public.produtos_comerciais order by id limit 1);
  get diagnostics v_rows = row_count;
  execute 'reset role';

  if v_rows = 0 then
    insert into pg_temp.security_attack_results values ('GESTAO altera preço','OK','UPDATE bloqueado por RLS');
  else
    insert into pg_temp.security_attack_results values ('GESTAO altera preço','FALHA','UPDATE afetou '||v_rows||' linha(s)');
  end if;
exception when others then
  execute 'reset role';
  insert into pg_temp.security_attack_results values ('GESTAO altera preço','OK','bloqueado: '||sqlstate);
end $$;

-- 3) GESTÃO não pode ler configuração de integração/auditoria.
do $$
declare v_uid uuid; v_count bigint;
begin
  v_uid := pg_temp.set_user_by_role('gestao', true);
  if v_uid is null then
    insert into pg_temp.security_attack_results values ('GESTAO lê integração','ATENÇÃO','sem usuário gestao ativo para teste');
    return;
  end if;

  execute 'set local role authenticated';
  if to_regclass('public.integracao_config') is not null then
    select count(*) into v_count from public.integracao_config;
    if v_count = 0 then
      insert into pg_temp.security_attack_results values ('GESTAO lê integração','OK','0 linhas visíveis');
    else
      insert into pg_temp.security_attack_results values ('GESTAO lê integração','FALHA','linhas visíveis='||v_count);
    end if;
  end if;

  if to_regclass('public.log_auditoria') is not null then
    select count(*) into v_count from public.log_auditoria;
    if v_count = 0 then
      insert into pg_temp.security_attack_results values ('GESTAO lê auditoria','OK','0 linhas visíveis');
    else
      insert into pg_temp.security_attack_results values ('GESTAO lê auditoria','FALHA','linhas visíveis='||v_count);
    end if;
  end if;
  execute 'reset role';
exception when others then
  execute 'reset role';
  insert into pg_temp.security_attack_results values ('GESTAO recursos restritos','OK','bloqueado: '||sqlstate);
end $$;

-- 4) USUÁRIO INATIVO não deve ler recursos operacionais.
do $$
declare v_uid uuid; v_count bigint;
begin
  select id into v_uid from public.profiles where ativo=false order by id limit 1;
  if v_uid is null then
    insert into pg_temp.security_attack_results values ('USUARIO INATIVO','ATENÇÃO','sem perfil inativo para teste');
    return;
  end if;

  perform set_config('request.jwt.claim.sub', v_uid::text, true);
  perform set_config('request.jwt.claim.role', 'authenticated', true);
  execute 'set local role authenticated';
  select count(*) into v_count from public.produtos_comerciais;
  execute 'reset role';

  if v_count = 0 then
    insert into pg_temp.security_attack_results values ('USUARIO INATIVO','OK','0 linhas visíveis');
  else
    insert into pg_temp.security_attack_results values ('USUARIO INATIVO','FALHA','enxergou '||v_count||' linhas');
  end if;
exception when others then
  execute 'reset role';
  insert into pg_temp.security_attack_results values ('USUARIO INATIVO','OK','bloqueado: '||sqlstate);
end $$;

-- 5) DIREÇÃO deve continuar conseguindo ler e editar valores.
do $$
declare v_uid uuid; v_count bigint; v_rows bigint;
begin
  v_uid := pg_temp.set_user_by_role('direcao', true);
  if v_uid is null then
    insert into pg_temp.security_attack_results values ('DIRECAO operação','FALHA','sem usuário direcao ativo');
    return;
  end if;

  execute 'set local role authenticated';
  select count(*) into v_count from public.produtos_comerciais;
  update public.produtos_comerciais
     set valor_2027 = valor_2027
   where id = (select id from public.produtos_comerciais order by id limit 1);
  get diagnostics v_rows = row_count;
  execute 'reset role';

  if v_count > 0 and v_rows = 1 then
    insert into pg_temp.security_attack_results values ('DIRECAO operação','OK','leitura e escrita permitidas');
  else
    insert into pg_temp.security_attack_results values ('DIRECAO operação','FALHA','leitura='||v_count||' update='||v_rows);
  end if;
exception when others then
  execute 'reset role';
  insert into pg_temp.security_attack_results values ('DIRECAO operação','FALHA',sqlstate||':'||sqlerrm);
end $$;

-- Resultado único, amigável no celular. O SELECT vem ANTES do rollback.
select teste, resultado, detalhe
from pg_temp.security_attack_results
order by case resultado when 'FALHA' then 1 when 'ATENÇÃO' then 2 else 3 end, teste;

rollback;
