import { NextRequest, NextResponse } from "next/server";
import { renderToBuffer } from "@react-pdf/renderer";
import { createClient } from "@/lib/supabase/server";
import { isTurnoGrupoKey, TURNO_GRUPOS } from "@/lib/filters";
import {
  RelatorioColaboradores,
  type LinhaRelatorio,
} from "@/lib/pdf/relatorio-colaboradores";

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
    .select("nome, role")
    .eq("id", user.id)
    .single();
  const isAdmin = profile?.role === "administrador";

  const sp = request.nextUrl.searchParams;
  const macroEstruturaId = sp.get("macro") || undefined;
  const estruturaId = sp.get("estrutura") || undefined;
  const treinamentoId = sp.get("treinamento") || undefined;
  const qualisParam = sp.get("qualis");
  const qualis = isAdmin
    ? qualisParam === "sim"
      ? true
      : qualisParam === "nao"
        ? false
        : undefined
    : true;
  const turnoGrupo = isTurnoGrupoKey(sp.get("turno")) ? sp.get("turno")! : undefined;

  const [{ data: macro }, { data: estrutura }, { data: treinamento }, { data: tabelaRows }] =
    await Promise.all([
      macroEstruturaId
        ? supabase
            .from("macro_estruturas")
            .select("nome")
            .eq("id", macroEstruturaId)
            .maybeSingle()
        : Promise.resolve({ data: null }),
      estruturaId
        ? supabase.from("estruturas").select("nome").eq("id", estruturaId).maybeSingle()
        : Promise.resolve({ data: null }),
      treinamentoId
        ? supabase.from("treinamentos").select("nome").eq("id", treinamentoId).maybeSingle()
        : Promise.resolve({ data: null }),
      supabase.rpc("rpc_tabela_detalhada", {
        p_macro_estrutura_id: macroEstruturaId,
        p_estrutura_id: estruturaId,
        p_treinamento_id: treinamentoId,
        p_qualis: qualis,
        p_turno_grupo: turnoGrupo,
        p_order_by: "colaborador",
        p_order_dir: "asc",
        p_page: 1,
        p_page_size: 50000,
      }),
    ]);

  const linhas: LinhaRelatorio[] = (tabelaRows ?? []).map((r) => ({
    matricula: r.matricula,
    colaborador: r.colaborador,
    id_treina: r.id_treina,
    treinamento: r.treinamento,
    turno: r.turno,
  }));
  const totalCount = tabelaRows?.[0]?.total_count ?? linhas.length;

  const turnoLabel = turnoGrupo
    ? (TURNO_GRUPOS.find((g) => g.key === turnoGrupo)?.label ?? "Todos")
    : "Todos";

  const buffer = await renderToBuffer(
    RelatorioColaboradores({
      macroEstrutura: macro?.nome ?? "Todas",
      estrutura: estrutura?.nome ?? "Todas",
      treinamento: treinamento?.nome ?? "Todos",
      qualis: qualis === true ? "Sim" : qualis === false ? "Não" : "Todos",
      turno: turnoLabel,
      geradoEm: new Date().toLocaleString("pt-BR"),
      geradoPor: profile?.nome ?? user.email ?? "—",
      totalCount,
      linhas,
    }),
  );

  return new NextResponse(new Uint8Array(buffer), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="detalhamento-colaboradores.pdf"`,
    },
  });
}
