export const TURNOS = ["diurno", "vespertino", "noturno", "fixo"] as const;
export type Turno = (typeof TURNOS)[number];

export const TURNO_LABELS: Record<Turno, string> = {
  diurno: "Diurno",
  vespertino: "Vespertino",
  noturno: "Noturno",
  fixo: "Fixo",
};

export const TURNO_COLORS: Record<Turno, string> = {
  diurno: "#f59e0b",
  vespertino: "#2563eb",
  noturno: "#0b4a2c",
  fixo: "#f59e0b",
};

export function isTurno(value: string | undefined | null): value is Turno {
  return !!value && (TURNOS as readonly string[]).includes(value);
}

export interface TurnoGrupo {
  key: string;
  label: string;
  color: string;
  turnos: Turno[];
}

// Diurno e Fixo são exibidos como um único grupo nos gráficos, a pedido do usuário.
export const TURNO_GRUPOS: TurnoGrupo[] = [
  {
    key: "diurno_fixo",
    label: "Diurno",
    color: TURNO_COLORS.diurno,
    turnos: ["diurno", "fixo"],
  },
  {
    key: "vespertino",
    label: "Vespertino",
    color: TURNO_COLORS.vespertino,
    turnos: ["vespertino"],
  },
  {
    key: "noturno",
    label: "Noturno",
    color: TURNO_COLORS.noturno,
    turnos: ["noturno"],
  },
];

export function isTurnoGrupoKey(
  value: string | undefined | null,
): value is string {
  return !!value && TURNO_GRUPOS.some((g) => g.key === value);
}

export function parseIdsParam(value?: string): string[] {
  if (!value) return [];
  return value
    .split(",")
    .map((v) => v.trim())
    .filter(Boolean);
}
