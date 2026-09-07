import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { signOut } from "@/app/login/actions";
import { IconBuilding } from "@/components/ui/icons";
import { NavLink } from "./_components/nav-link";

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("nome, role")
    .eq("id", user.id)
    .single();

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
    <div className="min-h-screen overflow-x-hidden bg-gray-50">
      <header className="bg-brand-verde text-white shadow-sm">
        <div className="mx-auto grid max-w-7xl grid-cols-[auto_1fr_auto] items-center gap-3 px-3 py-2.5 sm:px-6">
          <div className="flex items-center gap-2">
            <span className="flex h-9 w-9 flex-shrink-0 items-center justify-center overflow-hidden rounded-lg bg-white/10">
              {logoUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={logoUrl}
                  alt="Logo"
                  className="h-full w-full object-contain"
                />
              ) : (
                <IconBuilding className="h-5 w-5 text-white" />
              )}
            </span>
            <p className="hidden text-[10px] uppercase tracking-widest text-emerald-100/80 sm:block">
              Usina
            </p>
          </div>

          <h1 className="truncate text-center text-base font-semibold sm:text-xl">
            Dashboard de Pendências
          </h1>

          <div className="flex items-center gap-2 justify-self-end sm:gap-3">
            <div className="hidden text-right text-xs sm:block">
              <p className="font-medium">{profile?.nome ?? user.email}</p>
              <p className="text-[10px] text-emerald-100/80">
                {profile?.role === "administrador" ? "Administrador" : "Gestor"}
              </p>
            </div>
            <form action={signOut}>
              <button
                type="submit"
                className="rounded-lg border border-white/30 px-2.5 py-1 text-xs font-medium text-white transition hover:bg-white/10"
              >
                Sair
              </button>
            </form>
          </div>
        </div>
        <nav className="border-t border-white/10 bg-black/10">
          <div className="mx-auto flex max-w-7xl gap-1 overflow-x-auto px-3 sm:px-6">
            <NavLink href="/geral">Visão Geral</NavLink>
            <NavLink href="/individual">Visão Individual</NavLink>
            {profile?.role === "administrador" && (
              <>
                <NavLink href="/admin/importar">Importar</NavLink>
                <NavLink href="/admin/configuracoes">Configurações</NavLink>
              </>
            )}
          </div>
        </nav>
      </header>
      <main className="mx-auto max-w-7xl p-3 sm:p-5">{children}</main>
    </div>
  );
}
