"use client";

import { useRef, useState, useTransition } from "react";
import { SearchableSelect } from "@/components/ui/searchable-select";
import { criarUsuario, type ResultadoUsuario } from "../actions";

interface EstruturaOption {
  id: string;
  nome: string;
}

export function FormularioUsuario({
  estruturas,
}: {
  estruturas: EstruturaOption[];
}) {
  const [isPending, startTransition] = useTransition();
  const [resultado, setResultado] = useState<ResultadoUsuario | null>(null);
  const [role, setRole] = useState<"gestor" | "administrador">("gestor");
  const [estruturaIds, setEstruturaIds] = useState<string[]>([]);
  const formRef = useRef<HTMLFormElement>(null);

  function enviar(formData: FormData) {
    formData.set("role", role);
    estruturaIds.forEach((id) => formData.append("estruturas", id));
    startTransition(async () => {
      const res = await criarUsuario(formData);
      setResultado(res);
      if (res.ok) {
        formRef.current?.reset();
        setRole("gestor");
        setEstruturaIds([]);
      }
    });
  }

  return (
    <form ref={formRef} action={enviar} className="space-y-4">
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <div>
          <label className="mb-1 block text-xs font-medium uppercase tracking-wide text-gray-500">
            Nome
          </label>
          <input
            name="nome"
            type="text"
            required
            className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm shadow-sm focus:border-brand-verde-claro focus:outline-none"
          />
        </div>
        <div>
          <label className="mb-1 block text-xs font-medium uppercase tracking-wide text-gray-500">
            Email
          </label>
          <input
            name="email"
            type="email"
            required
            className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm shadow-sm focus:border-brand-verde-claro focus:outline-none"
          />
        </div>
        <div>
          <label className="mb-1 block text-xs font-medium uppercase tracking-wide text-gray-500">
            Senha inicial
          </label>
          <input
            name="senha"
            type="text"
            required
            minLength={6}
            placeholder="Mínimo 6 caracteres"
            className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm shadow-sm focus:border-brand-verde-claro focus:outline-none"
          />
        </div>
        <div>
          <label className="mb-1 block text-xs font-medium uppercase tracking-wide text-gray-500">
            Papel
          </label>
          <select
            value={role}
            onChange={(e) => setRole(e.target.value as "gestor" | "administrador")}
            className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm shadow-sm focus:border-brand-verde-claro focus:outline-none"
          >
            <option value="gestor">Gestor</option>
            <option value="administrador">Administrador</option>
          </select>
        </div>
      </div>

      {role === "gestor" && (
        <div>
          <label className="mb-1 block text-xs font-medium uppercase tracking-wide text-gray-500">
            Estruturas que este gestor pode ver
          </label>
          <SearchableSelect
            multiple
            placeholder="Selecione as estruturas"
            options={estruturas.map((e) => ({ value: e.id, label: e.nome }))}
            value={estruturaIds}
            onChange={setEstruturaIds}
          />
        </div>
      )}

      <button
        type="submit"
        disabled={isPending}
        className="w-full rounded-lg bg-brand-verde px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-brand-verde-claro disabled:cursor-not-allowed disabled:bg-gray-300"
      >
        {isPending ? "Criando…" : "Criar Usuário"}
      </button>

      {resultado?.erro && (
        <p className="rounded-lg bg-red-50 p-3 text-sm text-red-700">
          {resultado.erro}
        </p>
      )}

      {resultado?.ok && (
        <p className="rounded-lg border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-800">
          Usuário criado com sucesso.
        </p>
      )}
    </form>
  );
}
