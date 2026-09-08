"use client";

import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from "recharts";
import { formatNumber } from "@/lib/format";
import { NR_STATUS_LABELS, NR_STATUSES } from "@/lib/nr";

const CORES: Record<string, string> = {
  em_dia: "#10b981",
  a_vencer: "#f59e0b",
  vencido: "#ef4444",
  aberta_solicitacao: "#3b82f6",
};

export interface ContagemStatusNr {
  em_dia: number;
  a_vencer: number;
  vencido: number;
  aberta_solicitacao: number;
}

export function GraficoNrStatusDonut({
  contagem,
}: {
  contagem: ContagemStatusNr | undefined;
}) {
  const dados = NR_STATUSES.map((key) => ({
    key,
    label: NR_STATUS_LABELS[key],
    color: CORES[key],
    total: contagem?.[key] ?? 0,
  }));
  const total = dados.reduce((soma, item) => soma + item.total, 0);

  if (!total) {
    return (
      <p className="py-10 text-center text-sm text-gray-400">
        Sem registros de NR para os filtros selecionados.
      </p>
    );
  }

  return (
    <div className="flex items-center gap-4">
      <div className="relative h-[120px] w-[120px] flex-shrink-0">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={dados}
              dataKey="total"
              nameKey="label"
              innerRadius={34}
              outerRadius={52}
              paddingAngle={2}
              strokeWidth={0}
            >
              {dados.map((d) => (
                <Cell key={d.key} fill={d.color} />
              ))}
            </Pie>
            <Tooltip
              formatter={(value, _name, entry) => {
                const label =
                  (entry as { payload?: { label?: string } })?.payload
                    ?.label ?? "";
                const numeric = Number(value ?? 0);
                return [
                  `${formatNumber(numeric)} (${((numeric / total) * 100).toFixed(1)}%)`,
                  label,
                ];
              }}
              contentStyle={{
                borderRadius: 8,
                borderColor: "#e5e7eb",
                fontSize: 12,
              }}
            />
          </PieChart>
        </ResponsiveContainer>
        <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-base font-bold text-brand-verde">
            {formatNumber(total)}
          </span>
          <span className="text-[9px] text-gray-400">registros</span>
        </div>
      </div>
      <ul className="flex-1 space-y-1.5 text-xs">
        {dados.map((d) => (
          <li key={d.key} className="flex items-center gap-2">
            <span
              className="h-2.5 w-2.5 flex-shrink-0 rounded-full"
              style={{ backgroundColor: d.color }}
            />
            <span className="text-gray-600">{d.label}</span>
            <span className="ml-auto font-medium text-gray-800">
              {formatNumber(d.total)}
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}
