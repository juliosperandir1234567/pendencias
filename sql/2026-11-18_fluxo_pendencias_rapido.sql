-- Versão rápida de rpc_fluxo_pendencias (a primeira levava ~13 s).
--
-- A anterior usava dois "not exists" sobre CTEs materializadas, e o Postgres
-- comparava cada linha com todas as outras. Esta faz um único FULL JOIN, que
-- ele resolve com hash em uma passada:
--   só no início -> resolvida;  só no atual -> nova.
-- Mesmo resultado, mesma assinatura: o site não muda.
--
-- Rodar inteiro no SQL Editor do Supabase.

begin;

create or replace function public.rpc_fluxo_pendencias(
  p_macro_ids uuid[] default null,
  p_estrutura_ids uuid[] default null,
  p_treinamento_ids uuid[] default null,
  p_qualis boolean default null,
  p_turno_grupos text[] default null
)
returns table(resolvidas bigint, novas bigint)
language sql
stable
set search_path to 'public'
as $function$
  with permitidas as materialized (
    select unnest(array(select estruturas_permitidas())) as estrutura_id
  ),
  atual as (
    select c.matricula, tc.treinamento_id
    from treinamentos_colaboradores tc
    join colaboradores c on c.id = tc.colaborador_id
    where tc.status = 'pendente'
      and (p_macro_ids is null or tc.macro_estrutura_id = any(p_macro_ids))
      and (p_estrutura_ids is null or tc.estrutura_id = any(p_estrutura_ids))
      and (p_treinamento_ids is null or tc.treinamento_id = any(p_treinamento_ids))
      and (p_qualis is null or tc.qualis = p_qualis)
      and turno_nos_grupos(tc.turno, p_turno_grupos)
    group by c.matricula, tc.treinamento_id
  ),
  inicio as (
    select bd.matricula, bd.treinamento_id
    from baseline_pendencias_detalhe bd
    join baseline_snapshots bs on bs.id = bd.snapshot_id and bs.ativo
    join permitidas pe on pe.estrutura_id = bd.estrutura_id
    where (p_macro_ids is null or bd.macro_estrutura_id = any(p_macro_ids))
      and (p_estrutura_ids is null or bd.estrutura_id = any(p_estrutura_ids))
      and (p_treinamento_ids is null or bd.treinamento_id = any(p_treinamento_ids))
      and (p_qualis is null or bd.qualis = p_qualis)
      and turno_nos_grupos(bd.turno, p_turno_grupos)
    group by bd.matricula, bd.treinamento_id
  )
  select
    count(*) filter (where a.matricula is null) as resolvidas,
    count(*) filter (where i.matricula is null) as novas
  from inicio i
  full join atual a
    on a.matricula = i.matricula and a.treinamento_id = i.treinamento_id;
$function$;

commit;
