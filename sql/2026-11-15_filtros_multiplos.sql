-- Filtros com seleção múltipla (Estrutura, Treinamento, Turno) na Visão Geral
-- e na Visão Individual.
--
-- Compatível com o site atual: cada função continua aceitando os parâmetros
-- antigos (p_estrutura_id, p_treinamento_id, p_turno_grupo) e ganha versões
-- em lista (p_estrutura_ids, p_treinamento_ids, p_turno_grupos).
-- Rodar inteiro no SQL Editor do Supabase.

begin;

-- Turno pertence a algum dos grupos escolhidos? (null = todos)
create or replace function public.turno_nos_grupos(p_turno turno_tipo, p_grupos text[])
returns boolean
language sql
immutable
set search_path to 'public'
as $$
  select p_grupos is null
    or ('diurno_fixo' = any(p_grupos) and p_turno in ('diurno', 'fixo'))
    or ('vespertino' = any(p_grupos) and p_turno = 'vespertino')
    or ('noturno' = any(p_grupos) and p_turno = 'noturno');
$$;

-- ---------------------------------------------------------------------------
drop function if exists public.rpc_indicadores_geral(uuid[], uuid, uuid, uuid, boolean, text);
create function public.rpc_indicadores_geral(
  p_macro_ids uuid[] default null,
  p_estrutura_id uuid default null,
  p_gestor_id uuid default null,
  p_treinamento_id uuid default null,
  p_qualis boolean default null,
  p_turno_grupo text default null,
  p_estrutura_ids uuid[] default null,
  p_treinamento_ids uuid[] default null,
  p_turno_grupos text[] default null
)
returns table(total_pendencias bigint, total_concluidos bigint, indice_conclusao numeric)
language sql
stable
set search_path to 'public'
as $function$
  select
    count(*) filter (where status = 'pendente'),
    count(*) filter (where status = 'concluido'),
    round(100.0 * count(*) filter (where status = 'concluido') / nullif(count(*), 0), 1)
  from treinamentos_colaboradores tc
  where (p_macro_ids is null or tc.macro_estrutura_id = any(p_macro_ids))
    and (p_estrutura_id is null or tc.estrutura_id = p_estrutura_id)
    and (p_estrutura_ids is null or tc.estrutura_id = any(p_estrutura_ids))
    and (p_gestor_id is null or tc.estrutura_id in (
          select estrutura_id from gestor_estruturas where gestor_id = p_gestor_id))
    and (p_treinamento_id is null or tc.treinamento_id = p_treinamento_id)
    and (p_treinamento_ids is null or tc.treinamento_id = any(p_treinamento_ids))
    and (p_qualis is null or tc.qualis = p_qualis)
    and (
      p_turno_grupo is null
      or (p_turno_grupo = 'diurno_fixo' and tc.turno in ('diurno','fixo'))
      or (p_turno_grupo = 'vespertino' and tc.turno = 'vespertino')
      or (p_turno_grupo = 'noturno' and tc.turno = 'noturno')
    )
    and turno_nos_grupos(tc.turno, p_turno_grupos)
$function$;

