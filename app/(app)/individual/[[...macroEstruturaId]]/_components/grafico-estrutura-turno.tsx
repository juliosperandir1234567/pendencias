"use client";

import {
  Bar,
  BarChart,
  CartesianGrid,
  LabelList,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { TURNO_GRUPOS } from "@/lib/filters";
import { formatNumber } from "@/lib/format";
import type { EstruturaTurnoPivotado } from "@/lib/transform";

// Âmbar puro fica claro demais como texto; o rótulo usa um tom mais escuro.
const COR_ROTULO: Record<string, string> = { diurno_fixo: "#b45309" };

export function GraficoEstruturaTurno({
  dados,
}: {
  dados: EstruturaTurnoPivotado[];
}) {
  if (!dados.length) {
    return (
      <p className="py-10 text-center text-sm text-gray-400">
        Sem pendências para os filtros selecionados.
      </p>
    );
  }

  // Largura de cada estrutura cresce com o tamanho dos números, para os
  // rótulos das três barras não se sobreporem.
  const maior = Math.max(
    ...dados.flatMap((d) => TURNO_GRUPOS.map((g) => Number(d[g.key]) || 0)),
  );
  const larguraRotulo = formatNumber(maior).length * 7.5 + 6;
  const larguraGrupo = Math.max(90, Math.ceil(larguraRotulo * 3 + 24));

  return (
    <div>
      <div className="mb-3 flex flex-wrap items-center gap-4 text-xs text-gray-500">
        {TURNO_GRUPOS.map((g) => (
          <span key={g.key} className="flex items-center gap-1.5">
            <span
              className="h-2.5 w-2.5 rounded-sm"
              style={{ backgroundColor: g.color }}
            />
            {g.label}
          </span>
        ))}
      </div>
      <div className="overflow-x-auto px-2">
        <div
          style={{
            height: 280,
            minWidth: Math.max(dados.length * larguraGrupo, 320),
          }}
        >
        <ResponsiveContainer width="100%" height="100%">
          <BarChart
            data={dados}
            margin={{
              top: 24,
              right: 8,
              bottom: 4,
              left: 8,
            }}
            barGap={4}
          >
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#eef2f0" />
            <XAxis
              dataKey="nome"
              tick={{ fontSize: 10, fill: "#374151" }}
              tickFormatter={(value: string) =>
                dados.length > 4 && value.length > 18
                  ? `${value.slice(0, 17)}…`
                  : value
              }
              interval={0}
              angle={dados.length > 4 ? -35 : 0}
              textAnchor={dados.length > 4 ? "end" : "middle"}
              height={dados.length > 4 ? 86 : 30}
            />
            <YAxis hide type="number" allowDecimals={false} />
            <Tooltip
              formatter={(value, name) => [
                formatNumber(Number(value ?? 0)),
                TURNO_GRUPOS.find((g) => g.key === name)?.label ?? String(name),
              ]}
              contentStyle={{
                borderRadius: 8,
                borderColor: "#e5e7eb",
                fontSize: 12,
              }}
            />
            {TURNO_GRUPOS.map((g) => (
              <Bar
                key={g.key}
                dataKey={g.key}
                fill={g.color}
                radius={[4, 4, 0, 0]}
                maxBarSize={56}
                // Valores pequenos ao lado de grandes continuam visíveis.
                minPointSize={(value) => (Number(value) > 0 ? 3 : 0)}
              >
                <LabelList
                  dataKey={g.key}
                  position="top"
                  formatter={(value) =>
                    Number(value ?? 0) > 0 ? formatNumber(Number(value)) : ""
                  }
                  offset={6}
                  style={{ fontSize: 12, fontWeight: 700, fill: COR_ROTULO[g.key] ?? g.color }}
                />
              </Bar>
            ))}
          </BarChart>
        </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}
