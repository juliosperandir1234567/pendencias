import { NextRequest, NextResponse } from "next/server";
import { renderToBuffer } from "@react-pdf/renderer";
import { createClient } from "@/lib/supabase/server";
import { isNrStatus, NR_STATUS_LABELS } from "@/lib/nr";
import { RelatorioNr, type LinhaRelatorioNr } from "@/lib/pdf/relatorio-nr";

const ORDER_WHITELIST = [
  "matricula",
  "colaborador",
  "treinamento",
  "data_vencimento",
  "status",
] as const;

export async function GET(request: NextRequest) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ erro: "Sessão expirada." }, { status: 401 });
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("nome")
    .eq("id", user.id)
    .single();

  const sp = request.nextUrl.searchParams;
  const macroId = sp.get("macro") || undefined;
  const estruturaId = sp.get("estrutura") || undefined;
  const treinamentoId = sp.get("treinamento") || undefined;
  const statusParam = sp.get("status");
  const status = isNrStatus(statusParam) ? statusParam : undefined;
  const statusAdm = sp.get("status_adm") || undefined;
  const exameParam = sp.get("exame");
  const exame = exameParam === "S" ? true : exameParam === "N" ? false : undefined;
  const orderBy = (ORDER_WHITELIST as readonly string[]).includes(sp.get("sort") ?? "")
    ? (sp.get("sort") as (typeof ORDER_WHITELIST)[number])
    : "colaborador";
  const orderDir = sp.get("dir") === "desc" ? "desc" : "asc";

  const [{ data: macro }, { data: estrutura }, { data: treinamento }, { data: tabelaRows }] =
    await Promise.all([
      macroId
        ? supabase.from("macro_estruturas").select("nome").eq("id", macroId).maybeSingle()
        : Promise.resolve({ data: null }),
      estruturaId
        ? supabase.from("estruturas").select("nome").eq("id", estruturaId).maybeSingle()
        : Promise.resolve({ data: null }),
      treinamentoId
        ? supabase.from("nr_treinamentos").select("nome").eq("id", treinamentoId).maybeSingle()
        : Promise.resolve({ data: null }),
      supabase.rpc("rpc_espelho_nr_tabela", {
        p_macro_ids: macroId ? [macroId] : undefined,
        p_estrutura_id: estruturaId,
        p_treinamento_id: treinamentoId,
        p_status: status,
        p_status_adm: statusAdm,
        p_exame: exame,
        p_order_by: orderBy,
        p_order_dir: orderDir,
        p_page: 1,
        p_page_size: 50000,
      }),
    ]);

  const linhas: LinhaRelatorioNr[] = (tabelaRows ?? []).map((r) => ({
    matricula: r.matricula,
    colaborador: r.colaborador,
    treinamento: r.treinamento,
    data_vencimento: r.data_vencimento,
    status: r.status,
  }));
  const totalCount = tabelaRows?.[0]?.total_count ?? linhas.length;

  const buffer = await renderToBuffer(
    RelatorioNr({
      macroEstrutura: macro?.nome ?? "Todas",
      estrutura: estrutura?.nome ?? "Todas",
      treinamento: treinamento?.nome ?? "Todos",
      status: status ? NR_STATUS_LABELS[status] : "Todos",
      geradoEm: new Date().toLocaleString("pt-BR"),
      geradoPor: profile?.nome ?? user.email ?? "—",
      totalCount,
      linhas,
    }),
  );

  return new NextResponse(new Uint8Array(buffer), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="espelho-nr.pdf"`,
    },
  });
}
