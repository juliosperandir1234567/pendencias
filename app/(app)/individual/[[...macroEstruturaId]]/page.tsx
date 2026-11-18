import { createClient } from "@/lib/supabase/server";
import { formatNumber } from "@/lib/format";
import { agruparPorTurno, pivotEstruturaTurno } from "@/lib/transform";
import { listaOuNada, parseIdsParam, parseQualis } from "@/lib/filters";
import { estruturasComRotulo, rotuloEstrutura } from "@/lib/estrutura";
import { KpiCard } from "@/components/ui/kpi-card";
import { ChartCard } from "@/components/ui/chart-card";
import {
  IconBuilding,
  IconClock,
  IconDownload,
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

/** Usado quando as macros escolhidas não têm estruturas: lista vazia não pode virar "todas". */
const UUID_NENHUM = "00000000-0000-0000-0000-000000000000";

interface SearchParamsIndividual {
  estrutura?: string;
  treinamento?: string;
  qualis?: string;
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
  // Uma ou várias macros no caminho: /individual/<id> ou /individual/<id>,<id>.
  const macroIds = parseIdsParam(
    macroParam?.[0] ? decodeURIComponent(macroParam[0]) : undefined,
  );
  const macroUnica = macroIds.length === 1 ? macroIds[0] : undefined;
  const sp = await searchParams;

  const estruturaIdsFiltro = listaOuNada(parseIdsParam(sp.estrutura));
  const treinamentoIds = listaOuNada(parseIdsParam(sp.treinamento));
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
  const qualis = parseQualis(sp.qualis, isAdmin);

  const [{ data: macroEstruturasRaw }, { data: estruturasTodas }] =
    await Promise.all([
      supabase.from("macro_estruturas").select("id, nome").order("nome"),
      supabase
        .from("estruturas")
        .select("id, codigo, nome, macro_estrutura_id")
        .order("nome"),
    ]);

  const estruturasDoEscopo = macroIds.length
    ? (estruturasTodas ?? []).filter((e) =>
        macroIds.includes(e.macro_estrutura_id),
      )
    : (estruturasTodas ?? []);

  // As funções do banco só aceitam uma macro; com várias, recebem a lista de
  // estruturas dessas macros.
  const estruturaIds =
    estruturaIdsFiltro ??
    (macroIds.length > 1
      ? estruturasDoEscopo.length
        ? estruturasDoEscopo.map((e) => e.id)
        : [UUID_NENHUM]
      : undefined);

  const [
    { data: treinamentosRaw },
    { data: graficoMacroRaw },
    { data: turnoRows },
    { data: estruturaTurnoRows },
    { data: tabelaRows },
    { data: fluxoRaw, error: fluxoErro },
  ] = await Promise.all([
    supabase.rpc("rpc_treinamentos_por_estrutura", {
      p_estrutura_ids: estruturaIds,
    }),
    supabase.rpc("rpc_grafico_macro_estrutura", {
      p_macro_ids: listaOuNada(macroIds),
      p_estrutura_ids: estruturaIds,
      p_treinamento_ids: treinamentoIds,
      p_qualis: qualis,
    }),
    supabase.rpc("rpc_pendencias_por_turno", {
      p_macro_estrutura_id: macroUnica,
      p_estrutura_ids: estruturaIds,
      p_treinamento_ids: treinamentoIds,
      p_qualis: qualis,
    }),
    supabase.rpc("rpc_pendencias_por_estrutura_turno", {
      p_macro_estrutura_id: macroUnica,
      p_estrutura_ids: estruturaIds,
      p_treinamento_ids: treinamentoIds,
      p_qualis: qualis,
    }),
    supabase.rpc("rpc_tabela_detalhada", {
      p_macro_estrutura_id: macroUnica,
      p_estrutura_ids: estruturaIds,
      p_treinamento_ids: treinamentoIds,
      p_qualis: qualis,
      p_order_by: sortBy,
      p_order_dir: sortDir,
      p_page: page,
      p_page_size: PAGE_SIZE,
    }),
    // Resolvidas x Novas desde o início (sql/2026-11-18_fluxo_pendencias.sql).
    supabase.rpc("rpc_fluxo_pendencias", {
      p_macro_ids: listaOuNada(macroIds),
      p_estrutura_ids: estruturaIds,
      p_treinamento_ids: treinamentoIds,
      p_qualis: qualis,
    }),
  ]);

  const macroEstruturas = macroEstruturasRaw ?? [];
  const macrosEscolhidas = macroEstruturas.filter((m) =>
    macroIds.includes(m.id),
  );
  const titulo =
    macrosEscolhidas.length === 0
      ? "Todas as Macro Estruturas"
      : macrosEscolhidas.length <= 2
        ? macrosEscolhidas.map((m) => m.nome).join(" e ")
        : `${macrosEscolhidas.length} Macro Estruturas`;

  const estruturas = estruturasComRotulo(estruturasDoEscopo);
  const codigoPorEstrutura = new Map(
    (estruturasTodas ?? []).map((e) => [e.id, e.codigo]),
  );

  const totalCount = tabelaRows?.[0]?.total_count ?? 0;
  const totalInicio = (graficoMacroRaw ?? []).reduce(
    (soma, g) => soma + g.baseline_pendencias,
    0,
  );
  const totalAtualEscopo = (graficoMacroRaw ?? []).reduce(
    (soma, g) => soma + g.atual_pendencias,
    0,
  );
  // Sem a função do banco, cai para o saldo (Início − Atual), com o nome certo.
  const fluxo = !fluxoErro ? fluxoRaw?.[0] : undefined;

  const dadosTurno = agruparPorTurno(turnoRows ?? []);

  const turnoMaisCritico = dadosTurno
    .slice()
    .sort((a, b) => b.total - a.total)[0];

  const basePath = macroIds.length
    ? `/individual/${macroIds.join(",")}`
    : "/individual";

  function buildHref(patch: Record<string, string>) {
    const urlParams = new URLSearchParams();
    if (sp.estrutura) urlParams.set("estrutura", sp.estrutura);
    if (sp.treinamento) urlParams.set("treinamento", sp.treinamento);
    if (sp.qualis) urlParams.set("qualis", sp.qualis);
    if (sp.sort) urlParams.set("sort", sp.sort);
    if (sp.dir) urlParams.set("dir", sp.dir);
    if (sp.page) urlParams.set("page", sp.page);
    for (const [key, value] of Object.entries(patch)) {
      urlParams.set(key, value);
    }
    return `${basePath}?${urlParams.toString()}`;
  }

  const pdfParams = new URLSearchParams();
  if (macroIds.length) pdfParams.set("macro", macroIds.join(","));
  if (sp.estrutura) pdfParams.set("estrutura", sp.estrutura);
  if (sp.treinamento) pdfParams.set("treinamento", sp.treinamento);
  if (sp.qualis) pdfParams.set("qualis", sp.qualis);
  pdfParams.set("sort", sortBy);
  pdfParams.set("dir", sortDir);
  const pdfHref = `/individual/pdf?${pdfParams.toString()}`;
  // Macro(s) escolhida(s), ou várias estruturas: oferece um ZIP com um PDF por estrutura.
  const zipHref =
    (macroIds.length > 0 && !estruturaIdsFiltro) ||
    (estruturaIdsFiltro?.length ?? 0) > 1
      ? `/individual/pdf?${pdfParams.toString()}&zip=1`
      : null;

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-lg font-semibold text-brand-verde">{titulo}</h2>
        <p className="text-xs text-gray-500">
          Detalhamento de pendências de treinamento por colaborador.
        </p>
      </div>

      <div className="rounded-xl border border-gray-100 bg-white p-3 shadow-sm">
        <FiltrosIndividual
          macroIds={macroIds}
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
          label="Pendências Atuais"
          value={formatNumber(totalAtualEscopo)}
          accent="verde"
          icon={<IconUsers />}
        />
        {fluxo ? (
          <KpiCard
            label="Resolvidas desde o início"
            value={formatNumber(fluxo.resolvidas)}
            accent="verde"
            hint={`+${formatNumber(fluxo.novas)} novas desde o início`}
            icon={<IconGraduationCap />}
          />
        ) : (
          <KpiCard
            label="Redução líquida"
            value={formatNumber(totalInicio - totalAtualEscopo)}
            accent={totalInicio - totalAtualEscopo >= 0 ? "verde" : "vermelho"}
            hint="Início − Atual"
            icon={<IconGraduationCap />}
          />
        )}
        <KpiCard
          label={
            macroIds.length === 1
              ? "Estruturas nesta Macro"
              : macroIds.length > 1
                ? "Estruturas nas Macros"
                : "Estruturas"
          }
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

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-[280px_1fr]">
        <ChartCard title="Pendências por Turno" className="flex flex-col">
          <GraficoTurnoDonut dados={dadosTurno} />
        </ChartCard>
        <ChartCard title="Pendências por Estrutura">
          <GraficoEstruturaTurno
            dados={pivotEstruturaTurno(estruturaTurnoRows ?? []).map((e) => ({
              ...e,
              nome: rotuloEstrutura({
                codigo: codigoPorEstrutura.get(e.estrutura_id),
                nome: e.nome,
              }),
            }))}
          />
        </ChartCard>
      </div>

      <div>
        <div className="mb-2 flex items-center justify-between gap-2">
          <h3 className="text-sm font-semibold text-gray-700">
            Detalhamento por Colaborador
          </h3>
          <div className="flex flex-wrap items-center gap-2">
            {zipHref && (
              <a
                href={zipHref}
                className="flex items-center gap-1.5 rounded-lg border border-brand-verde px-3 py-1.5 text-xs font-semibold text-brand-verde transition hover:bg-emerald-50"
              >
                <IconDownload className="h-3.5 w-3.5" />
                PDFs por estrutura (ZIP)
              </a>
            )}
            <a
              href={pdfHref}
              className="flex items-center gap-1.5 rounded-lg bg-brand-verde px-3 py-1.5 text-xs font-semibold text-white transition hover:bg-brand-verde-claro"
            >
              <IconDownload className="h-3.5 w-3.5" />
              Exportar PDF
            </a>
          </div>
        </div>
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
