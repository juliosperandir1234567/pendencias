import { createClient } from "@/lib/supabase/server";
import { isTurnoGrupoKey, parseIdsParam } from "@/lib/filters";
import { formatNumber, formatPercent } from "@/lib/format";
import { KpiCard } from "@/components/ui/kpi-card";
import { ChartCard } from "@/components/ui/chart-card";
import {
  IconBuilding,
  IconFlag,
  IconGraduationCap,
  IconTrendingDown,
  IconUsers,
} from "@/components/ui/icons";
import { LegendaInicioAtual } from "@/components/ui/legenda-inicio-atual";
import { GraficoBarrasComparativo } from "@/components/charts/grafico-barras-comparativo";
import { FiltrosGeral } from "./_components/filtros-geral";
import { GraficoMacroClicavel } from "./_components/grafico-macro-clicavel";

const TOP_ESTRUTURAS = 25;

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
  const estruturaId = parseIdsParam(sp.estrutura)[0];
  const treinamentoId = parseIdsParam(sp.treinamento)[0];
  const qualis = sp.qualis === "sim" ? true : sp.qualis === "nao" ? false : undefined;
  const turnoGrupo: string | undefined = isTurnoGrupoKey(sp.turno)
    ? sp.turno
    : undefined;

  const supabase = await createClient();

  const [
    { data: macroEstruturasRaw },
    { data: estruturasRaw },
    { data: treinamentosRaw },
    { data: indicadoresRaw },
    { data: graficoMacroRaw },
    { data: graficoEstruturaRaw },
  ] = await Promise.all([
    supabase.from("macro_estruturas").select("id, nome").order("nome"),
    supabase
      .from("estruturas")
      .select("id, nome, macro_estrutura_id")
      .order("nome"),
    supabase.from("treinamentos").select("id, nome").order("nome"),
    supabase.rpc("rpc_indicadores_geral", {
      p_macro_ids: macroIds.length ? macroIds : undefined,
      p_estrutura_id: estruturaId,
      p_treinamento_id: treinamentoId,
      p_qualis: qualis,
      p_turno_grupo: turnoGrupo,
    }),
    supabase.rpc("rpc_grafico_macro_estrutura", {
      p_macro_ids: macroIds.length ? macroIds : undefined,
      p_estrutura_id: estruturaId,
      p_treinamento_id: treinamentoId,
      p_qualis: qualis,
      p_turno_grupo: turnoGrupo,
    }),
    supabase.rpc("rpc_grafico_estrutura", {
      p_macro_ids: macroIds.length ? macroIds : undefined,
      p_treinamento_id: treinamentoId,
      p_qualis: qualis,
      p_turno_grupo: turnoGrupo,
    }),
  ]);

  const macroEstruturas = macroEstruturasRaw ?? [];
  const estruturas = estruturasRaw ?? [];
  const treinamentos = treinamentosRaw ?? [];
  const indicadores = indicadoresRaw?.[0];

  const dadosMacro = (graficoMacroRaw ?? [])
    .map((g) => ({
      id: g.macro_estrutura_id,
      nome: g.nome,
      inicio: g.baseline_pendencias,
      atual: g.atual_pendencias,
    }))
    .sort((a, b) => b.atual - a.atual);

  const dadosEstruturaCompletos = (graficoEstruturaRaw ?? [])
    .map((g) => ({
      id: g.estrutura_id,
      nome: g.nome,
      inicio: g.baseline_pendencias,
      atual: g.atual_pendencias,
    }))
    .sort((a, b) => b.atual - a.atual);
  const dadosEstrutura = dadosEstruturaCompletos.slice(0, TOP_ESTRUTURAS);

  const totalInicio = dadosMacro.reduce((soma, item) => soma + item.inicio, 0);
  const totalAtual =
    indicadores?.total_pendencias ??
    dadosMacro.reduce((soma, item) => soma + item.atual, 0);
  const variacao =
    totalInicio > 0 ? ((totalAtual - totalInicio) / totalInicio) * 100 : null;
  const melhorou = variacao !== null && variacao <= 0;
  const estruturasAfetadas = dadosEstruturaCompletos.filter(
    (item) => item.atual > 0,
  ).length;

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-lg font-semibold text-brand-verde">Visão Geral</h2>
        <p className="text-xs text-gray-500">
          Comparativo de pendências de treinamento por estrutura, desde o
          marco de início.
        </p>
      </div>

      <div className="rounded-xl border border-gray-100 bg-white p-3 shadow-sm">
        <FiltrosGeral
          macroEstruturas={macroEstruturas}
          estruturas={estruturas}
          treinamentos={treinamentos}
        />
      </div>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-5">
        <KpiCard
          label="Total de Pendências"
          value={formatNumber(totalAtual)}
          accent="verde"
          icon={<IconUsers />}
        />
        <KpiCard
          label="Pendências no Início"
          value={formatNumber(totalInicio)}
          accent="azul"
          icon={<IconFlag />}
        />
        <KpiCard
          label="Variação desde o Início"
          value={
            variacao === null
              ? "—"
              : `${variacao > 0 ? "+" : ""}${formatPercent(variacao)}`
          }
          accent={variacao === null ? "muted" : melhorou ? "verde" : "muted"}
          hint={
            variacao === null
              ? "Marco de início não definido"
              : melhorou
                ? "Redução de pendências"
                : "Aumento de pendências"
          }
          icon={<IconTrendingDown />}
        />
        <KpiCard
          label="Treinamentos Concluídos"
          value={formatNumber(indicadores?.total_concluidos ?? 0)}
          accent="muted"
          icon={<IconGraduationCap />}
        />
        <KpiCard
          label="Estruturas Afetadas"
          value={formatNumber(estruturasAfetadas)}
          accent="muted"
          hint="Com pendências no recorte atual"
          icon={<IconBuilding />}
        />
      </div>

      <div className="space-y-4">
        <ChartCard
          title="Pendências por Macro Estrutura"
          subtitle="Início x Atual — clique numa barra para o detalhamento"
        >
          <LegendaInicioAtual />
          <GraficoMacroClicavel dados={dadosMacro} />
        </ChartCard>
        <ChartCard
          title="Pendências por Estrutura"
          subtitle={
            dadosEstruturaCompletos.length > dadosEstrutura.length
              ? `Top ${dadosEstrutura.length} de ${dadosEstruturaCompletos.length} estruturas, ordenadas da maior para a menor`
              : "Início x Atual, ordenadas da maior para a menor"
          }
        >
          <LegendaInicioAtual />
          <GraficoBarrasComparativo dados={dadosEstrutura} />
        </ChartCard>
      </div>
    </div>
  );
}
