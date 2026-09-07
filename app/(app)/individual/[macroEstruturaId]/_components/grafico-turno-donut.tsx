"use client";

import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from "recharts";
import { formatNumber } from "@/lib/format";
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
    <div>
      <div className="relative">
        <ResponsiveContainer width="100%" height={140}>
          <PieChart>
            <Pie
              data={dados}
              dataKey="total"
              nameKey="label"
              innerRadius={38}
              outerRadius={56}
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
          <span className="text-lg font-bold text-brand-verde">
            {formatNumber(total)}
          </span>
          <span className="text-[10px] text-gray-400">pendências</span>
        </div>
      </div>
      <ul className="mt-2 grid grid-cols-2 gap-1.5 text-xs">
        {dados.map((d) => (
          <li key={d.key} className="flex items-center gap-2">
            <span
              className="h-2.5 w-2.5 rounded-full"
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
