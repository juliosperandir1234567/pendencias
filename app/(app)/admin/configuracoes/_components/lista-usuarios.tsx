"use client";

import { useTransition } from "react";
import { removerUsuario } from "../actions";

interface Usuario {
  id: string;
  nome: string;
  email: string;
  role: "administrador" | "gestor";
  created_at: string;
  totalEstruturas: number;
}

export function ListaUsuarios({
  usuarios,
  usuarioAtualId,
}: {
  usuarios: Usuario[];
  usuarioAtualId: string;
}) {
  const [isPending, startTransition] = useTransition();

  function remover(id: string, nome: string) {
    if (!confirm(`Remover o usuário "${nome}"? Essa ação não pode ser desfeita.`)) {
      return;
    }
    startTransition(async () => {
      const res = await removerUsuario(id);
      if (!res.ok) {
        alert(res.erro ?? "Não foi possível remover o usuário.");
      }
    });
  }

  if (!usuarios.length) {
    return <p className="text-sm text-gray-400">Nenhum usuário cadastrado.</p>;
  }

  return (
    <div className="divide-y divide-gray-100">
      {usuarios.map((u) => (
        <div key={u.id} className="flex items-center justify-between gap-3 py-2.5">
          <div className="min-w-0">
            <p className="truncate text-sm font-medium text-gray-800">{u.nome}</p>
            <p className="truncate text-xs text-gray-400">{u.email}</p>
          </div>
          <div className="flex flex-shrink-0 items-center gap-2">
            <span
              className={`rounded-full px-2 py-0.5 text-[11px] font-medium ${
                u.role === "administrador"
                  ? "bg-brand-azul/10 text-brand-azul"
                  : "bg-brand-verde/10 text-brand-verde"
              }`}
            >
              {u.role === "administrador" ? "Administrador" : "Gestor"}
              {u.role === "gestor" && ` · ${u.totalEstruturas} estrutura(s)`}
            </span>
            {u.id !== usuarioAtualId && (
              <button
                type="button"
                disabled={isPending}
                onClick={() => remover(u.id, u.nome)}
                className="text-xs font-medium text-red-500 hover:underline disabled:text-gray-300"
              >
                Remover
              </button>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}
