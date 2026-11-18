"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useTransition } from "react";
import { SearchableSelect } from "@/components/ui/searchable-select";
import { IndicadorAtualizando } from "@/components/ui/indicador-atualizando";
import { parseIdsParam, QUALIS_OPCOES } from "@/lib/filters";

interface MacroEstruturaOption {
  id: string;
  nome: string;
}

interface EstruturaOption {
  id: string;
  nome: string;
}

interface TreinamentoOption {
  id: string;
  nome: string;
}

interface FiltrosIndividualProps {
  macroIds: string[];
  macroEstruturas: MacroEstruturaOption[];
  estruturas: EstruturaOption[];
  treinamentos: TreinamentoOption[];
  qualisTravado?: boolean;
}

export function FiltrosIndividual({
  macroIds,
  macroEstruturas,
  estruturas,
  treinamentos,
  qualisTravado = false,
}: FiltrosIndividualProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();

  const basePath = macroIds.length
    ? `/individual/${macroIds.join(",")}`
    : "/individual";

  const lista = (chave: string) =>
    parseIdsParam(searchParams.get(chave) ?? undefined);
  const estrutura = lista("estrutura");
  const treinamento = lista("treinamento");
  const qualis = lista("qualis");

  function update(patch: Record<string, string | null>) {
    const params = new URLSearchParams(searchParams.toString());
    for (const [key, val] of Object.entries(patch)) {
      if (val) params.set(key, val);
      else params.delete(key);
    }
    params.delete("page");
    startTransition(() => {
      router.replace(`${basePath}?${params.toString()}`, { scroll: false });
    });
  }

  function trocarMacros(novosIds: string[]) {
    const params = new URLSearchParams(searchParams.toString());
    params.delete("estrutura");
    params.delete("page");
    const destino = novosIds.length
      ? `/individual/${novosIds.join(",")}`
      : "/individual";
    startTransition(() => {
      router.push(`${destino}?${params.toString()}`);
    });
  }

  function limparFiltros() {
    startTransition(() => {
      router.push("/individual");
    });
  }

  return (
    <div className="filtros-barra">
      <Field label="Estrutura Macro">
        <SearchableSelect
          multiple
          placeholder="Todas as macro estruturas"
          options={macroEstruturas.map((m) => ({ value: m.id, label: m.nome }))}
          value={macroIds}
          onChange={trocarMacros}
        />
      </Field>
      <Field label="Estrutura">
        <SearchableSelect
          multiple
          placeholder="Todas"
          options={estruturas.map((e) => ({ value: e.id, label: e.nome }))}
          value={estrutura}
          onChange={(v) => update({ estrutura: v.join(",") || null })}
        />
      </Field>
      <Field label="Treinamento">
        <SearchableSelect
          multiple
          placeholder="Todos"
          options={treinamentos.map((t) => ({ value: t.id, label: t.nome }))}
          value={treinamento}
          onChange={(v) => update({ treinamento: v.join(",") || null })}
        />
      </Field>
      <Field label="Qualis">
        <SearchableSelect
          multiple
          placeholder="Todos"
          options={QUALIS_OPCOES}
          value={qualisTravado ? ["sim"] : qualis}
          disabled={qualisTravado}
          onChange={(v) => update({ qualis: v.join(",") || null })}
        />
      </Field>
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

function Field({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <label className="mb-1 block text-xs font-medium uppercase tracking-wide text-gray-500">
        {label}
      </label>
      {children}
    </div>
  );
}
