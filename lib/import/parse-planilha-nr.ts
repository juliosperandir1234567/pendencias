import ExcelJS from "exceljs";

export interface ColaboradorNrLinha {
  matricula: string;
  nome: string;
  macro_processo: string;
  estrutura_codigo: string;
  turno: string;
}

export interface RegistroNrLinha {
  matricula: string;
  treinamento: string;
  data_realizacao: string;
  data_vencimento: string;
  status_adm: string;
  exame: "S" | "N" | "";
  status_venc: string;
}

export interface TreinamentoNrLinha {
  nome: string;
}

export interface PlanilhaNrParseada {
  colaboradores: ColaboradorNrLinha[];
  treinamentos: TreinamentoNrLinha[];
  registros: RegistroNrLinha[];
}

const TURNO_MAP: Record<string, string> = {
  DIURNO: "diurno",
  VESPERTINO: "vespertino",
  NOTURNO: "noturno",
  FIXO: "fixo",
};

// Layout confirmado da aba "Espelho de NR's": colunas ID_ESTRUTURA_MACRO,
// MACRO_PROCESSO, ID_ESTRUTURA, DS_ESTRUTURA, MATRICULA, NOME, TURNO,
// DS_TREINAMENTO, VENCIMENTO, STATUS_VENC, STATUS_ADM, EXAME.
const COLUNAS_MATRICULA = ["matricula"];
const COLUNAS_NOME = ["nome", "colaborador"];
const COLUNAS_MACRO_PROCESSO = ["macro processo", "macroprocesso"];
const COLUNAS_ESTRUTURA = ["ds estrutura", "estrutura"];
const COLUNAS_TURNO = ["turno"];
const COLUNAS_TREINAMENTO = [
  "ds treinamento",
  "treinamento",
  "nr",
  "norma",
  "norma regulamentadora",
];
const COLUNAS_DATA_VENCIMENTO = [
  "vencimento",
  "data vencimento",
  "data de vencimento",
  "data validade",
  "validade",
];
const COLUNAS_DATA_REALIZACAO = [
  "data realizacao",
  "data de realizacao",
  "data do treinamento",
  "realizacao",
];
const COLUNAS_STATUS_ADM = ["status adm", "status administrativo"];
const COLUNAS_EXAME = ["exame"];
const COLUNAS_STATUS_VENC = ["status venc", "status vencimento", "status"];

// Valores da coluna STATUS_VENC da planilha, mapeados para as chaves internas
// usadas pelo painel (ver lib/nr.ts). "SEM TREINAMENTO" não entra aqui pois
// essas linhas são descartadas antes de chegar aqui (ver eachRow abaixo).
const STATUS_VENC_MAP: Record<string, string> = {
  "EM DIA": "em_dia",
  "A VENCER": "a_vencer",
  VENCIDO: "vencido",
  "ABERTA SOLICITACAO": "aberta_solicitacao",
};

function normalizar(texto: string): string {
  return texto
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/_/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .toLowerCase();
}

function resolverValor(raw: unknown): unknown {
  if (raw !== null && typeof raw === "object") {
    const obj = raw as Record<string, unknown>;
    if ("richText" in obj && Array.isArray(obj.richText)) {
      return (obj.richText as { text: string }[]).map((t) => t.text).join("");
    }
    if ("result" in obj) return resolverValor(obj.result);
  }
  return raw;
}

function textoCelula(raw: unknown): string {
  const v = resolverValor(raw);
  if (v === null || v === undefined) return "";
  if (v instanceof Date) return v.toISOString().slice(0, 10);
  return String(v).trim();
}

function dataCelula(raw: unknown): string {
  const v = resolverValor(raw);
  if (v === null || v === undefined || v === "") return "";
  if (v instanceof Date) return v.toISOString().slice(0, 10);
  const texto = String(v).trim();
  const brasileiro = texto.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
  if (brasileiro) {
    const [, dia, mes, ano] = brasileiro;
    return `${ano}-${mes.padStart(2, "0")}-${dia.padStart(2, "0")}`;
  }
  // Outros textos (ex.: "Em Dia", "Sem Treinamento") não são datas válidas —
  // retorna vazio; quem decide o que fazer com isso é o chamador.
  if (/^\d{4}-\d{2}-\d{2}$/.test(texto)) return texto;
  return "";
}

