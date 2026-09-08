import Link from "next/link";
import { formatDate } from "@/lib/format";
import { NR_STATUS_LABELS, isNrStatus, type NrStatus } from "@/lib/nr";

export interface LinhaNr {
  matricula: string;
  colaborador: string;
  treinamento: string;
  data_vencimento: string | null;
  status: string;
}

type ColunaOrdenavel =
  | "matricula"
  | "colaborador"
  | "treinamento"
  | "data_vencimento"
  | "status";

const COLUNAS: { key: ColunaOrdenavel; label: string }[] = [
  { key: "matricula", label: "Matrícula" },
  { key: "colaborador", label: "Colaborador" },
  { key: "treinamento", label: "Treinamento" },
  { key: "data_vencimento", label: "Vencimento" },
  { key: "status", label: "Status" },
];

const PILL_CLASSES: Record<NrStatus, string> = {
  em_dia: "bg-emerald-50 text-emerald-700",
  a_vencer: "bg-amber-50 text-amber-700",
  vencido: "bg-red-50 text-red-700",
  aberta_solicitacao: "bg-blue-50 text-blue-700",
  sem_treinamento: "bg-gray-100 text-gray-600",
};

const DOT_CLASSES: Record<NrStatus, string> = {
  em_dia: "bg-emerald-500",
  a_vencer: "bg-amber-500",
  vencido: "bg-red-500",
  aberta_solicitacao: "bg-blue-500",
  sem_treinamento: "bg-gray-400",
};

function StatusPill({ status }: { status: string }) {
  if (!isNrStatus(status)) return <span>—</span>;
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-semibold ${PILL_CLASSES[status]}`}
    >
      <span className={`h-1.5 w-1.5 rounded-full ${DOT_CLASSES[status]}`} />
      {NR_STATUS_LABELS[status]}
    </span>
  );
}

interface TabelaNrProps {
  rows: LinhaNr[];
  totalCount: number;
  page: number;
  pageSize: number;
  sortBy: ColunaOrdenavel;
  sortDir: "asc" | "desc";
  buildHref: (patch: Record<string, string>) => string;
}

export function TabelaNr({
  rows,
  totalCount,
  page,
  pageSize,
  sortBy,
  sortDir,
  buildHref,
}: TabelaNrProps) {
  const totalPages = Math.max(1, Math.ceil(totalCount / pageSize));

  return (
    <div className="overflow-hidden rounded-xl border border-gray-100 bg-white shadow-sm">
      <div className="overflow-x-auto sm:hidden">
        <table className="w-full text-left text-[11px]">
          <thead className="bg-gray-50 uppercase tracking-wide text-gray-500">
            <tr>
              {COLUNAS.filter((c) => c.key !== "data_vencimento").map((col) => {
                const active = sortBy === col.key;
                const nextDir = active && sortDir === "asc" ? "desc" : "asc";
                return (
                  <th key={col.key} className="whitespace-nowrap px-2 py-2 font-medium">
                    <Link
                      href={buildHref({ sort: col.key, dir: nextDir })}
                      className="inline-flex items-center gap-1 hover:text-brand-verde"
                    >
                      {col.label}
                      {active && (
                        <span className="text-brand-verde-claro">
                          {sortDir === "asc" ? "↑" : "↓"}
                        </span>
                      )}
                    </Link>
                  </th>
                );
              })}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {rows.map((r, i) => (
              <tr key={`${r.matricula}-${r.treinamento}-${i}`}>
                <td className="px-2 py-1.5 font-medium text-gray-700">
                  {r.matricula}
                </td>
                <td className="px-2 py-1.5 text-gray-600">{r.colaborador}</td>
                <td className="px-2 py-1.5 text-gray-600">{r.treinamento}</td>
                <td className="px-2 py-1.5">
                  <StatusPill status={r.status} />
                </td>
              </tr>
            ))}
            {!rows.length && (
              <tr>
                <td colSpan={4} className="px-2 py-8 text-center text-gray-400">
                  Nenhum registro encontrado para os filtros selecionados.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
      <div className="hidden overflow-x-auto sm:block">
        <table className="w-full text-left text-sm">
          <thead className="bg-gray-50 text-xs uppercase tracking-wide text-gray-500">
            <tr>
              {COLUNAS.map((col) => {
                const active = sortBy === col.key;
                const nextDir = active && sortDir === "asc" ? "desc" : "asc";
                return (
                  <th key={col.key} className="px-4 py-3 font-medium">
                    <Link
                      href={buildHref({ sort: col.key, dir: nextDir })}
                      className="inline-flex items-center gap-1 hover:text-brand-verde"
                    >
                      {col.label}
                      {active && (
                        <span className="text-brand-verde-claro">
                          {sortDir === "asc" ? "↑" : "↓"}
                        </span>
                      )}
                    </Link>
                  </th>
                );
              })}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {rows.map((r, i) => (
              <tr
                key={`${r.matricula}-${r.treinamento}-${i}`}
                className="hover:bg-emerald-50/40"
              >
                <td className="px-4 py-2.5 font-medium text-gray-700">
                  {r.matricula}
                </td>
                <td className="px-4 py-2.5 text-gray-600">{r.colaborador}</td>
                <td className="px-4 py-2.5 text-gray-600">{r.treinamento}</td>
                <td className="px-4 py-2.5 text-gray-500">
                  {formatDate(r.data_vencimento)}
                </td>
                <td className="px-4 py-2.5">
                  <StatusPill status={r.status} />
                </td>
              </tr>
            ))}
            {!rows.length && (
              <tr>
                <td colSpan={5} className="px-4 py-8 text-center text-gray-400">
                  Nenhum registro encontrado para os filtros selecionados.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
      <div className="flex items-center justify-between border-t border-gray-100 px-4 py-3 text-xs text-gray-500">
        <span>
          {totalCount} registro{totalCount === 1 ? "" : "s"} · página {page} de{" "}
          {totalPages}
        </span>
        <div className="flex gap-2">
          <Link
            href={buildHref({ page: String(Math.max(1, page - 1)) })}
            className={`rounded-md border px-3 py-1.5 ${
              page <= 1
                ? "pointer-events-none border-gray-100 text-gray-300"
                : "border-gray-200 text-gray-600 hover:border-brand-verde-claro hover:text-brand-verde"
            }`}
          >
            Anterior
          </Link>
          <Link
            href={buildHref({ page: String(Math.min(totalPages, page + 1)) })}
            className={`rounded-md border px-3 py-1.5 ${
              page >= totalPages
                ? "pointer-events-none border-gray-100 text-gray-300"
                : "border-gray-200 text-gray-600 hover:border-brand-verde-claro hover:text-brand-verde"
            }`}
          >
            Próxima
          </Link>
        </div>
      </div>
    </div>
  );
}
