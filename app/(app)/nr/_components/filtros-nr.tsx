"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useTransition } from "react";
import { SearchableSelect } from "@/components/ui/searchable-select";
import { NR_STATUS_LABELS, NR_STATUSES } from "@/lib/nr";

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

interface FiltrosNrProps {
  macroEstruturas: MacroEstruturaOption[];
  estruturas: EstruturaOption[];
  treinamentos: TreinamentoOption[];
}

export function FiltrosNr({
  macroEstruturas,
  estruturas,
  treinamentos,
}: FiltrosNrProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();

  const macroSelecionada = searchParams.get("macro") ?? "";
  const estruturaSelecionada = searchParams.get("estrutura") ?? "";
  const treinamentoSelecionado = searchParams.get("treinamento") ?? "";
  const status = searchParams.get("status") ?? "";

  const estruturasDisponiveis = macroSelecionada
    ? estruturas.filter((e) => e.macro_estrutura_id === macroSelecionada)
    : estruturas;

  function update(patch: Record<string, string | null>) {
    const params = new URLSearchParams(searchParams.toString());
    for (const [key, val] of Object.entries(patch)) {
      if (val) params.set(key, val);
      else params.delete(key);
    }
    params.delete("page");
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
          Estrutura Macro
        </label>
        <SearchableSelect
          placeholder="Todas as macro estruturas"
          options={macroEstruturas.map((m) => ({ value: m.id, label: m.nome }))}
          value={macroSelecionada ? [macroSelecionada] : []}
          onChange={(v) => update({ macro: v[0] ?? null, estrutura: null })}
        />
      </div>
      <div>
        <label className="mb-1 block text-xs font-medium uppercase tracking-wide text-gray-500">
          Estrutura
        </label>
        <SearchableSelect
          placeholder="Todas as estruturas"
          options={estruturasDisponiveis.map((e) => ({ value: e.id, label: e.nome }))}
          value={estruturaSelecionada ? [estruturaSelecionada] : []}
          onChange={(v) => update({ estrutura: v[0] ?? null })}
        />
      </div>
      <div>
        <label className="mb-1 block text-xs font-medium uppercase tracking-wide text-gray-500">
          Treinamento
        </label>
        <SearchableSelect
          placeholder="Todos"
          options={treinamentos.map((t) => ({ value: t.id, label: t.nome }))}
          value={treinamentoSelecionado ? [treinamentoSelecionado] : []}
          onChange={(v) => update({ treinamento: v[0] ?? null })}
        />
      </div>
      <div>
        <label className="mb-1 block text-xs font-medium uppercase tracking-wide text-gray-500">
          Status
        </label>
        <select
          value={status}
          onChange={(e) => update({ status: e.target.value || null })}
          className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm shadow-sm focus:border-brand-verde-claro focus:outline-none"
        >
          <option value="">Todos</option>
          {NR_STATUSES.map((s) => (
            <option key={s} value={s}>
              {NR_STATUS_LABELS[s]}
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
