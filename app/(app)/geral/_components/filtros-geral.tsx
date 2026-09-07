"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useTransition } from "react";
import { SearchableSelect } from "@/components/ui/searchable-select";
import { parseIdsParam, TURNO_GRUPOS } from "@/lib/filters";

interface MacroEstruturaOption {
  id: string;
  nome: string;
}

interface EstruturaOption {
  id: string;
  nome: string;
  macro_estrutura_id: string;
}

interface TreinamentoOption {
  id: string;
  nome: string;
}

interface FiltrosGeralProps {
  macroEstruturas: MacroEstruturaOption[];
  estruturas: EstruturaOption[];
  treinamentos: TreinamentoOption[];
  mostrarQualis?: boolean;
}

export function FiltrosGeral({
  macroEstruturas,
  estruturas,
  treinamentos,
  mostrarQualis = true,
}: FiltrosGeralProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();

  const macroSelecionadas = parseIdsParam(searchParams.get("macro") ?? undefined);
  const estruturaSelecionada = parseIdsParam(
    searchParams.get("estrutura") ?? undefined,
  );
  const treinamentoSelecionado = parseIdsParam(
    searchParams.get("treinamento") ?? undefined,
  );
  const qualis = searchParams.get("qualis") ?? "";
  const turno = searchParams.get("turno") ?? "";

  const estruturasDisponiveis = macroSelecionadas.length
    ? estruturas.filter((e) => macroSelecionadas.includes(e.macro_estrutura_id))
    : estruturas;

  function updateParams(next: Record<string, string[]>) {
    const params = new URLSearchParams(searchParams.toString());
    for (const [key, values] of Object.entries(next)) {
      if (values.length) params.set(key, values.join(","));
      else params.delete(key);
    }
    startTransition(() => {
      router.replace(`${pathname}?${params.toString()}`, { scroll: false });
    });
  }

  function updateScalar(key: string, value: string | null) {
    const params = new URLSearchParams(searchParams.toString());
    if (value) params.set(key, value);
    else params.delete(key);
    startTransition(() => {
      router.replace(`${pathname}?${params.toString()}`, { scroll: false });
    });
  }

  function limparFiltros() {
    startTransition(() => {
      router.replace(pathname, { scroll: false });
    });
  }

  return (
    <div className="grid grid-cols-2 items-end gap-3 lg:grid-cols-5">
      <div>
        <label className="mb-1 block text-xs font-medium uppercase tracking-wide text-gray-500">
          Macro Estrutura
        </label>
        <SearchableSelect
          multiple
          placeholder="Todas as macro estruturas"
          options={macroEstruturas.map((m) => ({ value: m.id, label: m.nome }))}
          value={macroSelecionadas}
          onChange={(v) => updateParams({ macro: v, estrutura: [] })}
        />
      </div>
      <div>
        <label className="mb-1 block text-xs font-medium uppercase tracking-wide text-gray-500">
          Estrutura
        </label>
        <SearchableSelect
          placeholder="Todas as estruturas"
          options={estruturasDisponiveis.map((e) => ({
            value: e.id,
            label: e.nome,
          }))}
          value={estruturaSelecionada}
          onChange={(v) => updateParams({ estrutura: v })}
        />
      </div>
      <div>
        <label className="mb-1 block text-xs font-medium uppercase tracking-wide text-gray-500">
          Treinamento
        </label>
        <SearchableSelect
          placeholder="Todos"
          options={treinamentos.map((t) => ({ value: t.id, label: t.nome }))}
          value={treinamentoSelecionado}
          onChange={(v) => updateParams({ treinamento: v })}
        />
      </div>
      {mostrarQualis && (
        <div>
          <label className="mb-1 block text-xs font-medium uppercase tracking-wide text-gray-500">
            Qualis
          </label>
          <select
            value={qualis}
            onChange={(e) => updateScalar("qualis", e.target.value || null)}
            className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm shadow-sm focus:border-brand-verde-claro focus:outline-none"
          >
            <option value="">Todos</option>
            <option value="sim">Sim</option>
            <option value="nao">Não</option>
          </select>
        </div>
      )}
      <div>
        <label className="mb-1 block text-xs font-medium uppercase tracking-wide text-gray-500">
          Turno
        </label>
        <select
          value={turno}
          onChange={(e) => updateScalar("turno", e.target.value || null)}
          className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm shadow-sm focus:border-brand-verde-claro focus:outline-none"
        >
          <option value="">Todos</option>
          {TURNO_GRUPOS.map((g) => (
            <option key={g.key} value={g.key}>
              {g.label}
            </option>
          ))}
        </select>
      </div>
      <div className="col-span-2 flex items-center justify-between lg:col-span-5">
        <span className="text-xs text-gray-400">
          {isPending ? "Atualizando…" : ""}
        </span>
        <button
          type="button"
          onClick={limparFiltros}
          className="text-xs font-medium text-brand-azul hover:underline"
        >
          Limpar filtros
        </button>
      </div>
    </div>
  );
}