export async function parsePlanilhaNr(buffer: Buffer): Promise<PlanilhaNrParseada> {
  const workbook = new ExcelJS.Workbook();
  await workbook.xlsx.load(
    buffer as unknown as Parameters<typeof workbook.xlsx.load>[0],
  );

  const sheet = workbook.worksheets[0];
  if (!sheet) {
    throw new Error("Nenhuma planilha encontrada no arquivo enviado.");
  }

  const header = sheet.getRow(1);
  const colunas: Record<string, number> = {};
  header.eachCell((cell, colNumber) => {
    colunas[normalizar(textoCelula(cell.value))] = colNumber;
  });

  function encontrarColuna(candidatos: string[]): number | null {
    for (const c of candidatos) {
      if (colunas[c] !== undefined) return colunas[c];
    }
    return null;
  }

  const colMatricula = encontrarColuna(COLUNAS_MATRICULA);
  const colNome = encontrarColuna(COLUNAS_NOME);
  const colMacroProcesso = encontrarColuna(COLUNAS_MACRO_PROCESSO);
  const colEstrutura = encontrarColuna(COLUNAS_ESTRUTURA);
  const colTurno = encontrarColuna(COLUNAS_TURNO);
  const colTreinamento = encontrarColuna(COLUNAS_TREINAMENTO);
  const colVencimento = encontrarColuna(COLUNAS_DATA_VENCIMENTO);
  const colRealizacao = encontrarColuna(COLUNAS_DATA_REALIZACAO);
  const colStatusAdm = encontrarColuna(COLUNAS_STATUS_ADM);
  const colExame = encontrarColuna(COLUNAS_EXAME);
  const colStatusVenc = encontrarColuna(COLUNAS_STATUS_VENC);

  if (
    !colMatricula ||
    !colNome ||
    !colMacroProcesso ||
    !colEstrutura ||
    !colTurno ||
    !colTreinamento ||
    !colVencimento
  ) {
    throw new Error(
      "Não encontrei as colunas esperadas (Matrícula, Nome, Macro Processo, Estrutura, Turno, Treinamento/NR, Vencimento). Confira o cabeçalho da planilha.",
    );
  }

  const colaboradoresMap = new Map<string, ColaboradorNrLinha>();
  const treinamentosSet = new Set<string>();
  const registros: RegistroNrLinha[] = [];

  sheet.eachRow((row, rowNumber) => {
    if (rowNumber === 1) return;

    const matricula = textoCelula(row.getCell(colMatricula).value);
    if (!matricula) return;

    const treinamento = textoCelula(row.getCell(colTreinamento).value);
    if (!treinamento) return;

    const statusVencTexto = colStatusVenc
      ? normalizar(textoCelula(row.getCell(colStatusVenc).value)).toUpperCase()
      : "";
    const statusVenc = STATUS_VENC_MAP[statusVencTexto] ?? "";

    // "Sem treinamento" indica que o colaborador nunca fez esse treinamento —
    // não é um registro a importar. Usamos STATUS_VENC quando disponível;
    // como reforço, também olhamos o texto bruto da célula de vencimento
    // (que traz "SEM TREINAMENTO" nesses casos) caso a coluna não exista.
    const vencimentoCelulaTexto = normalizar(
      textoCelula(row.getCell(colVencimento).value),
    );
    if (
      statusVencTexto === "SEM TREINAMENTO" ||
      (!statusVenc && vencimentoCelulaTexto === "sem treinamento")
    ) {
      return;
    }

    // A célula de vencimento pode trazer texto (ex.: "Em Dia") em vez de uma
    // data, quando o treinamento não tem prazo de validade — nesse caso o
    // registro é importado sem data_vencimento.
    const vencimento = dataCelula(row.getCell(colVencimento).value);

    const nome = textoCelula(row.getCell(colNome).value);
    const macroProcesso = textoCelula(row.getCell(colMacroProcesso).value);
    const estruturaTexto = textoCelula(row.getCell(colEstrutura).value);
    const turnoTexto = textoCelula(row.getCell(colTurno).value).toUpperCase();
    const turno = TURNO_MAP[turnoTexto];
    if (!turno) return;

    const realizacao = colRealizacao
      ? dataCelula(row.getCell(colRealizacao).value)
      : "";
    const statusAdm = colStatusAdm
      ? textoCelula(row.getCell(colStatusAdm).value)
      : "";
    const exameTexto = colExame
      ? textoCelula(row.getCell(colExame).value).toUpperCase()
      : "";
    const exame = exameTexto === "S" || exameTexto === "N" ? exameTexto : "";

    colaboradoresMap.set(matricula, {
      matricula,
      nome,
      macro_processo: macroProcesso,
      estrutura_codigo: estruturaTexto,
      turno,
    });
    treinamentosSet.add(treinamento);
    registros.push({
      matricula,
      treinamento,
      data_vencimento: vencimento,
      data_realizacao: realizacao,
      status_adm: statusAdm,
      exame,
      status_venc: statusVenc,
    });
  });

  return {
    colaboradores: [...colaboradoresMap.values()],
    treinamentos: [...treinamentosSet].map((nome) => ({ nome })),
    registros,
  };
}
