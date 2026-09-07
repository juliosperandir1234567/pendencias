export function formatNumber(value: number | null | undefined): string {
  return new Intl.NumberFormat("pt-BR").format(value ?? 0);
}

export function formatPercent(value: number | null | undefined, digits = 1): string {
  if (value === null || value === undefined || Number.isNaN(value)) return "—";
  return `${new Intl.NumberFormat("pt-BR", {
    maximumFractionDigits: digits,
    minimumFractionDigits: digits,
  }).format(value)}%`;
}
