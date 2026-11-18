"use client";

import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from "recharts";
import { formatNumber, formatPercent } from "@/lib/format";
import type { TurnoGrupoTotal } from "@/lib/transform";

export function GraficoTurnoDonut({ dados }: { dados: TurnoGrupoTotal[] }) {
  const total = dados.reduce((soma, item) => soma + item.total, 0);

  if (!total) {
    return (
      <p className="py-10 text-center text-sm text-gray-400">
        Sem pendências para os filtros selecionados.
      </p>
    );
  }

  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-4">
      <div className="relative h-[170px] w-[170px] flex-shrink-0">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={dados}
              dataKey="total"
              nameKey="label"
              innerRadius={54}
              outerRadius={80}
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
                  `${formatNumber(numeric)} (${formatPercent((numeric / total) * 100)})`,
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
          <span className="text-2xl font-bold leading-none text-brand-verde">
            {formatNumber(total)}
          </span>
          <span className="mt-1 text-[10px] uppercase tracking-wide text-gray-400">
            pendências
          </span>
        </div>
      </div>
      <ul className="w-full space-y-2 text-sm">
        {dados.map((d) => (
          <li key={d.key} className="flex items-center gap-2">
            <span
              className="h-3 w-3 flex-shrink-0 rounded-full"
              style={{ backgroundColor: d.color }}
            />
            <span className="text-gray-600">{d.label}</span>
            <span className="ml-auto font-semibold tabular-nums text-gray-900">
              {formatNumber(d.total)}
            </span>
            <span className="w-12 text-right text-xs tabular-nums text-gray-400">
              {formatPercent((d.total / total) * 100)}
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}
