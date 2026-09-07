"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import type { Enums } from "@/lib/types/database.types";

export interface ResultadoLogo {
  ok: boolean;
  erro?: string;
}

export interface ResultadoUsuario {
  ok: boolean;
  erro?: string;
}

async function exigirAdmin() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false as const, erro: "Sessão expirada. Faça login novamente." };

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  if (profile?.role !== "administrador") {
    return { ok: false as const, erro: "Apenas administradores podem fazer isso." };
  }
  return { ok: true as const, supabase };
}

export async function criarUsuario(formData: FormData): Promise<ResultadoUsuario> {
  const check = await exigirAdmin();
  if (!check.ok) return check;
  const { supabase } = check;

  const nome = String(formData.get("nome") ?? "").trim();
  const email = String(formData.get("email") ?? "").trim();
  const senha = String(formData.get("senha") ?? "");
  const role = String(formData.get("role") ?? "gestor") as Enums<"user_role">;

  if (!nome || !email || senha.length < 6) {
    return {
      ok: false,
      erro: "Preencha nome, email e uma senha com pelo menos 6 caracteres.",
    };
  }

  let admin;
  try {
    admin = createAdminClient();
  } catch (err) {
    return { ok: false, erro: err instanceof Error ? err.message : "Erro de configuração." };
  }

  const { data: created, error: createError } = await admin.auth.admin.createUser({
    email,
    password: senha,
    email_confirm: true,
  });

  if (createError || !created.user) {
    return {
      ok: false,
      erro: createError?.message ?? "Não foi possível criar o usuário.",
    };
  }

  const { error: profileError } = await supabase.from("profiles").insert({
    id: created.user.id,
    nome,
    email,
    role,
  });

  if (profileError) {
    return { ok: false, erro: profileError.message };
  }

  if (role === "gestor") {
    const { data: todasEstruturas } = await supabase
      .from("estruturas")
      .select("id");

    if (todasEstruturas?.length) {
      const { error: vinculoError } = await supabase
        .from("gestor_estruturas")
        .insert(
          todasEstruturas.map((e) => ({
            gestor_id: created.user.id,
            estrutura_id: e.id,
          })),
        );
      if (vinculoError) {
        return { ok: false, erro: vinculoError.message };
      }
    }
  }

  revalidatePath("/admin/configuracoes");

  return { ok: true };
}

export async function removerUsuario(usuarioId: string): Promise<ResultadoUsuario> {
  const check = await exigirAdmin();
  if (!check.ok) return check;

  let admin;
  try {
    admin = createAdminClient();
  } catch (err) {
    return { ok: false, erro: err instanceof Error ? err.message : "Erro de configuração." };
  }

  const { error } = await admin.auth.admin.deleteUser(usuarioId);
  if (error) {
    return { ok: false, erro: error.message };
  }

  revalidatePath("/admin/configuracoes");

  return { ok: true };
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
