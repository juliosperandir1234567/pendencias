import { createClient } from "@/lib/supabase/server";
import { formatNumber } from "@/lib/format";
import { agruparPorTurno, pivotEstruturaTurno } from "@/lib/transform";
import { isTurnoGrupoKey } from "@/lib/filters";
import { KpiCard } from "@/components/ui/kpi-card";
import { ChartCard } from "@/components/ui/chart-card";
import {
  IconBuilding,
  IconClock,
  IconFlag,
  IconGraduationCap,
  IconUsers,
} from "@/components/ui/icons";
import { FiltrosIndividual } from "./_components/filtros-individual";
import { GraficoTurnoDonut } from "./_components/grafico-turno-donut";
import { GraficoEstruturaTurno } from "./_components/grafico-estrutura-turno";
import { TabelaDetalhada } from "./_components/tabela-detalhada";

const ORDER_WHITELIST = [
  "matricula",
  "colaborador",
  "id_treina",
  "treinamento",
  "turno",
] as const;
type OrdemColuna = (typeof ORDER_WHITELIST)[number];

const PAGE_SIZE = 20;

interface SearchParamsIndividual {
  estrutura?: string;
  treinamento?: string;
  qualis?: string;
  turno?: string;
  sort?: string;
  dir?: string;
  page?: string;
}