-- ---------------------------------------------------------------------------
drop function if exists public.rpc_grafico_macro_estrutura(uuid[], uuid, uuid, uuid, boolean, text);
create function public.rpc_grafico_macro_estrutura(
  p_macro_ids uuid[] default null,
  p_estrutura_id uuid default null,
  p_gestor_id uuid default null,
  p_treinamento_id uuid default null,
  p_qualis boolean default null,
  p_turno_grupo text default null,
  p_estrutura_ids uuid[] default null,
  p_treinamento_ids uuid[] default null,
  p_turno_grupos text[] default null
)
returns table(macro_estrutura_id uuid, codigo text, nome text, baseline_pendencias bigint, atual_pendencias bigint)
language plpgsql
stable
set search_path to 'public'
as $function$
begin
  return query
  with atual as (
    select tc.macro_estrutura_id, count(*) filter (where tc.status = 'pendente') as pendentes
    from treinamentos_colaboradores tc
    where (p_macro_ids is null or tc.macro_estrutura_id = any(p_macro_ids))
      and (p_estrutura_id is null or tc.estrutura_id = p_estrutura_id)
      and (p_estrutura_ids is null or tc.estrutura_id = any(p_estrutura_ids))
      and (p_gestor_id is null or tc.estrutura_id in (
            select estrutura_id from gestor_estruturas where gestor_id = p_gestor_id))
      and (p_treinamento_id is null or tc.treinamento_id = p_treinamento_id)
      and (p_treinamento_ids is null or tc.treinamento_id = any(p_treinamento_ids))
      and (p_qualis is null or tc.qualis = p_qualis)
      and (
        p_turno_grupo is null
        or (p_turno_grupo = 'diurno_fixo' and tc.turno in ('diurno','fixo'))
        or (p_turno_grupo = 'vespertino' and tc.turno = 'vespertino')
        or (p_turno_grupo = 'noturno' and tc.turno = 'noturno')
      )
      and turno_nos_grupos(tc.turno, p_turno_grupos)
    group by tc.macro_estrutura_id
  ),
  baseline as (
    select bd.macro_estrutura_id, count(*) as pendentes
    from baseline_pendencias_detalhe bd
    join baseline_snapshots bs on bs.id = bd.snapshot_id and bs.ativo
    where bd.estrutura_id in (select estruturas_permitidas())
      and (p_macro_ids is null or bd.macro_estrutura_id = any(p_macro_ids))
      and (p_estrutura_id is null or bd.estrutura_id = p_estrutura_id)
      and (p_estrutura_ids is null or bd.estrutura_id = any(p_estrutura_ids))
      and (p_gestor_id is null or bd.estrutura_id in (
            select estrutura_id from gestor_estruturas where gestor_id = p_gestor_id))
      and (p_treinamento_id is null or bd.treinamento_id = p_treinamento_id)
      and (p_treinamento_ids is null or bd.treinamento_id = any(p_treinamento_ids))
      and (p_qualis is null or bd.qualis = p_qualis)
      and (
        p_turno_grupo is null
        or (p_turno_grupo = 'diurno_fixo' and bd.turno in ('diurno','fixo'))
        or (p_turno_grupo = 'vespertino' and bd.turno = 'vespertino')
        or (p_turno_grupo = 'noturno' and bd.turno = 'noturno')
      )
      and turno_nos_grupos(bd.turno, p_turno_grupos)
    group by bd.macro_estrutura_id
  )
  select m.id, m.codigo, m.nome,
         coalesce(b.pendentes, 0), coalesce(a.pendentes, 0)
  from macro_estruturas m
  left join atual a on a.macro_estrutura_id = m.id
  left join baseline b on b.macro_estrutura_id = m.id
  where m.id in (
    select e.macro_estrutura_id from estruturas e where e.id in (select estruturas_permitidas())
  )
  and (p_macro_ids is null or m.id = any(p_macro_ids))
  and (p_estrutura_id is null or m.id = (select e3.macro_estrutura_id from estruturas e3 where e3.id = p_estrutura_id))
  and (p_estrutura_ids is null or m.id in (select e4.macro_estrutura_id from estruturas e4 where e4.id = any(p_estrutura_ids)))
  and (p_gestor_id is null or m.id in (
        select e2.macro_estrutura_id from estruturas e2
        where e2.id in (select estrutura_id from gestor_estruturas where gestor_id = p_gestor_id)));
end;
$function$;

