"use server";

import { createClient } from "@/lib/supabase/server";
import { parsePlanilhaPendencias } from "@/lib/import/parse-planilha";
import type { Json } from "@/lib/types/database.types";

export interface ResultadoImportacao {
  ok: boolean;
  erro?: string;
  avisoQueda?: {
    atual: number;
    novo: number;
    percentualQueda: number;
  };
  resumo?: {
    colaboradores: number;
    treinamentos: number;
    pendencias: number;
    erros: number;
  };
}

export async function importarPendencias(
  formData: FormData,
): Promise<ResultadoImportacao> {
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
    return { ok: false, erro: "Apenas administradores podem importar dados." };
  }

  const file = formData.get("arquivo");
  if (!(file instanceof File) || file.size === 0) {
    return { ok: false, erro: "Selecione um arquivo .xlsx para importar." };
  }

  const forcar = formData.get("forcar") === "true";

  let parsed;
  try {
    const buffer = Buffer.from(await file.arrayBuffer());
    parsed = await parsePlanilhaPendencias(buffer);
  } catch (err) {
    return {
      ok: false,
      erro: err instanceof Error ? err.message : "Falha ao ler o arquivo.",
    };
  }

  if (!parsed.pendencias.length) {
    return {
      ok: false,
      erro: "Nenhuma pendência foi encontrada na planilha enviada.",
    };
  }

  if (!forcar) {
    const { count } = await supabase
      .from("treinamentos_colaboradores")
      .select("id", { count: "exact", head: true });
    const atual = count ?? 0;
    const novo = parsed.pendencias.length;
    if (atual > 0 && novo < atual * 0.8) {
      return {
        ok: false,
        avisoQueda: {
          atual,
          novo,
          percentualQueda: ((atual - novo) / atual) * 100,
        },
      };
    }
  }

  const { data, error } = await supabase.rpc("rpc_importar_pendencias", {
    p_arquivo_nome: file.name,
    p_colaboradores: parsed.colaboradores as unknown as Json,
    p_treinamentos: parsed.treinamentos as unknown as Json,
    p_pendencias: parsed.pendencias as unknown as Json,
  });

  if (error) {
    return { ok: false, erro: error.message };
  }

  const resultado = data?.[0];
  return {
    ok: true,
    resumo: {
      colaboradores: resultado?.total_colaboradores ?? 0,
      treinamentos: resultado?.total_treinamentos ?? 0,
      pendencias: resultado?.total_pendencias ?? 0,
      erros: resultado?.total_erros ?? 0,
    },
  };
}
