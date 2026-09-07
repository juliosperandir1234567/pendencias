import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { FormularioLogo } from "./_components/formulario-logo";
import { FormularioUsuario } from "./_components/formulario-usuario";
import { ListaUsuarios } from "./_components/lista-usuarios";

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

  const [{ data: config }, { data: usuarios }, { data: vinculos }] =
    await Promise.all([
      supabase
        .from("configuracoes_sistema")
        .select("logo_atualizado_em")
        .eq("id", true)
        .maybeSingle(),
      supabase
        .from("profiles")
        .select("id, nome, email, role, created_at")
        .order("created_at"),
      supabase.from("gestor_estruturas").select("gestor_id, estrutura_id"),
    ]);

  const logoUrl = config?.logo_atualizado_em
    ? `${
        supabase.storage.from("sistema-assets").getPublicUrl("logo/current")
          .data.publicUrl
      }?v=${new Date(config.logo_atualizado_em).getTime()}`
    : null;

  const estruturasPorGestor = new Map<string, number>();
  for (const v of vinculos ?? []) {
    estruturasPorGestor.set(
      v.gestor_id,
      (estruturasPorGestor.get(v.gestor_id) ?? 0) + 1,
    );
  }

  return (
    <div className="max-w-2xl space-y-6">
      <div>
        <h2 className="text-xl font-semibold text-brand-verde">
          Configurações
        </h2>
        <p className="text-sm text-gray-500">
          Personalize a logo e gerencie os usuários do sistema.
        </p>
      </div>

      <div className="rounded-xl border border-gray-100 bg-white p-6 shadow-sm">
        <h3 className="mb-4 text-sm font-semibold text-gray-700">
          Logo do sistema
        </h3>
        <FormularioLogo logoAtual={logoUrl} />
      </div>

      <div className="rounded-xl border border-gray-100 bg-white p-6 shadow-sm">
        <h3 className="mb-4 text-sm font-semibold text-gray-700">
          Usuários cadastrados
        </h3>
        <ListaUsuarios
          usuarios={(usuarios ?? []).map((u) => ({
            ...u,
            totalEstruturas: estruturasPorGestor.get(u.id) ?? 0,
          }))}
          usuarioAtualId={user.id}
        />
      </div>

      <div className="rounded-xl border border-gray-100 bg-white p-6 shadow-sm">
        <h3 className="mb-4 text-sm font-semibold text-gray-700">
          Criar novo usuário
        </h3>
        <FormularioUsuario />
      </div>
    </div>
  );
}
