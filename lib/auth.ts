import { cache } from "react";
import { createClient } from "@/lib/supabase/server";

/**
 * Usuário logado e perfil, buscados uma vez por requisição: layout e página
 * compartilham o resultado (React `cache`) em vez de repetir as chamadas.
 *
 * `getClaims` valida o token localmente quando o projeto usa chaves
 * assimétricas, evitando uma ida ao servidor de autenticação; senão, ele
 * mesmo consulta o servidor, como o `getUser`.
 */
export const getSessao = cache(async () => {
  const supabase = await createClient();
  const { data } = await supabase.auth.getClaims();
  const claims = data?.claims;
  if (!claims?.sub) return null;

  const { data: profile } = await supabase
    .from("profiles")
    .select("nome, role")
    .eq("id", claims.sub)
    .single();

  return {
    userId: claims.sub,
    email: (claims.email as string | undefined) ?? null,
    nome: profile?.nome ?? null,
    isAdmin: profile?.role === "administrador",
  };
});
