import { createClient } from "@/lib/supabase/server";
import { SeletorMacroInicial } from "./_components/seletor-macro-inicial";

export default async function IndividualIndexPage() {
  const supabase = await createClient();
  const { data: macroEstruturas } = await supabase
    .from("macro_estruturas")
    .select("id, nome")
    .order("nome");

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-xl font-semibold text-brand-verde">
          Visão Individual
        </h2>
        <p className="text-sm text-gray-500">
          Selecione uma macro estrutura para ver o detalhamento por
          colaborador.
        </p>
      </div>

      <div className="max-w-md rounded-xl border border-gray-100 bg-white p-6 shadow-sm">
        <SeletorMacroInicial macroEstruturas={macroEstruturas ?? []} />
      </div>
    </div>
  );
}
