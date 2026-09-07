import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export default async function IndividualIndexPage() {
  const supabase = await createClient();
  const { data } = await supabase.rpc("rpc_grafico_macro_estrutura");

  const macros = (data ?? [])
    .slice()
    .sort((a, b) => b.atual_pendencias - a.atual_pendencias);

  if (macros[0]) {
    redirect(`/individual/${macros[0].macro_estrutura_id}`);
  }

  return (
    <div className="space-y-2">
      <h2 className="text-xl font-semibold text-brand-verde">
        Visão Individual
      </h2>
      <p className="text-sm text-gray-500">
        Nenhuma macro estrutura encontrada.
      </p>
    </div>
  );
}
