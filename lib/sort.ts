const collator = new Intl.Collator("pt-BR", {
  numeric: true,
  sensitivity: "base",
});

/** Ordenação natural por nome: "UTAG 2" vem antes de "UTAG 10". */
export function compararNome(a: { nome: string }, b: { nome: string }) {
  return collator.compare(a.nome.trim(), b.nome.trim());
}
