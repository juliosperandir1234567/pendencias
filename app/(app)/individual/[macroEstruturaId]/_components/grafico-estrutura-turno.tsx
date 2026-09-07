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
            height: 170,
            minWidth: dados.length > 6 ? dados.length * 90 : "100%",
          }}
        >
        <ResponsiveContainer width="100%" height="100%">
          <BarChart
            data={dados}
            margin={{
              top: 20,
              right: 16,
              bottom: 4,
              left: dados.length > 4 ? 56 : 16,
            }}
            barGap={4}
          >
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#eef2f0" />
            <XAxis
              dataKey="nome"
              tick={{ fontSize: 10, fill: "#374151" }}
              tickFormatter={(value: string) =>
                dados.length > 4 && value.length > 11
                  ? `${value.slice(0, 10)}…`
                  : value
              }
              interval={0}
              angle={dados.length > 4 ? -35 : 0}
              textAnchor={dados.length > 4 ? "end" : "middle"}
              height={dados.length > 4 ? 56 : 30}
            />
            <YAxis
              type="number"
              tick={{ fontSize: 11, fill: "#6b7280" }}
              allowDecimals={false}
            />
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
              <Bar key={g.key} dataKey={g.key} fill={g.color} radius={[4, 4, 0, 0]} maxBarSize={56}>
                <LabelList
                  dataKey={g.key}
                  position="top"
                  formatter={(value) =>
                    Number(value ?? 0) > 0 ? formatNumber(Number(value)) : ""
                  }
                  style={{ fontSize: 11, fill: "#374151" }}
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
