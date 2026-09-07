"use client";

import { useRouter } from "next/navigation";
import { SearchableSelect } from "@/components/ui/searchable-select";

interface MacroEstruturaOption {
  id: string;
  nome: string;
}

export function SeletorMacroInicial({
  macroEstruturas,
}: {
  macroEstruturas: MacroEstruturaOption[];
}) {
  const router = useRouter();

  return (
    <div>
      <label className="mb-1 block text-xs font-medium uppercase tracking-wide text-gray-500">
        Estrutura Macro
      </label>
      <SearchableSelect
        placeholder="Selecione"
        options={macroEstruturas.map((m) => ({ value: m.id, label: m.nome }))}
        value={[]}
        onChange={(v) => v[0] && router.push(`/individual/${v[0]}`)}
      />
    </div>
  );
}
