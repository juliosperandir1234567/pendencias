"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useTransition } from "react";
import { SearchableSelect } from "@/components/ui/searchable-select";
import { IndicadorAtualizando } from "@/components/ui/indicador-atualizando";
import { parseIdsParam, QUALIS_OPCOES, TURNO_GRUPOS } from "@/lib/filters";

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
  qualisTravado?: boolean;
}

export function FiltrosGeral({
  macroEstruturas,
  estruturas,
  treinamentos,
  qualisTravado = false,
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
  const qualis = parseIdsParam(searchParams.get("qualis") ?? undefined);
  const turno = parseIdsParam(searchParams.get("turno") ?? undefined);

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

  function limparFiltros() {
    startTransition(() => {
      router.replace(pathname, { scroll: false });
    });
  }

  return (
    <div className="filtros-barra">
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
          multiple
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
          multiple
          placeholder="Todos"
          options={treinamentos.map((t) => ({ value: t.id, label: t.nome }))}
          value={treinamentoSelecionado}
          onChange={(v) => updateParams({ treinamento: v })}
        />
      </div>
      <div>
        <label className="mb-1 block text-xs font-medium uppercase tracking-wide text-gray-500">
          Qualis
        </label>
        <SearchableSelect
          multiple
          placeholder="Todos"
          options={QUALIS_OPCOES}
          value={qualisTravado ? ["sim"] : qualis}
          disabled={qualisTravado}
          onChange={(v) => updateParams({ qualis: v })}
        />
      </div>
      <div>
        <label className="mb-1 block text-xs font-medium uppercase tracking-wide text-gray-500">
          Turno
        </label>
        <SearchableSelect
          multiple
          placeholder="Todos"
          options={TURNO_GRUPOS.map((g) => ({ value: g.key, label: g.label }))}
          value={turno}
          onChange={(v) => updateParams({ turno: v })}
        />
      </div>
      <div className="filtros-acoes">
        <button
          type="button"
          onClick={limparFiltros}
          className="text-xs font-medium text-brand-azul hover:underline"
        >
          Limpar filtros
        </button>
        <span className="text-xs text-gray-400">
          {isPending ? "Atualizando…" : ""}
        </span>
        <IndicadorAtualizando ativo={isPending} />
      </div>
    </div>
  );
}
