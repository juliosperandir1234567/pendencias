import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getSessao } from "@/lib/auth";
import { signOut } from "@/app/login/actions";
import {
  IconBuilding,
  IconChartBar,
  IconCheckCircle,
  IconSettings,
  IconUpload,
  IconUsers,
} from "@/components/ui/icons";
import { NavLink, SideLink } from "./_components/nav-link";

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();
  const [sessao, { data: config }] = await Promise.all([
    getSessao(),
    supabase
      .from("configuracoes_sistema")
      .select("logo_atualizado_em")
      .eq("id", true)
      .maybeSingle(),
  ]);

  if (!sessao) {
    redirect("/login");
  }

  const logoUrl = config?.logo_atualizado_em
    ? `${
        supabase.storage.from("sistema-assets").getPublicUrl("logo/current")
          .data.publicUrl
      }?v=${new Date(config.logo_atualizado_em).getTime()}`
    : null;

  const isAdmin = sessao.isAdmin;
  const nomeUsuario = sessao.nome ?? sessao.email;
  const papel = isAdmin ? "Administrador" : "Gestor";

  const logo = (
    <span className="flex h-9 w-9 flex-shrink-0 items-center justify-center overflow-hidden rounded-lg bg-white">
      {logoUrl ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={logoUrl} alt="Logo" className="h-full w-full object-contain" />
      ) : (
        <IconBuilding className="h-5 w-5 text-brand-verde" />
      )}
    </span>
  );

  const botaoSair = (
    <form action={signOut}>
      <button
        type="submit"
        className="rounded-lg border border-white/30 px-2.5 py-1 text-xs font-medium text-white transition hover:bg-white/10"
      >
        Sair
      </button>
    </form>
  );

  return (
    <div className="min-h-[100dvh] overflow-x-hidden bg-gray-50">
      {/* Menu lateral fixo (telas grandes) */}
      <aside className="fixed inset-y-0 left-0 z-30 hidden w-56 flex-col bg-brand-verde text-white lg:flex">
        <div className="flex items-center gap-2.5 border-b border-white/10 px-4 py-4">
          {logo}
          <span className="text-sm font-semibold leading-tight">
            Dashboard de
            <br />
            Pendências
          </span>
        </div>
        <nav className="flex-1 space-y-1 overflow-y-auto px-3 py-4">
          <SideLink href="/geral" icon={<IconChartBar />}>
            Visão Geral
          </SideLink>
          <SideLink href="/individual" icon={<IconUsers />}>
            Visão Individual
          </SideLink>
          <SideLink href="/nr" icon={<IconCheckCircle />}>
            Espelho de NR&apos;s
          </SideLink>
          {isAdmin && (
            <>
              <p className="px-3 pb-1 pt-4 text-[10px] font-semibold uppercase tracking-wider text-emerald-100/50">
                Administração
              </p>
              <SideLink href="/admin/importar" icon={<IconUpload />}>
                Importar
              </SideLink>
              <SideLink href="/admin/configuracoes" icon={<IconSettings />}>
                Configurações
              </SideLink>
            </>
          )}
        </nav>
        <div className="flex items-center justify-between gap-2 border-t border-white/10 px-4 py-3">
          <div className="min-w-0 text-xs">
            <p className="truncate font-medium">{nomeUsuario}</p>
            <p className="text-[10px] text-emerald-100/70">{papel}</p>
          </div>
          {botaoSair}
        </div>
      </aside>

      {/* Cabeçalho com abas (telas pequenas) */}
      <header className="bg-brand-verde text-white shadow-sm lg:hidden">
        <div className="flex items-center gap-3 px-3 py-2.5 sm:px-6">
          {logo}
          <h1 className="flex-1 truncate text-base font-semibold">
            Dashboard de Pendências
          </h1>
          {botaoSair}
        </div>
        <nav className="border-t border-white/10 bg-black/10">
          <div className="flex gap-1 overflow-x-auto px-3 sm:px-6">
            <NavLink href="/geral">Visão Geral</NavLink>
            <NavLink href="/individual">Visão Individual</NavLink>
            <NavLink href="/nr">Espelho de NR&apos;s</NavLink>
            {isAdmin && (
              <>
                <NavLink href="/admin/importar">Importar</NavLink>
                <NavLink href="/admin/configuracoes">Configurações</NavLink>
              </>
            )}
          </div>
        </nav>
      </header>

      <div className="lg:pl-56">
        <main className="p-3 sm:p-5">{children}</main>
      </div>
    </div>
  );
}
