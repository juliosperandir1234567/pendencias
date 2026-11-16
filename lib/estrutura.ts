import { compararNome } from "@/lib/sort";

/** "1101 - CALDEIRA". Se o código estiver vazio ou repetir o nome, mostra só o nome. */
export function rotuloEstrutura(e: { codigo?: string | null; nome: string }) {
  const codigo = e.codigo?.trim();
  const nome = e.nome.trim();
  if (!codigo || codigo === nome || nome.startsWith(codigo)) return nome;
  return `${codigo} - ${nome}`;
}

/**
 * Ordena por nome (ordem natural) e troca o `nome` pelo rótulo com o código,
 * pronto para filtros e gráficos.
 */
export function estruturasComRotulo<T extends { codigo?: string | null; nome: string }>(
  estruturas: T[],
): T[] {
  return [...estruturas]
    .sort(compararNome)
    .map((e) => ({ ...e, nome: rotuloEstrutura(e) }));
}
