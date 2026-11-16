"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useTransition } from "react";
import { SearchableSelect } from "@/components/ui/searchable-select";
import { parseIdsParam, QUALIS_OPCOES, TURNO_GRUPOS } from "@/lib/filters";

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
  macroEstruturaId?: string;
  macroEstruturas: MacroEstruturaOption[];
  estruturas: EstruturaOption[];
  treinamentos: TreinamentoOption[];
  qualisTravado?: boolean;
}

export function FiltrosIndividual({
  macroEstruturaId,
  macroEstruturas,
  estruturas,
  treinamentos,
  qualisTravado = false,
}: FiltrosIndividualProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();

  const basePath = macroEstruturaId
    ? `/individual/${macroEstruturaId}`
    : "/individual";

  const lista = (chave: string) =>
    parseIdsParam(searchParams.get(chave) ?? undefined);
  const estrutura = lista("estrutura");
  const treinamento = lista("treinamento");
  const qualis = lista("qualis");
  const turno = lista("turno");

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

  function trocarMacro(novoId: string | undefined) {
    const params = new URLSearchParams(searchParams.toString());
    params.delete("estrutura");
    params.delete("page");
    const destino = novoId ? `/individual/${novoId}` : "/individual";
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
    <div className="grid grid-cols-2 items-end gap-3 lg:grid-cols-5">
      <Field label="Estrutura Macro">
        <SearchableSelect
          placeholder="Todas as macro estruturas"
          options={macroEstruturas.map((m) => ({ value: m.id, label: m.nome }))}
          value={macroEstruturaId ? [macroEstruturaId] : []}
          onChange={(v) => trocarMacro(v[0])}
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
      <Field label="Turno">
        <SearchableSelect
          multiple
          placeholder="Todos"
          options={TURNO_GRUPOS.map((g) => ({ value: g.key, label: g.label }))}
          value={turno}
          onChange={(v) => update({ turno: v.join(",") || null })}
        />
      </Field>
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
