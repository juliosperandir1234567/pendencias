import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { signIn } from "./actions";

/**
 * Quem está na tela de login ainda não entrou, e o RLS de
 * `configuracoes_sistema` não deixa visitante ler — a imagem de fundo nunca
 * aparecia. Lê só a data da imagem pelo servidor, com a chave de serviço;
 * se ela não estiver configurada, tenta com o cliente normal.
 */
async function lerConfigLogin(
  supabase: Awaited<ReturnType<typeof createClient>>,
) {
  try {
    const { data } = await createAdminClient()
      .from("configuracoes_sistema")
      .select("login_bg_atualizado_em")
      .eq("id", true)
      .maybeSingle();
    if (data) return data;
  } catch {
    // Sem SUPABASE_SERVICE_ROLE_KEY: segue com o cliente normal.
  }
  const { data } = await supabase
    .from("configuracoes_sistema")
    .select("login_bg_atualizado_em")
    .eq("id", true)
    .maybeSingle();
  return data;
}

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const { error } = await searchParams;

  const supabase = await createClient();
  const config = await lerConfigLogin(supabase);

  const bgUrl = config?.login_bg_atualizado_em
    ? `${
        supabase.storage
          .from("sistema-assets")
          .getPublicUrl("login-bg/current").data.publicUrl
      }?v=${new Date(config.login_bg_atualizado_em).getTime()}`
    : null;

  return (
    <div
      className="flex min-h-screen items-center justify-center bg-gray-100 bg-cover bg-center"
      style={bgUrl ? { backgroundImage: `url(${bgUrl})` } : undefined}
    >
      <div
        className={
          bgUrl
            ? "flex min-h-screen w-full items-center justify-center bg-black/35 px-4"
            : "w-full px-4"
        }
      >
        <form
          action={signIn}
          className="w-full max-w-sm space-y-4 rounded-lg bg-white p-8 shadow-xl"
        >
          <h1 className="text-center text-xl font-semibold text-brand-verde">
            Dashboard de Pendências
          </h1>
          {error && (
            <p className="rounded bg-red-50 p-2 text-sm text-red-700">{error}</p>
          )}
          <div className="space-y-1">
            <label className="text-sm font-medium text-gray-700" htmlFor="email">
              E-mail
            </label>
            <input
              id="email"
              name="email"
              type="email"
              required
              className="w-full rounded border border-gray-300 px-3 py-2 text-sm"
            />
          </div>
          <div className="space-y-1">
            <label className="text-sm font-medium text-gray-700" htmlFor="password">
              Senha
            </label>
            <input
              id="password"
              name="password"
              type="password"
              required
              className="w-full rounded border border-gray-300 px-3 py-2 text-sm"
            />
          </div>
          <button
            type="submit"
            className="w-full rounded bg-brand-verde py-2 text-sm font-medium text-white hover:bg-brand-verde-claro"
          >
            Entrar
          </button>
        </form>
      </div>
    </div>
  );
}
