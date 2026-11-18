import Link from "next/link";
import { formatNumber, formatPercent } from "@/lib/format";

export interface ItemRanking {
  id: string;
  nome: string;
  inicio: number;
  atual: number;
  href?: string;
}

interface RankingPendenciasProps {
  itens: ItemRanking[];
  /** Mostra só os N com mais pendências atuais. */
  limite?: number;
  emptyMessage?: string;
}

const COR_MELHOROU = "#1e7a46";
const COR_PIOROU = "#dc2626";

/**
 * Ranking horizontal: maior pendência atual no topo, nome completo, barra do
 * atual com um traço marcando onde estava no início. Quem piorou fica em vermelho.
 */
export function RankingPendencias({
  itens,
  limite,
  emptyMessage = "Sem pendências para os filtros selecionados.",
}: RankingPendenciasProps) {
  const ordenados = itens
    // Só quem ainda tem pendência atual.
    .filter((i) => i.atual > 0)
    .sort((a, b) => b.atual - a.atual || b.inicio - a.inicio);
  const visiveis = limite ? ordenados.slice(0, limite) : ordenados;

  if (!visiveis.length) {
    return (
      <p className="py-10 text-center text-sm text-gray-400">{emptyMessage}</p>
    );
  }

  const maximo = Math.max(...visiveis.map((i) => Math.max(i.inicio, i.atual)), 1);

  return (
    <div>
      <div className="mb-2 flex flex-wrap items-center gap-4 text-xs text-gray-500">
        <span className="flex items-center gap-1.5">
          <span className="h-2.5 w-4 rounded-sm" style={{ backgroundColor: COR_MELHOROU }} />
          Atual (caiu)
        </span>
        <span className="flex items-center gap-1.5">
          <span className="h-2.5 w-4 rounded-sm" style={{ backgroundColor: COR_PIOROU }} />
          Atual (subiu)
        </span>
        <span className="flex items-center gap-1.5">
          <span className="h-3.5 w-0.5 bg-gray-600" />
          Início
        </span>
      </div>
      <ul className="divide-y divide-gray-50">
        {visiveis.map((item) => {
          const piorou = item.atual > item.inicio;
          const cor = piorou ? COR_PIOROU : COR_MELHOROU;
          const conteudo = (
            <div className="grid grid-cols-[minmax(0,11rem)_1fr_auto] items-center gap-3 py-1.5 sm:grid-cols-[minmax(0,15rem)_1fr_auto]">
              <span
                className="truncate text-xs font-medium text-gray-700"
                title={item.nome}
              >
                {item.nome}
              </span>
              <div className="relative h-4 rounded bg-gray-100">
                <div
                  className="absolute inset-y-0 left-0 rounded"
                  style={{
                    width: `${(item.atual / maximo) * 100}%`,
                    minWidth: item.atual > 0 ? 3 : 0,
                    backgroundColor: cor,
                  }}
                />
                {item.inicio > 0 && (
                  <div
                    className="absolute -inset-y-1 w-0.5 bg-gray-600"
                    style={{ left: `calc(${(item.inicio / maximo) * 100}% - 1px)` }}
                    title={`Início: ${formatNumber(item.inicio)}`}
                  />
                )}
              </div>
              <div className="flex items-center justify-end gap-2 tabular-nums">
                <span className="w-12 text-right text-sm font-bold text-gray-900">
                  {formatNumber(item.atual)}
                </span>
                <span className="hidden w-14 text-right text-[11px] text-gray-400 sm:inline">
                  de {formatNumber(item.inicio)}
                </span>
                <BadgeVariacao inicio={item.inicio} atual={item.atual} />
              </div>
            </div>
          );
          return (
            <li key={item.id}>
              {item.href ? (
                <Link
                  href={item.href}
                  className="-mx-2 block rounded-md px-2 transition hover:bg-gray-50"
                >
                  {conteudo}
                </Link>
              ) : (
                conteudo
              )}
            </li>
          );
        })}
      </ul>
      {limite && ordenados.length > limite && (
        <p className="mt-2 text-[11px] text-gray-400">
          Mostrando {limite} de {ordenados.length}, com mais pendências atuais.
        </p>
      )}
    </div>
  );
}

function BadgeVariacao({ inicio, atual }: { inicio: number; atual: number }) {
  if (inicio === 0) {
    return (
      <span className="w-16 rounded-full bg-amber-50 px-2 py-0.5 text-center text-[11px] font-semibold text-amber-700">
        novo
      </span>
    );
  }
  const variacao = ((atual - inicio) / inicio) * 100;
  const subiu = variacao > 0;
  return (
    <span
      className={`w-16 rounded-full px-2 py-0.5 text-center text-[11px] font-semibold ${
        subiu ? "bg-red-50 text-red-700" : "bg-emerald-50 text-emerald-800"
      }`}
    >
      {subiu ? "+" : ""}
      {formatPercent(variacao, 0)}
    </span>
  );
}

