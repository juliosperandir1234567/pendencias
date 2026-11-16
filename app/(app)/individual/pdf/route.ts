import { NextRequest, NextResponse } from "next/server";
import { renderToBuffer } from "@react-pdf/renderer";
import { createClient } from "@/lib/supabase/server";
import { isTurnoGrupoKey, TURNO_GRUPOS } from "@/lib/filters";
import {
  RelatorioColaboradores,
  type GrupoEstrutura,
  type LinhaRelatorio,
} from "@/lib/pdf/relatorio-colaboradores";
import { estruturasComRotulo, rotuloEstrutura } from "@/lib/estrutura";

const collatorNumerico = new Intl.Collator("pt-BR", { numeric: true, sensitivity: "base" });

/** Ordena por ID de treinamento (numérico) e depois pelo nome do colaborador. */
function ordenarPorIdTreina(linhas: LinhaRelatorio[]) {
  return [...linhas].sort(
    (a, b) =>
      collatorNumerico.compare(a.id_treina, b.id_treina) ||
      collatorNumerico.compare(a.colaborador, b.colaborador),
  );
}

async function baixarLogo(url: string) {
  try {
    const resp = await fetch(url, { cache: "no-store" });
    if (!resp.ok) return null;
    const tipo = resp.headers.get("content-type") ?? "";
    // O gerador de PDF só aceita PNG e JPG.
    const format = tipo.includes("png") ? "png" : tipo.includes("jpeg") || tipo.includes("jpg") ? "jpg" : null;
    if (!format) return null;
    return { data: Buffer.from(await resp.arrayBuffer()), format } as const;
  } catch {
    return null;
  }
}

const ORDER_WHITELIST = [
  "matricula",
  "colaborador",
  "id_treina",
  "treinamento",
  "turno",
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
  const orderBy = (ORDER_WHITELIST as readonly string[]).includes(sp.get("sort") ?? "")
    ? (sp.get("sort") as (typeof ORDER_WHITELIST)[number])
    : "colaborador";
  const orderDir = sp.get("dir") === "desc" ? "desc" : "asc";

  const tabelaArgs = {
    p_treinamento_id: treinamentoId,
    p_qualis: qualis,
    p_turno_grupo: turnoGrupo,
    p_order_by: orderBy,
    p_order_dir: orderDir,
    p_page: 1,
    p_page_size: 50000,
  } as const;

  // Só a macro escolhida: separa o relatório por estrutura, em ordem de nome.
  const dividirPorEstrutura = !!macroEstruturaId && !estruturaId;

  const [
    { data: macro },
    { data: estrutura },
    { data: treinamento },
    { data: estruturasDaMacro },
    { data: config },
  ] = await Promise.all([
    macroEstruturaId
      ? supabase.from("macro_estruturas").select("nome").eq("id", macroEstruturaId).maybeSingle()
      : Promise.resolve({ data: null }),
    estruturaId
      ? supabase.from("estruturas").select("codigo, nome").eq("id", estruturaId).maybeSingle()
      : Promise.resolve({ data: null }),
    treinamentoId
      ? supabase.from("treinamentos").select("nome").eq("id", treinamentoId).maybeSingle()
      : Promise.resolve({ data: null }),
    dividirPorEstrutura
      ? supabase
          .from("estruturas")
          .select("id, codigo, nome")
          .eq("macro_estrutura_id", macroEstruturaId!)
      : Promise.resolve({ data: null }),
    supabase
      .from("configuracoes_sistema")
      .select("logo_atualizado_em")
      .eq("id", true)
      .maybeSingle(),
  ]);

  const mapear = (rows: { matricula: string; colaborador: string; id_treina: string; treinamento: string; turno: LinhaRelatorio["turno"] }[] | null) =>
    ordenarPorIdTreina(
      (rows ?? []).map((r) => ({
        matricula: r.matricula,
        colaborador: r.colaborador,
        id_treina: r.id_treina,
        treinamento: r.treinamento,
        turno: r.turno,
      })),
    );

  let grupos: GrupoEstrutura[];
  if (dividirPorEstrutura) {
    const lista = estruturasComRotulo(estruturasDaMacro ?? []);
    const resultados = await Promise.all(
      lista.map((e) =>
        supabase.rpc("rpc_tabela_detalhada", {
          ...tabelaArgs,
          p_macro_estrutura_id: macroEstruturaId,
          p_estrutura_id: e.id,
        }),
      ),
    );
    grupos = lista.map((e, i) => ({ estrutura: e.nome, linhas: mapear(resultados[i].data) }));
  } else {
    const { data: tabelaRows } = await supabase.rpc("rpc_tabela_detalhada", {
      ...tabelaArgs,
      p_macro_estrutura_id: macroEstruturaId,
      p_estrutura_id: estruturaId,
    });
    grupos = [{ estrutura: null, linhas: mapear(tabelaRows) }];
  }
  const totalCount = grupos.reduce((soma, g) => soma + g.linhas.length, 0);

  const turnoLabel = turnoGrupo
    ? (TURNO_GRUPOS.find((g) => g.key === turnoGrupo)?.label ?? "Todos")
    : "Todos";

  const logo = config?.logo_atualizado_em
    ? await baixarLogo(
        `${supabase.storage.from("sistema-assets").getPublicUrl("logo/current").data.publicUrl}?v=${new Date(config.logo_atualizado_em).getTime()}`,
      )
    : null;

  const buffer = await renderToBuffer(
    RelatorioColaboradores({
      macroEstrutura: macro?.nome ?? "Todas",
      estrutura: estrutura ? rotuloEstrutura(estrutura) : "Todas",
      treinamento: treinamento?.nome ?? "Todos",
      qualis: qualis === true ? "Sim" : qualis === false ? "Não" : "Todos",
      turno: turnoLabel,
      // O servidor (Vercel) roda em UTC; o relatório usa o horário de Brasília.
      geradoEm: new Date().toLocaleString("pt-BR", { timeZone: "America/Sao_Paulo" }),
      geradoPor: profile?.nome ?? user.email ?? "—",
      totalCount,
      grupos,
      logo,
      turnoGrupoFiltro: turnoGrupo,
    }),
  );

  return new NextResponse(new Uint8Array(buffer), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="detalhamento-colaboradores.pdf"`,
    },
  });
}
