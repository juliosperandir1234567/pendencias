import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { formatNumber } from "@/lib/format";
import { FormularioImportacao } from "./_components/formulario-importacao";

export default async function ImportarPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();
  if (profile?.role !== "administrador") redirect("/geral");

  const { count: totalAtual } = await supabase
    .from("treinamentos_colaboradores")
    .select("id", { count: "exact", head: true });

  const { data: ultimaImportacao } = await supabase
    .from("importacoes")
    .select(
      "arquivo_nome, status, total_sucesso, total_erro, finalizado_em, iniciado_em",
    )
    .order("iniciado_em", { ascending: false })
    .limit(1)
    .maybeSingle();

  return (
    <div className="max-w-2xl space-y-6">
      <div>
        <h2 className="text-xl font-semibold text-brand-verde">
          Importar Pendências
        </h2>
        <p className="text-sm text-gray-500">
          Envie a planilha atualizada (aba &quot;Pend&quot;) para sincronizar
          as pendências atuais. O marco de Início não é alterado por esta
          importação.
        </p>
      </div>

      {ultimaImportacao && (
        <div className="rounded-xl border border-gray-100 bg-white p-4 text-sm shadow-sm">
          <p className="font-medium text-gray-700">Última importação</p>
          <p className="text-gray-500">
            {ultimaImportacao.arquivo_nome} ·{" "}
            {new Date(
              ultimaImportacao.finalizado_em ?? ultimaImportacao.iniciado_em,
            ).toLocaleString("pt-BR")}
          </p>
          <p className="mt-1 text-gray-500">
            {formatNumber(ultimaImportacao.total_sucesso)} pendências
            importadas
            {ultimaImportacao.total_erro > 0 &&
              ` · ${formatNumber(ultimaImportacao.total_erro)} linha(s) com erro`}
          </p>
        </div>
      )}

      <div className="rounded-xl border border-gray-100 bg-white p-6 shadow-sm">
        <FormularioImportacao totalAtual={totalAtual ?? 0} />
      </div>
    </div>
  );
}
