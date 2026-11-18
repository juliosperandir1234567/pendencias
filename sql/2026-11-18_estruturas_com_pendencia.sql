-- Estruturas (e suas macros) que têm pelo menos uma pendência atual.
-- Usada para mostrar nos filtros só o que tem pendência.
--
-- Rodar inteiro no SQL Editor do Supabase. Enquanto não rodar, o site mostra
-- todas as estruturas nos filtros, como antes.

begin;

create index if not exists treinamentos_colaboradores_pendentes_estrutura_idx
  on public.treinamentos_colaboradores (estrutura_id)
  where status = 'pendente';

create or replace function public.rpc_estruturas_com_pendencia(
  p_qualis boolean default null
)
returns table(estrutura_id uuid, macro_estrutura_id uuid)
language sql
stable
set search_path to 'public'
as $function$
  select distinct tc.estrutura_id, tc.macro_estrutura_id
  from treinamentos_colaboradores tc
  where tc.status = 'pendente'
    and (p_qualis is null or tc.qualis = p_qualis);
$function$;

grant execute on function public.rpc_estruturas_com_pendencia(boolean) to authenticated;

commit;
