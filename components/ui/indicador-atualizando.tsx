"use client";

import { useEffect } from "react";

/**
 * Enquanto os filtros recarregam a página: barra animada no topo e o conteúdo
 * principal esmaecido, para ficar claro que algo está acontecendo.
 */
export function IndicadorAtualizando({ ativo }: { ativo: boolean }) {
  useEffect(() => {
    const main = document.querySelector("main");
    if (!main) return;
    main.classList.toggle("atualizando", ativo);
    return () => main.classList.remove("atualizando");
  }, [ativo]);

  if (!ativo) return null;
  return (
    <div className="fixed inset-x-0 top-0 z-50 h-1 overflow-hidden bg-emerald-100">
      <div className="barra-progresso h-full w-1/3 bg-brand-verde-claro" />
    </div>
  );
}
