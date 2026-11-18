import { createClient } from "@/lib/supabase/server";
import {
  listaOuNada,
  parseIdsParam,
  parseQualis,
  parseTurnoGrupos,
} from "@/lib/filters";
import { formatNumber, formatPercent } from "@/lib/format";
import { compararNome } from "@/lib/sort";
import { estruturasComRotulo, rotuloEstrutura } from "@/lib/estrutura";
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
import {
  GraficoMacroAtualClicavel,
  GraficoMacroClicavel,
} from "./_components/grafico-macro-clicavel";

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
  const estruturaIds = listaOuNada(parseIdsParam(sp.estrutura));
  const treinamentoIds = listaOuNada(parseIdsParam(sp.treinamento));
  const turnoGrupos = listaOuNada(parseTurnoGrupos(sp.turno));

  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  const { data: profile } = user
    ? await supabase.from("profiles").select("role").eq("id", user.id).single()
    : { data: null };
  const isAdmin = profile?.role === "administrador";

  // Gestor só vê Qualis = Sim, travado (mesmo que tente forçar via URL).
  const qualis = parseQualis(sp.qualis, isAdmin);

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
  ]);

  const macroEstruturas = macroEstruturasRaw ?? [];
  const estruturas = estruturasComRotulo(estruturasRaw ?? []);
  const codigoPorEstrutura = new Map(
    (estruturasRaw ?? []).map((e) => [e.id, e.codigo]),
  );
  const treinamentos = treinamentosRaw ?? [];
  const indicadores = indicadoresRaw?.[0];

  const dadosMacro = (graficoMacroRaw ?? [])
    .map((g) => ({
      id: g.macro_estrutura_id,
      nome: g.nome,
      inicio: g.baseline_pendencias,
      atual: g.atual_pendencias,
    }))
    .sort(compararNome);

  const dadosEstruturaCompletos = (graficoEstruturaRaw ?? [])
    .map((g) => ({
      id: g.estrutura_id,
      nome: g.nome,
      inicio: g.baseline_pendencias,
      atual: g.atual_pendencias,
    }))
    .sort((a, b) => b.atual - a.atual);
  // Seleciona as maiores pelo volume atual, mas exibe em ordem de nome.
  const dadosEstrutura = dadosEstruturaCompletos
    .slice(0, TOP_ESTRUTURAS)
    .sort(compararNome)
    .map((e) => ({
      ...e,
      nome: rotuloEstrutura({ codigo: codigoPorEstrutura.get(e.id), nome: e.nome }),
    }));

  const totalInicio = dadosMacro.reduce((soma, item) => soma + item.inicio, 0);
  const totalAtual =
    indicadores?.total_pendencias ??
    dadosMacro.reduce((soma, item) => soma + item.atual, 0);
  const variacao =
    totalInicio > 0 ? ((totalAtual - totalInicio) / totalInicio) * 100 : null;
  const melhorou = variacao !== null && variacao <= 0;
  const treinamentosConcluidos = Math.max(0, totalInicio - totalAtual);
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
          qualisTravado={!isAdmin}
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
          value={formatNumber(treinamentosConcluidos)}
          accent="verde"
          hint="Início − Atual"
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
          title="Pendências Atuais por Macro Estrutura"
          subtitle="Clique numa barra para ver o detalhamento"
        >
          <GraficoMacroAtualClicavel dados={dadosMacro} />
        </ChartCard>
        <ChartCard title="Pendências por Macro Estrutura" subtitle="Início x Atual">
          <LegendaInicioAtual />
          <GraficoMacroClicavel dados={dadosMacro} />
        </ChartCard>
        <ChartCard
          title="Pendências por Estrutura"
          subtitle={
            dadosEstruturaCompletos.length > dadosEstrutura.length
              ? `Top ${dadosEstrutura.length} de ${dadosEstruturaCompletos.length} estruturas com mais pendências, em ordem de nome`
              : "Início x Atual, em ordem de nome"
          }
        >
          <LegendaInicioAtual />
          <GraficoBarrasComparativo dados={dadosEstrutura} />
        </ChartCard>
      </div>
    </div>
  );
}
