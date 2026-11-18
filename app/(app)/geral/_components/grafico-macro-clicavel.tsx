"use client";

import { useRouter } from "next/navigation";
import {
  GraficoBarrasComparativo,
  type BarraDado,
} from "@/components/charts/grafico-barras-comparativo";
import {
  GraficoBarrasAtual,
  type BarraAtualDado,
} from "@/components/charts/grafico-barras-atual";

export function GraficoMacroClicavel({ dados }: { dados: BarraDado[] }) {
  const router = useRouter();
  return (
    <GraficoBarrasComparativo
      dados={dados}
      onBarClick={(id) => router.push(`/individual/${id}`)}
    />
  );
}

export function GraficoMacroAtualClicavel({ dados }: { dados: BarraAtualDado[] }) {
  const router = useRouter();
  return (
    <GraficoBarrasAtual
      dados={dados}
      onBarClick={(id) => router.push(`/individual/${id}`)}
    />
  );
}