export default async function IndividualDetalhePage({
  params,
  searchParams,
}: {
  params: Promise<{ macroEstruturaId?: string[] }>;
  searchParams: Promise<SearchParamsIndividual>;
}) {
  const { macroEstruturaId: macroParam } = await params;
  const macroEstruturaId = macroParam?.[0];
  const sp = await searchParams;

  const estruturaId = sp.estrutura || undefined;
  const treinamentoId = sp.treinamento || undefined;
  const turnoGrupo: string | undefined = isTurnoGrupoKey(sp.turno)
    ? sp.turno
    : undefined;
  const sortBy: OrdemColuna = (ORDER_WHITELIST as readonly string[]).includes(
    sp.sort ?? "",
  )
    ? (sp.sort as OrdemColuna)
    : "colaborador";
  const sortDir: "asc" | "desc" = sp.dir === "desc" ? "desc" : "asc";
  const page = Math.max(1, Number(sp.page) || 1);

  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  const { data: profile } = user
    ? await supabase.from("profiles").select("role").eq("id", user.id).single()
    : { data: null };
  const isAdmin = profile?.role === "administrador";

  // Gestor só vê Qualis = Sim, travado (mesmo que tente forçar via URL).
  const qualis = isAdmin
    ? sp.qualis === "sim"
      ? true
      : sp.qualis === "nao"
        ? false
        : undefined
    : true;

  const [
    { data: macroEstruturasRaw },
    { data: estruturasTodas },
    { data: treinamentosRaw },
    { data: graficoMacroRaw },
    { data: turnoRows },
    { data: estruturaTurnoRows },
    { data: tabelaRows },
  ] = await Promise.all([
    supabase.from("macro_estruturas").select("id, nome").order("nome"),
    supabase
      .from("estruturas")
      .select("id, nome, macro_estrutura_id")
      .order("nome"),
    supabase.from("treinamentos").select("id, nome").order("nome"),
    supabase.rpc("rpc_grafico_macro_estrutura", {
      p_macro_ids: macroEstruturaId ? [macroEstruturaId] : undefined,
      p_estrutura_id: estruturaId,
      p_treinamento_id: treinamentoId,
      p_qualis: qualis,
      p_turno_grupo: turnoGrupo,
    }),
    supabase.rpc("rpc_pendencias_por_turno", {
      p_macro_estrutura_id: macroEstruturaId,
      p_estrutura_id: estruturaId,
      p_treinamento_id: treinamentoId,
      p_qualis: qualis,
    }),
    supabase.rpc("rpc_pendencias_por_estrutura_turno", {
      p_macro_estrutura_id: macroEstruturaId,
      p_estrutura_id: estruturaId,
      p_treinamento_id: treinamentoId,
      p_qualis: qualis,
    }),
    supabase.rpc("rpc_tabela_detalhada", {
      p_macro_estrutura_id: macroEstruturaId,
      p_estrutura_id: estruturaId,
      p_treinamento_id: treinamentoId,
      p_qualis: qualis,
      p_turno_grupo: turnoGrupo,
      p_order_by: sortBy,
      p_order_dir: sortDir,
      p_page: page,
      p_page_size: PAGE_SIZE,
    }),
  ]);

  const macroEstruturas = macroEstruturasRaw ?? [];
  const macro = macroEstruturaId
    ? macroEstruturas.find((m) => m.id === macroEstruturaId)
    : undefined;

  const estruturas = macroEstruturaId
    ? (estruturasTodas ?? []).filter(
        (e) => e.macro_estrutura_id === macroEstruturaId,
      )
    : (estruturasTodas ?? []);

  const totalCount = tabelaRows?.[0]?.total_count ?? 0;
  const totalInicio = (graficoMacroRaw ?? []).reduce(
    (soma, g) => soma + g.baseline_pendencias,
    0,
  );
  const totalAtualEscopo = (graficoMacroRaw ?? []).reduce(
    (soma, g) => soma + g.atual_pendencias,
    0,
  );
  const treinamentosConcluidos = Math.max(0, totalInicio - totalAtualEscopo);

  const dadosTurno = agruparPorTurno(turnoRows ?? []);

  const turnoMaisCritico = dadosTurno
    .slice()
    .sort((a, b) => b.total - a.total)[0];

  function buildHref(patch: Record<string, string>) {
    const urlParams = new URLSearchParams();
    if (sp.estrutura) urlParams.set("estrutura", sp.estrutura);
    if (sp.treinamento) urlParams.set("treinamento", sp.treinamento);
    if (sp.qualis) urlParams.set("qualis", sp.qualis);
    if (sp.turno) urlParams.set("turno", sp.turno);
    if (sp.sort) urlParams.set("sort", sp.sort);
    if (sp.dir) urlParams.set("dir", sp.dir);
    if (sp.page) urlParams.set("page", sp.page);
    for (const [key, value] of Object.entries(patch)) {
      urlParams.set(key, value);
    }
    const base = macroEstruturaId
      ? `/individual/${macroEstruturaId}`
      : "/individual";
    return `${base}?${urlParams.toString()}`;
  }

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-lg font-semibold text-brand-verde">
          {macro?.nome ?? "Todas as Macro Estruturas"}
        </h2>
        <p className="text-xs text-gray-500">
          Detalhamento de pendências de treinamento por colaborador.
        </p>
      </div>

      <div className="rounded-xl border border-gray-100 bg-white p-3 shadow-sm">
        <FiltrosIndividual
          macroEstruturaId={macroEstruturaId}
          macroEstruturas={macroEstruturas}
          estruturas={estruturas}
          treinamentos={treinamentosRaw ?? []}
          qualisTravado={!isAdmin}
        />
      </div>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-5">
        <KpiCard
          label="Pendências no Início"
          value={formatNumber(totalInicio)}
          accent="azul"
          icon={<IconFlag />}
        />
        <KpiCard
          label="Pendências Atual"
          value={formatNumber(totalAtualEscopo)}
          accent="verde"
          icon={<IconUsers />}
        />
        <KpiCard
          label="Treinamentos Concluídos"
          value={formatNumber(treinamentosConcluidos)}
          accent="verde"
          hint="Início − Atual"
          icon={<IconGraduationCap />}
        />
        <KpiCard
          label={macroEstruturaId ? "Estruturas nesta Macro" : "Estruturas"}
          value={formatNumber(estruturas.length)}
          accent="azul"
          icon={<IconBuilding />}
        />
        <KpiCard
          label="Turno mais Crítico"
          value={
            turnoMaisCritico && turnoMaisCritico.total > 0
              ? turnoMaisCritico.label
              : "—"
          }
          accent="muted"
          hint={
            turnoMaisCritico && turnoMaisCritico.total > 0
              ? `${formatNumber(turnoMaisCritico.total)} pendências`
              : undefined
          }
          icon={<IconClock />}
        />
      </div>

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-[320px_1fr]">
        <ChartCard
          title="Pendências por Turno"
          subtitle="Distribuição do recorte atual"
        >
          <GraficoTurnoDonut dados={dadosTurno} />
        </ChartCard>
        <ChartCard title="Pendências por Estrutura">
          <GraficoEstruturaTurno
            dados={pivotEstruturaTurno(estruturaTurnoRows ?? [])}
          />
        </ChartCard>
      </div>

      <div>
        <h3 className="mb-2 text-sm font-semibold text-gray-700">
          Detalhamento por Colaborador
        </h3>
        <TabelaDetalhada
          rows={(tabelaRows ?? []).map((r) => ({
            matricula: r.matricula,
            colaborador: r.colaborador,
            id_treina: r.id_treina,
            treinamento: r.treinamento,
            turno: r.turno,
          }))}
          totalCount={totalCount}
          page={page}
          pageSize={PAGE_SIZE}
          sortBy={sortBy}
          sortDir={sortDir}
          buildHref={buildHref}
        />
      </div>
    </div>
  );
}
