import { createClient } from "@/lib/supabase/server";
import { signIn } from "./actions";

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const { error } = await searchParams;

  const supabase = await createClient();
  const { data: config } = await supabase
    .from("configuracoes_sistema")
    .select("login_bg_atualizado_em")
    .eq("id", true)
    .maybeSingle();

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
