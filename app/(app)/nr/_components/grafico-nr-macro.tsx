"use client";

import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { formatNumber } from "@/lib/format";
import { NR_STATUS_LABELS, type NrStatus } from "@/lib/nr";

export interface BarraNrDado {
  id: string;
  nome: string;
  em_dia: number;
  a_vencer: number;
  vencido: number;
  aberta_solicitacao: number;
}

const SERIES: { key: NrStatus; color: string }[] = [
  { key: "em_dia", color: "#10b981" },
  { key: "a_vencer", color: "#f59e0b" },
  { key: "vencido", color: "#ef4444" },
  { key: "aberta_solicitacao", color: "#3b82f6" },
];

export function LegendaStatusNr() {
  return (
    <div className="mb-3 flex flex-wrap items-center gap-4 text-xs text-gray-500">
      {SERIES.map((s) => (
        <span key={s.key} className="flex items-center gap-1.5">
          <span
            className="h-2.5 w-2.5 rounded-sm"
            style={{ backgroundColor: s.color }}
          />
          {NR_STATUS_LABELS[s.key]}
        </span>
      ))}
    </div>
  );
}

export function GraficoNrMacro({ dados }: { dados: BarraNrDado[] }) {
  if (!dados.length) {
    return (
      <p className="py-10 text-center text-sm text-gray-400">
        Sem registros de NR para os filtros selecionados.
      </p>
    );
  }

  const largo = dados.length > 8;
  const minWidth = Math.max(dados.length * (largo ? 105 : 90), 320);

  return (
    <div className="overflow-x-auto px-2">
      <div style={{ height: 260, minWidth }}>
        <ResponsiveContainer width="100%" height="100%">
          <BarChart
            data={dados}
            margin={{ top: 8, right: 8, bottom: largo ? 54 : 8, left: 8 }}
          >
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#eef2f0" />
            <XAxis
              dataKey="nome"
              tick={{ fontSize: 10, fill: "#374151" }}
              tickFormatter={(value: string) =>
                largo && value.length > 8 ? `${value.slice(0, 7)}…` : value
              }
              interval={0}
              angle={largo ? -35 : 0}
              textAnchor={largo ? "end" : "middle"}
              height={largo ? 56 : 24}
            />
            <YAxis hide />
            <Tooltip
              cursor={{ fill: "rgba(11,74,44,0.05)" }}
              formatter={(value, name) => [
                formatNumber(Number(value ?? 0)),
                NR_STATUS_LABELS[name as NrStatus] ?? String(name),
              ]}
              contentStyle={{
                borderRadius: 8,
                borderColor: "#e5e7eb",
                fontSize: 12,
              }}
            />
            {SERIES.map((s, i) => (
              <Bar
                key={s.key}
                dataKey={s.key}
                name={s.key}
                stackId="status"
                fill={s.color}
                stroke="#fff"
                strokeWidth={2}
                radius={
                  i === SERIES.length - 1 ? [3, 3, 0, 0] : [0, 0, 0, 0]
                }
                maxBarSize={32}
              />
            ))}
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
