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

export interface BarraAtualDado {
  id: string;
  nome: string;
  atual: number;
}

interface GraficoBarrasAtualProps {
  dados: BarraAtualDado[];
  onBarClick?: (id: string) => void;
  emptyMessage?: string;
}

/** Uma barra por item, só com as pendências atuais. */
export function GraficoBarrasAtual({
  dados: dadosBrutos,
  onBarClick,
  emptyMessage = "Sem dados para os filtros selecionados.",
}: GraficoBarrasAtualProps) {
  // Macros sem pendência não ganham coluna vazia.
  const dados = dadosBrutos.filter((d) => d.atual > 0);

  if (!dados.length) {
    return (
      <p className="py-10 text-center text-sm text-gray-400">{emptyMessage}</p>
    );
  }

  const largo = dados.length > 8;
  const minWidth = Math.max(dados.length * (largo ? 80 : 70), 320);

  return (
    <div className="overflow-x-auto px-2">
      <div style={{ height: 240, minWidth }}>
        <ResponsiveContainer width="100%" height="100%">
          <BarChart
            data={dados}
            margin={{ top: 26, right: 8, bottom: largo ? 24 : 8, left: 8 }}
          >
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#eef2f0" />
            <XAxis
              dataKey="nome"
              tick={{ fontSize: 10, fill: "#374151" }}
              tickFormatter={(value: string) =>
                largo && value.length > 18 ? `${value.slice(0, 17)}…` : value
              }
              interval={0}
              angle={largo ? -35 : 0}
              textAnchor={largo ? "end" : "middle"}
              height={largo ? 86 : 24}
            />
            <YAxis hide domain={[0, "dataMax"]} />
            <Tooltip
              cursor={{ fill: "rgba(11,74,44,0.05)" }}
              formatter={(value) => [formatNumber(Number(value ?? 0)), "Atual"]}
              contentStyle={{
                borderRadius: 8,
                borderColor: "#e5e7eb",
                fontSize: 12,
              }}
            />
            <Bar
              dataKey="atual"
              name="Atual"
              fill="#1e7a46"
              radius={[4, 4, 0, 0]}
              maxBarSize={48}
              minPointSize={(value) => (Number(value) > 0 ? 3 : 0)}
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
                offset={6}
                formatter={(value) => formatNumber(Number(value ?? 0))}
                style={{ fontSize: 12, fontWeight: 700, fill: "#0b4a2c" }}
              />
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
