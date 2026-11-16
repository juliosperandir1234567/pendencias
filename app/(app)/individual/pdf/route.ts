import { NextRequest, NextResponse } from "next/server";
import { renderToBuffer } from "@react-pdf/renderer";
import { zipSync } from "fflate";
import { createClient } from "@/lib/supabase/server";
import {
  listaOuNada,
  parseIdsParam,
  parseQualis,
  parseTurnoGrupos,
  TURNO_GRUPOS,
} from "@/lib/filters";
import {
  RelatorioColaboradores,
  type GrupoEstrutura,
  type LinhaRelatorio,
} from "@/lib/pdf/relatorio-colaboradores";
import { estruturasComRotulo } from "@/lib/estrutura";

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
  const estruturaIds = parseIdsParam(sp.get("estrutura") ?? undefined);
  const treinamentoIds = parseIdsParam(sp.get("treinamento") ?? undefined);
  const qualis = parseQualis(sp.get("qualis"), isAdmin);
  const turnoGrupos = parseTurnoGrupos(sp.get("turno"));
  const orderBy = (ORDER_WHITELIST as readonly string[]).includes(sp.get("sort") ?? "")
    ? (sp.get("sort") as (typeof ORDER_WHITELIST)[number])
    : "colaborador";
  const orderDir = sp.get("dir") === "desc" ? "desc" : "asc";

  const tabelaArgs = {
    p_treinamento_ids: listaOuNada(treinamentoIds),
    p_qualis: qualis,
    p_turno_grupos: listaOuNada(turnoGrupos),
    p_order_by: orderBy,
    p_order_dir: orderDir,
    p_page: 1,
    p_page_size: 50000,
  } as const;

  // Só a macro escolhida, ou várias estruturas: separa o relatório por
  // estrutura, em ordem de nome.
  const dividirPorEstrutura =
    (!!macroEstruturaId && estruturaIds.length === 0) || estruturaIds.length > 1;

  const [
    { data: macro },
    { data: estruturasEscolhidas },
    { data: treinamentosEscolhidos },
    { data: estruturasDaMacro },
    { data: config },
  ] = await Promise.all([
    macroEstruturaId
      ? supabase.from("macro_estruturas").select("nome").eq("id", macroEstruturaId).maybeSingle()
      : Promise.resolve({ data: null }),
    estruturaIds.length
      ? supabase.from("estruturas").select("id, codigo, nome").in("id", estruturaIds)
      : Promise.resolve({ data: null }),
    treinamentoIds.length
      ? supabase.from("treinamentos").select("nome").in("id", treinamentoIds).order("nome")
      : Promise.resolve({ data: null }),
    dividirPorEstrutura && estruturaIds.length === 0
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
    const lista = estruturasComRotulo(
      estruturaIds.length ? (estruturasEscolhidas ?? []) : (estruturasDaMacro ?? []),
    );
    const resultados = await Promise.all(
      lista.map((e) =>
        supabase.rpc("rpc_tabela_detalhada", {
          ...tabelaArgs,
          p_macro_estrutura_id: macroEstruturaId,
          p_estrutura_ids: [e.id],
        }),
      ),
    );
    grupos = lista.map((e, i) => ({ estrutura: e.nome, linhas: mapear(resultados[i].data) }));
  } else {
    const { data: tabelaRows } = await supabase.rpc("rpc_tabela_detalhada", {
      ...tabelaArgs,
      p_macro_estrutura_id: macroEstruturaId,
      p_estrutura_ids: listaOuNada(estruturaIds),
    });
    grupos = [{ estrutura: null, linhas: mapear(tabelaRows) }];
  }
  const totalCount = grupos.reduce((soma, g) => soma + g.linhas.length, 0);

  const turnoLabel = turnoGrupos.length
    ? TURNO_GRUPOS.filter((g) => turnoGrupos.includes(g.key))
        .map((g) => g.label)
        .join(", ")
    : "Todos";
  const estruturaLabel = estruturasEscolhidas?.length
    ? resumirLista(estruturasComRotulo(estruturasEscolhidas).map((e) => e.nome))
    : "Todas";
  const treinamentoLabel = treinamentosEscolhidos?.length
    ? resumirLista(treinamentosEscolhidos.map((t) => t.nome))
    : "Todos";

  const logo = config?.logo_atualizado_em
    ? await baixarLogo(
        `${supabase.storage.from("sistema-assets").getPublicUrl("logo/current").data.publicUrl}?v=${new Date(config.logo_atualizado_em).getTime()}`,
      )
    : null;

  const props = {
    macroEstrutura: macro?.nome ?? "Todas",
    estrutura: estruturaLabel,
    treinamento: treinamentoLabel,
    qualis: qualis === true ? "Sim" : qualis === false ? "Não" : "Todos",
    turno: turnoLabel,
    // O servidor (Vercel) roda em UTC; o relatório usa o horário de Brasília.
    geradoEm: new Date().toLocaleString("pt-BR", { timeZone: "America/Sao_Paulo" }),
    geradoPor: profile?.nome ?? user.email ?? "—",
    totalCount,
    grupos,
    logo,
    turnoGruposFiltro: listaOuNada(turnoGrupos),
  };

  // ZIP: um PDF por estrutura da macro escolhida.
  if (sp.get("zip") === "1" && dividirPorEstrutura) {
    const arquivos: Record<string, Uint8Array> = {};
    for (const grupo of grupos.filter((g) => g.linhas.length > 0)) {
      const pdf = await renderToBuffer(
        RelatorioColaboradores({
          ...props,
          estrutura: grupo.estrutura ?? "Todas",
          totalCount: grupo.linhas.length,
          // Uma estrutura por arquivo: a faixa no topo fica redundante.
          grupos: [{ estrutura: null, linhas: grupo.linhas }],
        }),
      );
      let nome = nomeArquivo(`${props.macroEstrutura} - ${grupo.estrutura}`);
      for (let n = 2; arquivos[`${nome}.pdf`]; n++) nome = `${nome} (${n})`;
      arquivos[`${nome}.pdf`] = new Uint8Array(pdf);
    }
    if (!Object.keys(arquivos).length) {
      return NextResponse.json(
        { erro: "Nenhuma pendência no filtro aplicado." },
        { status: 404 },
      );
    }
    const zip = zipSync(arquivos, { level: 6 });
    const nomeZip = encodeURIComponent(`${nomeArquivo(props.macroEstrutura)} - PDFs por estrutura.zip`);
    return new NextResponse(zip, {
      headers: {
        "Content-Type": "application/zip",
        "Content-Disposition": `attachment; filename="pdfs-por-estrutura.zip"; filename*=UTF-8''${nomeZip}`,
      },
    });
  }

  const buffer = await renderToBuffer(RelatorioColaboradores(props));

  return new NextResponse(new Uint8Array(buffer), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="detalhamento-colaboradores.pdf"`,
    },
  });
}

/** Remove caracteres que o Windows não aceita em nome de arquivo. */
function nomeArquivo(texto: string) {
  return texto
    .replace(/[\\/:*?"<>|]+/g, "-")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, 120);
}

/** Cabeçalho do PDF: até 2 nomes; acima disso, "A, B e mais N". */
function resumirLista(nomes: string[]) {
  if (nomes.length <= 2) return nomes.join(", ");
  return `${nomes.slice(0, 2).join(", ")} e mais ${nomes.length - 2}`;
}
