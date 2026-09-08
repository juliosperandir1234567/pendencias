export const NR_STATUSES = [
  "em_dia",
  "a_vencer",
  "vencido",
  "aberta_solicitacao",
] as const;
export type NrStatus = (typeof NR_STATUSES)[number];

export const NR_STATUS_LABELS: Record<NrStatus, string> = {
  em_dia: "Em dia",
  a_vencer: "A vencer",
  vencido: "Vencido",
  aberta_solicitacao: "Aberta solicitação",
};

export function isNrStatus(value: string | undefined | null): value is NrStatus {
  return !!value && (NR_STATUSES as readonly string[]).includes(value);
}
