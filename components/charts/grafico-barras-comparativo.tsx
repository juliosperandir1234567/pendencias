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
import { formatNumber } from "@/lib/format";

export interface BarraDado {
  id: string;
  nome: string;
  inicio: number;
  atual: number;
}

interface GraficoBarrasComparativoProps {
  dados: BarraDado[];
  onBarClick?: (id: string) => void;
  emptyMessage?: string;
}

export function GraficoBarrasComparativo({
  dados,
  onBarClick,
  emptyMessage = "Sem dados para os filtros selecionados.",
}: GraficoBarrasComparativoProps) {
  if (!dados.length) {
    return (
      <p className="py-10 text-center text-sm text-gray-400">{emptyMessage}</p>
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
            margin={{ top: 22, right: 16, bottom: largo ? 54 : 8, left: largo ? 64 : 16 }}
            barGap={4}
          >
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#eef2f0" />
            <XAxis
              dataKey="nome"
              tick={{ fontSize: 10, fill: "#374151" }}
              tickFormatter={(value: string) =>
                largo && value.length > 11 ? `${value.slice(0, 10)}…` : value
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
                name === "inicio" ? "Início" : "Atual",
              ]}
              contentStyle={{
                borderRadius: 8,
                borderColor: "#e5e7eb",
                fontSize: 12,
              }}
            />
            <Bar dataKey="inicio" name="Início" fill="#2563eb" radius={[3, 3, 0, 0]} maxBarSize={32}>
              <LabelList
                dataKey="inicio"
                position="top"
                formatter={(value) => formatNumber(Number(value ?? 0))}
                style={{ fontSize: 10, fill: "#374151" }}
              />
            </Bar>
            <Bar dataKey="atual" name="Atual" fill="#1e7a46" radius={[3, 3, 0, 0]} maxBarSize={32}
              onClick={
                onBarClick
                  ? (data: unknown) => {
                      const payload = data as { id?: string };
                      if (payload?.id) onBarClick(payload.id);
                    }
                  : undefined
              }
              style={{ cursor: onBarClick ? "pointer" : "default" }}
            >
              <LabelList
                dataKey="atual"
                position="top"
                formatter={(value) => formatNumber(Number(value ?? 0))}
                style={{ fontSize: 10, fill: "#374151" }}
              />
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
