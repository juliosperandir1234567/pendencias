import { createClient } from "@/lib/supabase/server";
import { getSessao } from "@/lib/auth";
import { Suspense } from "react";
import { CardsFluxo, CardsFluxoCarregando } from "@/components/ui/cards-fluxo";
import {
  listaOuNada,
  parseIdsParam,
  parseQualis,
  parseTurnoGrupos,
} from "@/lib/filters";
import { formatNumber } from "@/lib/format";
import {
  estruturasComRotulo,
  rotuloEstrutura,
  soComPendencia,
} from "@/lib/estrutura";
import { KpiCard } from "@/components/ui/kpi-card";
import { ChartCard } from "@/components/ui/chart-card";
import {
  IconBuilding,
} from "@/components/ui/icons";
import { DestaqueReducao } from "@/components/ui/destaque-reducao";
import {
  RankingPendencias,
  type ItemRanking,
} from "@/components/charts/ranking-pendencias";
import { FiltrosGeral } from "./_components/filtros-geral";

const TOP_ESTRUTURAS = 15;

export default async function GeralPage({
  searchParams,
}: {
  searchParams: Promise<{
    macro?: string;
    estrutura?: string;
    treinamento?: string;
    qualis?: string;
    turno?: string;
  }>;
}) {
  const sp = await searchParams;
  const macroIds = parseIdsParam(sp.macro);
  const estruturaIds = listaOuNada(parseIdsParam(sp.estrutura));
  const treinamentoIds = listaOuNada(parseIdsParam(sp.treinamento));
  const turnoGrupos = listaOuNada(parseTurnoGrupos(sp.turno));

  const supabase = await createClient();

  // Compartilhado com o layout: não repete a consulta de usuário/perfil.
  const isAdmin = (await getSessao())?.isAdmin ?? false;

  // Gestor só vê Qualis = Sim, travado (mesmo que tente forçar via URL).
  const qualis = parseQualis(sp.qualis, isAdmin);

  const [
    { data: macroEstruturasRaw },
    { data: estruturasRaw },
    { data: treinamentosRaw },
    { data: indicadoresRaw },
    { data: graficoMacroRaw },
    { data: graficoEstruturaRaw },
    { data: comPendenciaRaw, error: comPendenciaErro },
  ] = await Promise.all([
    supabase.from("macro_estruturas").select("id, nome").order("nome"),
    supabase
      .from("estruturas")
      .select("id, codigo, nome, macro_estrutura_id")
      .order("nome"),
    supabase.rpc("rpc_treinamentos_por_estrutura", {
      p_estrutura_ids: estruturaIds,
    }),
    supabase.rpc("rpc_indicadores_geral", {
      p_macro_ids: macroIds.length ? macroIds : undefined,
      p_estrutura_ids: estruturaIds,
      p_treinamento_ids: treinamentoIds,
      p_qualis: qualis,
      p_turno_grupos: turnoGrupos,
    }),
    supabase.rpc("rpc_grafico_macro_estrutura", {
      p_macro_ids: macroIds.length ? macroIds : undefined,
      p_estrutura_ids: estruturaIds,
      p_treinamento_ids: treinamentoIds,
      p_qualis: qualis,
      p_turno_grupos: turnoGrupos,
    }),
    supabase.rpc("rpc_grafico_estrutura", {
      p_macro_ids: macroIds.length ? macroIds : undefined,
      p_estrutura_ids: estruturaIds,
      p_treinamento_ids: treinamentoIds,
      p_qualis: qualis,
      p_turno_grupos: turnoGrupos,
    }),
    // Gestor só enxerga Qualis = Sim; o filtro de Qualis do admin não mexe nas listas.
    supabase.rpc("rpc_estruturas_com_pendencia", {
      p_qualis: isAdmin ? undefined : true,
    }),
  ]);

  // Filtros mostram só macros/estruturas com pendência atual.
  const opcoes = soComPendencia(
    macroEstruturasRaw ?? [],
    estruturasRaw ?? [],
    comPendenciaErro ? null : (comPendenciaRaw ?? []),
    [...macroIds, ...(estruturaIds ?? [])],
  );
  const macroEstruturas = opcoes.macros;
  const estruturas = estruturasComRotulo(opcoes.estruturas);
  const codigoPorEstrutura = new Map(
    (estruturasRaw ?? []).map((e) => [e.id, e.codigo]),
  );
  const treinamentos = treinamentosRaw ?? [];
  const indicadores = indicadoresRaw?.[0];

  const macroPorEstrutura = new Map(
    (estruturasRaw ?? []).map((e) => [e.id, e.macro_estrutura_id]),
  );

  const dadosMacro: ItemRanking[] = (graficoMacroRaw ?? []).map((g) => ({
    id: g.macro_estrutura_id,
    nome: g.nome,
    inicio: g.baseline_pendencias,
    atual: g.atual_pendencias,
    href: `/individual/${g.macro_estrutura_id}`,
  }));

  const dadosEstrutura: ItemRanking[] = (graficoEstruturaRaw ?? []).map((g) => {
    const macroId = macroPorEstrutura.get(g.estrutura_id);
    return {
      id: g.estrutura_id,
      nome: rotuloEstrutura({ codigo: codigoPorEstrutura.get(g.estrutura_id), nome: g.nome }),
      inicio: g.baseline_pendencias,
      atual: g.atual_pendencias,
      href: macroId ? `/individual/${macroId}?estrutura=${g.estrutura_id}` : undefined,
    };
  });

  const totalInicio = dadosMacro.reduce((soma, item) => soma + item.inicio, 0);
  const totalAtual =
    indicadores?.total_pendencias ??
    dadosMacro.reduce((soma, item) => soma + item.atual, 0);
  const estruturasComPendencia = dadosEstrutura.filter((e) => e.atual > 0).length;

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-lg font-semibold text-brand-verde">Visão Geral</h2>
        <p className="text-xs text-gray-500">
          Pendências de treinamento desde o marco de início.
        </p>
      </div>

      <div className="rounded-xl border border-gray-100 bg-white px-3 py-2.5 shadow-sm">
        <FiltrosGeral
          macroEstruturas={macroEstruturas}
          estruturas={estruturas}
          treinamentos={treinamentos}
          qualisTravado={!isAdmin}
        />
      </div>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-5">
        <DestaqueReducao
          inicio={totalInicio}
          atual={totalAtual}
          className="sm:col-span-2 lg:col-span-2"
        />
        <Suspense fallback={<CardsFluxoCarregando quantidade={2} />}>
          <CardsFluxo
            modo="dois"
            inicio={totalInicio}
            atual={totalAtual}
            filtros={{
              p_macro_ids: macroIds.length ? macroIds : undefined,
              p_estrutura_ids: estruturaIds,
              p_treinamento_ids: treinamentoIds,
              p_qualis: qualis,
              p_turno_grupos: turnoGrupos,
            }}
          />
        </Suspense>
        <KpiCard
          label="Estruturas com pendências"
          value={formatNumber(estruturasComPendencia)}
          accent="muted"
          hint={`de ${formatNumber(dadosEstrutura.length)} no recorte`}
          icon={<IconBuilding />}
        />
      </div>

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
        <ChartCard
          title="Ranking por Macro Estrutura"
          subtitle="Clique para ver o detalhamento"
        >
          <RankingPendencias itens={dadosMacro} />
        </ChartCard>
        <ChartCard
          title={`Top ${TOP_ESTRUTURAS} Estruturas`}
          subtitle="Com mais pendências atuais"
        >
          <RankingPendencias itens={dadosEstrutura} limite={TOP_ESTRUTURAS} />
        </ChartCard>
      </div>
    </div>
  );
}
