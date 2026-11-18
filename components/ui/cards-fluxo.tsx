import { createClient } from "@/lib/supabase/server";
import { formatNumber } from "@/lib/format";
import { KpiCard } from "@/components/ui/kpi-card";
import {
  IconFlag,
  IconGraduationCap,
  IconTrendingDown,
} from "@/components/ui/icons";

interface FiltrosFluxo {
  p_macro_ids?: string[];
  p_estrutura_ids?: string[];
  p_treinamento_ids?: string[];
  p_qualis?: boolean;
  p_turno_grupos?: string[];
}

/**
 * Cards de Resolvidas x Novas desde o início. Carregam separados (dentro de
 * <Suspense>), para a página não esperar por essa conta, que é a mais pesada.
 * Sem a função do banco, mostram a Redução líquida (Início − Atual).
 */
export async function CardsFluxo({
  filtros,
  inicio,
  atual,
  modo,
}: {
  filtros: FiltrosFluxo;
  inicio: number;
  atual: number;
  /** "dois": Resolvidas + Novas; "um": só Resolvidas, com as novas na dica. */
  modo: "dois" | "um";
}) {
  const supabase = await createClient();
  const { data, error } = await supabase.rpc("rpc_fluxo_pendencias", filtros);
  const fluxo = !error ? data?.[0] : undefined;
  const reducao = inicio - atual;

  if (!fluxo) {
    return (
      <>
        <KpiCard
          label="Redução líquida"
          value={formatNumber(reducao)}
          accent={reducao >= 0 ? "verde" : "vermelho"}
          hint="Início − Atual"
          icon={<IconTrendingDown />}
        />
        {modo === "dois" && (
          <KpiCard
            label="Pendências no início"
            value={formatNumber(inicio)}
            accent="azul"
            icon={<IconFlag />}
          />
        )}
      </>
    );
  }

  if (modo === "um") {
    return (
      <KpiCard
        label="Resolvidas desde o início"
        value={formatNumber(fluxo.resolvidas)}
        accent="verde"
        hint={`+${formatNumber(fluxo.novas)} novas desde o início`}
        icon={<IconGraduationCap />}
      />
    );
  }

  return (
    <>
      <KpiCard
        label="Resolvidas desde o início"
        value={formatNumber(fluxo.resolvidas)}
        accent="verde"
        hint="Pendências do início já feitas"
        icon={<IconGraduationCap />}
      />
      <KpiCard
        label="Novas desde o início"
        value={formatNumber(fluxo.novas)}
        accent={fluxo.novas > 0 ? "ambar" : "muted"}
        hint="Surgiram depois do marco"
        icon={<IconFlag />}
      />
    </>
  );
}

/** Placeholder dos cards enquanto a conta carrega. */
export function CardsFluxoCarregando({ quantidade }: { quantidade: number }) {
  return (
    <>
      {Array.from({ length: quantidade }, (_, i) => (
        <div
          key={i}
          className="h-[68px] animate-pulse rounded-xl border border-gray-100 bg-white shadow-sm"
        />
      ))}
    </>
  );
}
