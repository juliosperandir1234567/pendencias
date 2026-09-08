import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { formatNumber } from "@/lib/format";
import { isNrStatus } from "@/lib/nr";
import { KpiCard } from "@/components/ui/kpi-card";
import {
  IconAlertTriangle,
  IconCheckCircle,
  IconClock,
  IconDownload,
  IconUpload,
} from "@/components/ui/icons";
import { FiltrosNr } from "./_components/filtros-nr";
import { TabelaNr } from "./_components/tabela-nr";

const ORDER_WHITELIST = [
  "matricula",
  "colaborador",
  "treinamento",
  "data_vencimento",
  "status",
] as const;
type OrdemColuna = (typeof ORDER_WHITELIST)[number];

const PAGE_SIZE = 20;

interface SearchParamsNr {
  macro?: string;
  estrutura?: string;
  treinamento?: string;
  status?: string;
  sort?: string;
  dir?: string;
  page?: string;
}

export default async function EspelhoNrPage({
  searchParams,
}: {
  searchParams: Promise<SearchParamsNr>;
}) {
  const sp = await searchParams;

  const macroId = sp.macro || undefined;
  const estruturaId = sp.estrutura || undefined;
  const treinamentoId = sp.treinamento || undefined;
  const status = isNrStatus(sp.status) ? sp.status : undefined;
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

  const [
    { data: macroEstruturasRaw },
    { data: estruturasRaw },
    { data: treinamentosRaw },
    { data: statusRaw },
    { data: tabelaRows },
  ] = await Promise.all([
    supabase.from("macro_estruturas").select("id, nome").order("nome"),
    supabase
      .from("estruturas")
      .select("id, nome, macro_estrutura_id")
      .order("nome"),
    supabase.from("nr_treinamentos").select("id, nome").order("nome"),
    supabase.rpc("rpc_espelho_nr_status", {
      p_macro_ids: macroId ? [macroId] : undefined,
      p_estrutura_id: estruturaId,
      p_treinamento_id: treinamentoId,
    }),
    supabase.rpc("rpc_espelho_nr_tabela", {
      p_macro_ids: macroId ? [macroId] : undefined,
      p_estrutura_id: estruturaId,
      p_treinamento_id: treinamentoId,
      p_status: status,
      p_order_by: sortBy,
      p_order_dir: sortDir,
      p_page: page,
      p_page_size: PAGE_SIZE,
    }),
  ]);

  const contagem = statusRaw?.[0];
  const totalCount = tabelaRows?.[0]?.total_count ?? 0;

  function buildHref(patch: Record<string, string>) {
    const urlParams = new URLSearchParams();
    if (sp.macro) urlParams.set("macro", sp.macro);
    if (sp.estrutura) urlParams.set("estrutura", sp.estrutura);
    if (sp.treinamento) urlParams.set("treinamento", sp.treinamento);
    if (sp.status) urlParams.set("status", sp.status);
    if (sp.sort) urlParams.set("sort", sp.sort);
    if (sp.dir) urlParams.set("dir", sp.dir);
    if (sp.page) urlParams.set("page", sp.page);
    for (const [key, value] of Object.entries(patch)) {
      urlParams.set(key, value);
    }
    return `/nr?${urlParams.toString()}`;
  }

  const pdfParams = new URLSearchParams();
  if (sp.macro) pdfParams.set("macro", sp.macro);
  if (sp.estrutura) pdfParams.set("estrutura", sp.estrutura);
  if (sp.treinamento) pdfParams.set("treinamento", sp.treinamento);
  if (sp.status) pdfParams.set("status", sp.status);
  pdfParams.set("sort", sortBy);
  pdfParams.set("dir", sortDir);
  const pdfHref = `/nr/pdf?${pdfParams.toString()}`;

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div>
          <h2 className="text-lg font-semibold text-brand-verde">
            Espelho de NR&apos;s
          </h2>
          <p className="text-xs text-gray-500">
            Situação dos treinamentos de NR por colaborador.
          </p>
        </div>
        <div className="flex gap-2">
          {isAdmin && (
            <Link
              href="/nr/importar"
              className="flex items-center gap-1.5 rounded-lg border border-gray-200 bg-white px-3 py-1.5 text-xs font-semibold text-brand-verde transition hover:bg-gray-50"
            >
              <IconUpload className="h-3.5 w-3.5" />
              Importar Planilha
            </Link>
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

      <div className="rounded-xl border border-gray-100 bg-white p-3 shadow-sm">
        <FiltrosNr
          macroEstruturas={macroEstruturasRaw ?? []}
          estruturas={estruturasRaw ?? []}
          treinamentos={treinamentosRaw ?? []}
        />
      </div>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        <KpiCard
          label="Em Dia"
          value={formatNumber(contagem?.em_dia ?? 0)}
          accent="verde"
          icon={<IconCheckCircle />}
        />
        <KpiCard
          label="A Vencer"
          value={formatNumber(contagem?.a_vencer ?? 0)}
          accent="ambar"
          hint="Vence em até 30 dias"
          icon={<IconClock />}
        />
        <KpiCard
          label="Vencido"
          value={formatNumber(contagem?.vencido ?? 0)}
          accent="vermelho"
          icon={<IconAlertTriangle />}
        />
      </div>

      <TabelaNr
        rows={(tabelaRows ?? []).map((r) => ({
          matricula: r.matricula,
          colaborador: r.colaborador,
          treinamento: r.treinamento,
          data_vencimento: r.data_vencimento,
          status: r.status,
        }))}
        totalCount={totalCount}
        page={page}
        pageSize={PAGE_SIZE}
        sortBy={sortBy}
        sortDir={sortDir}
        buildHref={buildHref}
      />
    </div>
  );
}
