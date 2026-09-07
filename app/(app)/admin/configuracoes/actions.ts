"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

export interface ResultadoLogo {
  ok: boolean;
  erro?: string;
}

const TIPOS_ACEITOS = ["image/png", "image/jpeg", "image/svg+xml", "image/webp"];
const TAMANHO_MAXIMO = 2 * 1024 * 1024; // 2MB

export async function uploadLogo(formData: FormData): Promise<ResultadoLogo> {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return { ok: false, erro: "Sessão expirada. Faça login novamente." };
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  if (profile?.role !== "administrador") {
    return { ok: false, erro: "Apenas administradores podem alterar a logo." };
  }

  const file = formData.get("arquivo");
  if (!(file instanceof File) || file.size === 0) {
    return { ok: false, erro: "Selecione uma imagem." };
  }

  if (!TIPOS_ACEITOS.includes(file.type)) {
    return {
      ok: false,
      erro: "Formato não suportado. Envie PNG, JPG, SVG ou WEBP.",
    };
  }

  if (file.size > TAMANHO_MAXIMO) {
    return { ok: false, erro: "A imagem deve ter no máximo 2MB." };
  }

  const { error: uploadError } = await supabase.storage
    .from("sistema-assets")
    .upload("logo/current", file, { upsert: true, contentType: file.type });

  if (uploadError) {
    return { ok: false, erro: uploadError.message };
  }

  const { error: updateError } = await supabase
    .from("configuracoes_sistema")
    .update({ logo_atualizado_em: new Date().toISOString() })
    .eq("id", true);

  if (updateError) {
    return { ok: false, erro: updateError.message };
  }

  revalidatePath("/", "layout");

  return { ok: true };
}
