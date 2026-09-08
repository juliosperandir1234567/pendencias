"use server";

import { createClient } from "@/lib/supabase/server";
import { parsePlanilhaNr } from "@/lib/import/parse-planilha-nr";
import type { Json } from "@/lib/types/database.types";

export interface ResultadoImportacaoNr {
  ok: boolean;
  erro?: string;
  avisoQueda?: {
    atual: number;
    novo: number;
    percentualQueda: number;
  };
  resumo?: {
    treinamentos: number;
    registros: number;
    erros: number;
  };
}

export async function importarNr(formData: FormData): Promise<ResultadoImportacaoNr> {
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
    parsed = await parsePlanilhaNr(buffer);
  } catch (err) {
    return {
      ok: false,
      erro: err instanceof Error ? err.message : "Falha ao ler o arquivo.",
    };
  }

  if (!parsed.registros.length) {
    return {
      ok: false,
      erro: "Nenhum registro foi encontrado na planilha enviada.",
    };
  }

  if (!forcar) {
    const { count } = await supabase
      .from("nr_colaboradores")
      .select("id", { count: "exact", head: true });
    const atual = count ?? 0;
    const novo = parsed.registros.length;
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

  const { data, error } = await supabase.rpc("rpc_importar_nr", {
    p_arquivo_nome: file.name,
    p_treinamentos: parsed.treinamentos as unknown as Json,
    p_registros: parsed.registros as unknown as Json,
  });

  if (error) {
    return { ok: false, erro: error.message };
  }

  const resultado = data?.[0];
  return {
    ok: true,
    resumo: {
      treinamentos: resultado?.total_treinamentos ?? 0,
      registros: resultado?.total_registros ?? 0,
      erros: resultado?.total_erros ?? 0,
    },
  };
}