-- ---------------------------------------------------------------------------
drop function if exists public.rpc_grafico_estrutura(uuid[], uuid, uuid, boolean, text);
create function public.rpc_grafico_estrutura(
  p_macro_ids uuid[] default null,
  p_gestor_id uuid default null,
  p_treinamento_id uuid default null,
  p_qualis boolean default null,
  p_turno_grupo text default null,
  p_estrutura_ids uuid[] default null,
  p_treinamento_ids uuid[] default null,
  p_turno_grupos text[] default null
)
returns table(estrutura_id uuid, codigo text, nome text, baseline_pendencias bigint, atual_pendencias bigint)
language plpgsql
stable
set search_path to 'public'
as $function$
begin
  return query
  with atual as (
    select tc.estrutura_id, count(*) filter (where tc.status = 'pendente') as pendentes
    from treinamentos_colaboradores tc
    where (p_macro_ids is null or tc.macro_estrutura_id = any(p_macro_ids))
      and (p_gestor_id is null or tc.estrutura_id in (
            select ge.estrutura_id from gestor_estruturas ge where ge.gestor_id = p_gestor_id))
      and (p_treinamento_id is null or tc.treinamento_id = p_treinamento_id)
      and (p_treinamento_ids is null or tc.treinamento_id = any(p_treinamento_ids))
      and (p_qualis is null or tc.qualis = p_qualis)
      and (
        p_turno_grupo is null
        or (p_turno_grupo = 'diurno_fixo' and tc.turno in ('diurno','fixo'))
        or (p_turno_grupo = 'vespertino' and tc.turno = 'vespertino')
        or (p_turno_grupo = 'noturno' and tc.turno = 'noturno')
      )
      and turno_nos_grupos(tc.turno, p_turno_grupos)
    group by tc.estrutura_id
  ),
  baseline as (
    select bd.estrutura_id, count(*) as pendentes
    from baseline_pendencias_detalhe bd
    join baseline_snapshots bs on bs.id = bd.snapshot_id and bs.ativo
    where (p_treinamento_id is null or bd.treinamento_id = p_treinamento_id)
      and (p_treinamento_ids is null or bd.treinamento_id = any(p_treinamento_ids))
      and (p_qualis is null or bd.qualis = p_qualis)
      and (
        p_turno_grupo is null
        or (p_turno_grupo = 'diurno_fixo' and bd.turno in ('diurno','fixo'))
        or (p_turno_grupo = 'vespertino' and bd.turno = 'vespertino')
        or (p_turno_grupo = 'noturno' and bd.turno = 'noturno')
      )
      and turno_nos_grupos(bd.turno, p_turno_grupos)
    group by bd.estrutura_id
  )
  select e.id, e.codigo, e.nome, coalesce(b.pendentes,0), coalesce(a.pendentes,0)
  from estruturas e
  left join atual a on a.estrutura_id = e.id
  left join baseline b on b.estrutura_id = e.id
  where e.id in (select estruturas_permitidas())
    and (p_macro_ids is null or e.macro_estrutura_id = any(p_macro_ids))
    and (p_estrutura_ids is null or e.id = any(p_estrutura_ids))
    and (p_gestor_id is null or e.id in (
          select ge2.estrutura_id from gestor_estruturas ge2 where ge2.gestor_id = p_gestor_id))
  order by coalesce(a.pendentes,0) desc;
end;
$function$;

-- ---------------------------------------------------------------------------
drop function if exists public.rpc_treinamentos_por_estrutura(uuid);
create function public.rpc_treinamentos_por_estrutura(
  p_estrutura_id uuid default null,
  p_estrutura_ids uuid[] default null
)
returns table(id uuid, nome text)
language sql
stable
set search_path to 'public'
as $function$
  select t.id, t.nome
  from treinamentos t
  where (p_estrutura_id is null and p_estrutura_ids is null)
     or exists (
       select 1 from treinamentos_colaboradores tc
       where tc.treinamento_id = t.id
         and (p_estrutura_id is null or tc.estrutura_id = p_estrutura_id)
         and (p_estrutura_ids is null or tc.estrutura_id = any(p_estrutura_ids))
     )
  order by t.nome;
$function$;

-- ---------------------------------------------------------------------------
drop function if exists public.rpc_pendencias_por_turno(uuid, uuid, uuid, boolean);
create function public.rpc_pendencias_por_turno(
  p_macro_estrutura_id uuid default null,
  p_estrutura_id uuid default null,
  p_treinamento_id uuid default null,
  p_qualis boolean default null,
  p_estrutura_ids uuid[] default null,
  p_treinamento_ids uuid[] default null
)
returns table(turno turno_tipo, total bigint)
language sql
stable
set search_path to 'public'
as $function$
  select tc.turno, count(*) from treinamentos_colaboradores tc
  where (p_macro_estrutura_id is null or tc.macro_estrutura_id = p_macro_estrutura_id)
    and tc.status = 'pendente'
    and (p_estrutura_id is null or tc.estrutura_id = p_estrutura_id)
    and (p_estrutura_ids is null or tc.estrutura_id = any(p_estrutura_ids))
    and (p_treinamento_id is null or tc.treinamento_id = p_treinamento_id)
    and (p_treinamento_ids is null or tc.treinamento_id = any(p_treinamento_ids))
    and (p_qualis is null or tc.qualis = p_qualis)
  group by tc.turno;
$function$;

-- ---------------------------------------------------------------------------
drop function if exists public.rpc_pendencias_por_estrutura_turno(uuid, uuid, boolean, uuid);
create function public.rpc_pendencias_por_estrutura_turno(
  p_macro_estrutura_id uuid default null,
  p_treinamento_id uuid default null,
  p_qualis boolean default null,
  p_estrutura_id uuid default null,
  p_estrutura_ids uuid[] default null,
  p_treinamento_ids uuid[] default null
)
returns table(estrutura_id uuid, codigo text, nome text, turno turno_tipo, total bigint)
language sql
stable
set search_path to 'public'
as $function$
  select e.id, e.codigo, e.nome, tc.turno, count(*)
  from treinamentos_colaboradores tc join estruturas e on e.id = tc.estrutura_id
  where (p_macro_estrutura_id is null or tc.macro_estrutura_id = p_macro_estrutura_id)
    and tc.status = 'pendente'
    and (p_treinamento_id is null or tc.treinamento_id = p_treinamento_id)
    and (p_treinamento_ids is null or tc.treinamento_id = any(p_treinamento_ids))
    and (p_qualis is null or tc.qualis = p_qualis)
    and (p_estrutura_id is null or tc.estrutura_id = p_estrutura_id)
    and (p_estrutura_ids is null or tc.estrutura_id = any(p_estrutura_ids))
  group by e.id, e.codigo, e.nome, tc.turno;
