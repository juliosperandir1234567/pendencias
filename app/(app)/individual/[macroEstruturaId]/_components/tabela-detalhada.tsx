import Link from "next/link";
import { formatNumber } from "@/lib/format";
import { TURNO_LABELS, type Turno } from "@/lib/filters";

export interface LinhaTabela {
  matricula: string;
  colaborador: string;
  id_treina: string;
  treinamento: string;
  turno: Turno | null;
}

type ColunaOrdenavel =
  | "matricula"
  | "colaborador"
  | "id_treina"
  | "treinamento"
  | "turno";

const COLUNAS: { key: ColunaOrdenavel; label: string }[] = [
  { key: "matricula", label: "Matrícula" },
  { key: "colaborador", label: "Colaborador" },
  { key: "id_treina", label: "Id. Treina" },
  { key: "treinamento", label: "Treinamento" },
  { key: "turno", label: "Turno" },
];

interface TabelaDetalhadaProps {
  rows: LinhaTabela[];
  totalCount: number;
  page: number;
  pageSize: number;
  sortBy: ColunaOrdenavel;
  sortDir: "asc" | "desc";
  buildHref: (patch: Record<string, string>) => string;
}

export function TabelaDetalhada({
  rows,
  totalCount,
  page,
  pageSize,
  sortBy,
  sortDir,
  buildHref,
}: TabelaDetalhadaProps) {
  const totalPages = Math.max(1, Math.ceil(totalCount / pageSize));

  return (
    <div className="overflow-hidden rounded-xl border border-gray-100 bg-white shadow-sm">
      <div className="divide-y divide-gray-100 sm:hidden">
        {rows.map((r, i) => (
          <div key={`${r.matricula}-${r.id_treina}-${i}`} className="px-3 py-2.5">
            <div className="flex items-start justify-between gap-2">
              <p className="text-sm font-medium text-gray-800">{r.colaborador}</p>
              <span className="flex-shrink-0 text-[11px] text-gray-400">
                Mat. {r.matricula}
              </span>
            </div>
            <p className="mt-0.5 text-xs text-gray-600">{r.treinamento}</p>
            <div className="mt-1 flex items-center gap-3 text-[11px] text-gray-400">
              <span>Id. {r.id_treina}</span>
              <span>{r.turno ? TURNO_LABELS[r.turno] : "—"}</span>
            </div>
          </div>
        ))}
        {!rows.length && (
          <p className="px-3 py-8 text-center text-sm text-gray-400">
            Nenhuma pendência encontrada para os filtros selecionados.
          </p>
        )}
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
                key={`${r.matricula}-${r.id_treina}-${i}`}
                className="hover:bg-emerald-50/40"
              >
                <td className="px-4 py-2.5 font-medium text-gray-700">
                  {r.matricula}
                </td>
                <td className="px-4 py-2.5 text-gray-600">{r.colaborador}</td>
                <td className="px-4 py-2.5 text-gray-500">{r.id_treina}</td>
                <td className="px-4 py-2.5 text-gray-600">{r.treinamento}</td>
                <td className="px-4 py-2.5 text-gray-600">
                  {r.turno ? TURNO_LABELS[r.turno] : "—"}
                </td>
              </tr>
            ))}
            {!rows.length && (
              <tr>
                <td colSpan={5} className="px-4 py-8 text-center text-gray-400">
                  Nenhuma pendência encontrada para os filtros selecionados.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
      <div className="flex items-center justify-between border-t border-gray-100 px-4 py-3 text-xs text-gray-500">
        <span>
          {formatNumber(totalCount)} pendência{totalCount === 1 ? "" : "s"} ·
          página {page} de {totalPages}
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
