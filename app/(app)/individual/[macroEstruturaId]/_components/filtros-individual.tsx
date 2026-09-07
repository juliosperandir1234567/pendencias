"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useTransition } from "react";
import { SearchableSelect } from "@/components/ui/searchable-select";
import { TURNO_GRUPOS } from "@/lib/filters";

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
  macroEstruturaId: string;
  macroEstruturas: MacroEstruturaOption[];
  estruturas: EstruturaOption[];
  treinamentos: TreinamentoOption[];
  mostrarQualis?: boolean;
}

export function FiltrosIndividual({
  macroEstruturaId,
  macroEstruturas,
  estruturas,
  treinamentos,
  mostrarQualis = true,
}: FiltrosIndividualProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();

  const estrutura = searchParams.get("estrutura") ?? "";
  const treinamento = searchParams.get("treinamento") ?? "";
  const qualis = searchParams.get("qualis") ?? "";
  const turno = searchParams.get("turno") ?? "";

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

  function trocarMacro(novoId: string | undefined) {
    if (!novoId || novoId === macroEstruturaId) return;
    const params = new URLSearchParams(searchParams.toString());
    params.delete("estrutura");
    params.delete("page");
    startTransition(() => {
      router.push(`/individual/${novoId}?${params.toString()}`);
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
          placeholder="Selecione"
          options={macroEstruturas.map((m) => ({ value: m.id, label: m.nome }))}
          value={[macroEstruturaId]}
          onChange={(v) => trocarMacro(v[0])}
        />
      </Field>
      <Field label="Estrutura">
        <SearchableSelect
          placeholder="Todas"
          options={estruturas.map((e) => ({ value: e.id, label: e.nome }))}
          value={estrutura ? [estrutura] : []}
          onChange={(v) => update({ estrutura: v[0] ?? null })}
        />
      </Field>
      <Field label="Treinamento">
        <SearchableSelect
          placeholder="Todos"
          options={treinamentos.map((t) => ({ value: t.id, label: t.nome }))}
          value={treinamento ? [treinamento] : []}
          onChange={(v) => update({ treinamento: v[0] ?? null })}
        />
      </Field>
      {mostrarQualis && (
        <Field label="Qualis">
          <select
            value={qualis}
            onChange={(e) => update({ qualis: e.target.value || null })}
            className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm shadow-sm focus:border-brand-verde-claro focus:outline-none"
          >
            <option value="">Todos</option>
            <option value="sim">Sim</option>
            <option value="nao">Não</option>
          </select>
        </Field>
      )}
      <Field label="Turno">
        <select
          value={turno}
          onChange={(e) => update({ turno: e.target.value || null })}
          className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm shadow-sm focus:border-brand-verde-claro focus:outline-none"
        >
          <option value="">Todos</option>
          {TURNO_GRUPOS.map((g) => (
            <option key={g.key} value={g.key}>
              {g.label}
            </option>
          ))}
        </select>
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
