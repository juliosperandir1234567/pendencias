import ExcelJS from "exceljs";

export interface ColaboradorNrLinha {
  matricula: string;
  nome: string;
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
  // Células como "SEM TREINAMENTO" indicam que não há NR aplicável para a
  // linha — não é uma data válida, então a linha deve ser ignorada.
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
  const colEstrutura = encontrarColuna(COLUNAS_ESTRUTURA);
  const colTurno = encontrarColuna(COLUNAS_TURNO);
  const colTreinamento = encontrarColuna(COLUNAS_TREINAMENTO);
  const colVencimento = encontrarColuna(COLUNAS_DATA_VENCIMENTO);
  const colRealizacao = encontrarColuna(COLUNAS_DATA_REALIZACAO);
  const colStatusAdm = encontrarColuna(COLUNAS_STATUS_ADM);
  const colExame = encontrarColuna(COLUNAS_EXAME);

  if (
    !colMatricula ||
    !colNome ||
    !colEstrutura ||
    !colTurno ||
    !colTreinamento ||
    !colVencimento
  ) {
    throw new Error(
      "Não encontrei as colunas esperadas (Matrícula, Nome, Estrutura, Turno, Treinamento/NR, Vencimento). Confira o cabeçalho da planilha.",
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
    if (!treinamento || normalizar(treinamento) === "sem treinamento") return;

    const vencimento = dataCelula(row.getCell(colVencimento).value);
    if (!vencimento) return;

    const nome = textoCelula(row.getCell(colNome).value);
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
    });
  });

  return {
    colaboradores: [...colaboradoresMap.values()],
    treinamentos: [...treinamentosSet].map((nome) => ({ nome })),
    registros,
  };
}
