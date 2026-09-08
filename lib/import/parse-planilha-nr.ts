import ExcelJS from "exceljs";

export interface RegistroNrLinha {
  matricula: string;
  treinamento: string;
  data_realizacao: string;
  data_vencimento: string;
}

export interface TreinamentoNrLinha {
  nome: string;
}

export interface PlanilhaNrParseada {
  treinamentos: TreinamentoNrLinha[];
  registros: RegistroNrLinha[];
}

// Nomes de coluna aceitos (o formato exato da planilha "Espelho de NR's"
// ainda não foi confirmado — ajustar esta lista quando o arquivo real chegar).
const COLUNAS_MATRICULA = ["matricula"];
const COLUNAS_TREINAMENTO = ["treinamento", "nr", "norma", "norma regulamentadora"];
const COLUNAS_DATA_VENCIMENTO = [
  "data vencimento",
  "vencimento",
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

function normalizar(texto: string): string {
  return texto
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
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
  return texto;
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
  const colTreinamento = encontrarColuna(COLUNAS_TREINAMENTO);
  const colVencimento = encontrarColuna(COLUNAS_DATA_VENCIMENTO);
  const colRealizacao = encontrarColuna(COLUNAS_DATA_REALIZACAO);

  if (!colMatricula || !colTreinamento || !colVencimento) {
    throw new Error(
      "Não encontrei as colunas esperadas (Matrícula, Treinamento/NR, Data de Vencimento). Confira o cabeçalho da planilha.",
    );
  }

  const treinamentosSet = new Set<string>();
  const registros: RegistroNrLinha[] = [];

  sheet.eachRow((row, rowNumber) => {
    if (rowNumber === 1) return;

    const matricula = textoCelula(row.getCell(colMatricula).value);
    if (!matricula) return;

    const treinamento = textoCelula(row.getCell(colTreinamento).value);
    if (!treinamento) return;

    const vencimento = dataCelula(row.getCell(colVencimento).value);
    if (!vencimento) return;

    const realizacao = colRealizacao
      ? dataCelula(row.getCell(colRealizacao).value)
      : "";

    treinamentosSet.add(treinamento);
    registros.push({
      matricula,
      treinamento,
      data_vencimento: vencimento,
      data_realizacao: realizacao,
    });
  });

  return {
    treinamentos: [...treinamentosSet].map((nome) => ({ nome })),
    registros,
  };
}
