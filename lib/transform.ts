import { TURNO_GRUPOS, type Turno } from "@/lib/filters";

export interface EstruturaTurnoRow {
  estrutura_id: string;
  nome: string;
  turno: Turno;
  total: number;
}

export type EstruturaTurnoPivotado = {
  estrutura_id: string;
  nome: string;
  total: number;
} & Record<string, number | string>;

export function pivotEstruturaTurno(
  rows: EstruturaTurnoRow[],
): EstruturaTurnoPivotado[] {
  const map = new Map<string, EstruturaTurnoPivotado>();

  for (const row of rows) {
    let entry = map.get(row.estrutura_id);
    if (!entry) {
      entry = { estrutura_id: row.estrutura_id, nome: row.nome, total: 0 };
      for (const grupo of TURNO_GRUPOS) entry[grupo.key] = 0;
      map.set(row.estrutura_id, entry);
    }
    const grupo = TURNO_GRUPOS.find((g) => g.turnos.includes(row.turno));
    if (grupo) {
      entry[grupo.key] = (entry[grupo.key] as number) + row.total;
    }
    entry.total += row.total;
  }

  return Array.from(map.values()).sort(
    (a, b) => (b.total as number) - (a.total as number),
  );
}

export interface TurnoGrupoTotal {
  key: string;
  label: string;
  color: string;
  total: number;
}

export function agruparPorTurno(
  rows: { turno: Turno; total: number }[],
): TurnoGrupoTotal[] {
  return TURNO_GRUPOS.map((grupo) => ({
    key: grupo.key,
    label: grupo.label,
    color: grupo.color,
    total: rows
      .filter((r) => grupo.turnos.includes(r.turno))
      .reduce((soma, r) => soma + r.total, 0),
  }));
}
