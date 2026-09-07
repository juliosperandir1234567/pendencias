"use client";

import { useRouter } from "next/navigation";
import {
  GraficoBarrasComparativo,
  type BarraDado,
} from "@/components/charts/grafico-barras-comparativo";

export function GraficoMacroClicavel({ dados }: { dados: BarraDado[] }) {
  const router = useRouter();
  return (
    <GraficoBarrasComparativo
      dados={dados}
      onBarClick={(id) => router.push(`/individual/${id}`)}
    />
  );
}
