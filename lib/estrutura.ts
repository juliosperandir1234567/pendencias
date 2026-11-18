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

/**
 * Deixa nos filtros só as macros e estruturas com pendência atual.
 * `comPendencia` nulo (função do banco ainda não criada) mantém tudo.
 * O que já está selecionado continua na lista, para poder ser desmarcado.
 */
export function soComPendencia<
  M extends { id: string },
  E extends { id: string; macro_estrutura_id: string },
>(
  macros: M[],
  estruturas: E[],
  comPendencia: { estrutura_id: string; macro_estrutura_id: string }[] | null,
  selecionados: string[] = [],
) {
  if (!comPendencia) return { macros, estruturas };
  const estruturaIds = new Set(comPendencia.map((c) => c.estrutura_id));
  const macroIds = new Set(comPendencia.map((c) => c.macro_estrutura_id));
  const manter = new Set(selecionados);
  return {
    macros: macros.filter((m) => macroIds.has(m.id) || manter.has(m.id)),
    estruturas: estruturas.filter((e) => estruturaIds.has(e.id) || manter.has(e.id)),
  };
}
