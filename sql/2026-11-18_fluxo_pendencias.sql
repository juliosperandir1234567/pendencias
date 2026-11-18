-- Resolvidas x Novas desde o marco de início.
--
-- Cruza o retrato do início (baseline ativo) com as pendências atuais, pela
-- dupla matrícula + treinamento:
--   resolvidas = estava pendente no início e não está mais
--   novas      = está pendente agora e não estava no início
-- Assim, Atual = Início − Resolvidas + Novas.
--
-- Rodar inteiro no SQL Editor do Supabase. Enquanto não rodar, o site mostra
-- "Redução líquida" (Início − Atual) no lugar.

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
  with atual as (
    select distinct c.matricula, tc.treinamento_id
    from treinamentos_colaboradores tc
    join colaboradores c on c.id = tc.colaborador_id
    where tc.status = 'pendente'
      and (p_macro_ids is null or tc.macro_estrutura_id = any(p_macro_ids))
      and (p_estrutura_ids is null or tc.estrutura_id = any(p_estrutura_ids))
      and (p_treinamento_ids is null or tc.treinamento_id = any(p_treinamento_ids))
      and (p_qualis is null or tc.qualis = p_qualis)
      and turno_nos_grupos(tc.turno, p_turno_grupos)
  ),
  inicio as (
    select distinct bd.matricula, bd.treinamento_id
    from baseline_pendencias_detalhe bd
    join baseline_snapshots bs on bs.id = bd.snapshot_id and bs.ativo
    where bd.estrutura_id in (select estruturas_permitidas())
      and (p_macro_ids is null or bd.macro_estrutura_id = any(p_macro_ids))
      and (p_estrutura_ids is null or bd.estrutura_id = any(p_estrutura_ids))
      and (p_treinamento_ids is null or bd.treinamento_id = any(p_treinamento_ids))
      and (p_qualis is null or bd.qualis = p_qualis)
      and turno_nos_grupos(bd.turno, p_turno_grupos)
  )
  select
    (select count(*) from inicio i
      where not exists (
        select 1 from atual a
        where a.matricula = i.matricula and a.treinamento_id = i.treinamento_id)),
    (select count(*) from atual a
      where not exists (
        select 1 from inicio i
        where i.matricula = a.matricula and i.treinamento_id = a.treinamento_id));
$function$;

grant execute on function public.rpc_fluxo_pendencias(uuid[], uuid[], uuid[], boolean, text[]) to authenticated;

commit;
