import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { FormularioLogo } from "./_components/formulario-logo";

export default async function ConfiguracoesPage() {
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

  const { data: config } = await supabase
    .from("configuracoes_sistema")
    .select("logo_atualizado_em")
    .eq("id", true)
    .maybeSingle();

  const logoUrl = config?.logo_atualizado_em
    ? `${
        supabase.storage.from("sistema-assets").getPublicUrl("logo/current")
          .data.publicUrl
      }?v=${new Date(config.logo_atualizado_em).getTime()}`
    : null;

  return (
    <div className="max-w-2xl space-y-6">
      <div>
        <h2 className="text-xl font-semibold text-brand-verde">
          Configurações
        </h2>
        <p className="text-sm text-gray-500">
          Personalize a logo exibida no cabeçalho do sistema.
        </p>
      </div>

      <div className="rounded-xl border border-gray-100 bg-white p-6 shadow-sm">
        <FormularioLogo logoAtual={logoUrl} />
      </div>
    </div>
  );
}