$function$;

-- ---------------------------------------------------------------------------
drop function if exists public.rpc_tabela_detalhada(uuid, uuid, uuid, boolean, text, text, text, integer, integer);
create function public.rpc_tabela_detalhada(
  p_macro_estrutura_id uuid default null,
  p_estrutura_id uuid default null,
  p_treinamento_id uuid default null,
  p_qualis boolean default null,
  p_turno_grupo text default null,
  p_order_by text default 'colaborador',
  p_order_dir text default 'asc',
  p_page integer default 1,
  p_page_size integer default 50,
  p_estrutura_ids uuid[] default null,
  p_treinamento_ids uuid[] default null,
  p_turno_grupos text[] default null
)
returns table(matricula text, colaborador text, id_treina text, treinamento text, turno turno_tipo, total_count bigint)
language plpgsql
stable
set search_path to 'public'
as $function$
declare v_order_by text;
begin
  v_order_by := case p_order_by
    when 'matricula' then 'matricula'
    when 'colaborador' then 'colaborador'
    when 'id_treina' then 'id_treina'
    when 'treinamento' then 'treinamento'
    when 'turno' then 'turno'
    else 'colaborador'
  end;
  return query execute format(
    'select c.matricula as matricula, c.nome as colaborador, t.id_treina as id_treina, t.nome as treinamento, tc.turno as turno, count(*) over() as total_count
     from treinamentos_colaboradores tc
     join colaboradores c on c.id = tc.colaborador_id
     join treinamentos t on t.id = tc.treinamento_id
     where ($1 is null or tc.macro_estrutura_id = $1) and tc.status = ''pendente''
       and ($2 is null or tc.estrutura_id = $2)
       and ($3 is null or tc.treinamento_id = $3)
       and ($4 is null or tc.qualis = $4)
       and (
         $5 is null
         or ($5 = ''diurno_fixo'' and tc.turno in (''diurno'',''fixo''))
         or ($5 = ''vespertino'' and tc.turno = ''vespertino'')
         or ($5 = ''noturno'' and tc.turno = ''noturno'')
       )
       and ($8 is null or tc.estrutura_id = any($8))
       and ($9 is null or tc.treinamento_id = any($9))
       and turno_nos_grupos(tc.turno, $10)
     order by %I %s
     limit $6 offset $7',
     v_order_by, case when lower(p_order_dir) = 'desc' then 'desc' else 'asc' end)
  using p_macro_estrutura_id, p_estrutura_id, p_treinamento_id, p_qualis, p_turno_grupo,
        p_page_size, (p_page - 1) * p_page_size,
        p_estrutura_ids, p_treinamento_ids, p_turno_grupos;
end;
$function$;

-- Permissões (as funções foram recriadas).
grant execute on function public.turno_nos_grupos(turno_tipo, text[]) to authenticated;
grant execute on function public.rpc_indicadores_geral(uuid[], uuid, uuid, uuid, boolean, text, uuid[], uuid[], text[]) to authenticated;
grant execute on function public.rpc_grafico_macro_estrutura(uuid[], uuid, uuid, uuid, boolean, text, uuid[], uuid[], text[]) to authenticated;
grant execute on function public.rpc_grafico_estrutura(uuid[], uuid, uuid, boolean, text, uuid[], uuid[], text[]) to authenticated;
grant execute on function public.rpc_treinamentos_por_estrutura(uuid, uuid[]) to authenticated;
grant execute on function public.rpc_pendencias_por_turno(uuid, uuid, uuid, boolean, uuid[], uuid[]) to authenticated;
grant execute on function public.rpc_pendencias_por_estrutura_turno(uuid, uuid, boolean, uuid, uuid[], uuid[]) to authenticated;
grant execute on function public.rpc_tabela_detalhada(uuid, uuid, uuid, boolean, text, text, text, integer, integer, uuid[], uuid[], text[]) to authenticated;

commit;

-- Faz a API do Supabase enxergar as novas assinaturas na hora.
notify pgrst, 'reload schema';
