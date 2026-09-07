import ExcelJS from "exceljs";

export interface ColaboradorLinha {
  matricula: string;
  nome: string;
  estrutura_codigo: string;
  turno: string;
}

export interface TreinamentoLinha {
  id_treina: string;
  nome: string;
}

export interface PendenciaLinha {
  matricula: string;
  id_treina: string;
  turno: string;
  qualis: boolean;
}

export interface PlanilhaParseada {
  colaboradores: ColaboradorLinha[];
  treinamentos: TreinamentoLinha[];
  pendencias: PendenciaLinha[];
}

const TURNO_MAP: Record<string, string> = {
  DIURNO: "diurno",
  VESPERTINO: "vespertino",
  NOTURNO: "noturno",
  FIXO: "fixo",
};

const CABECALHO_ESPERADO = [
  "Matrícula",
  "Colaborador",
  "Estrutura",
  "Turno",
  "Id. Treina",
  "Treinamento",
];

function resolverValor(raw: unknown): string | number | boolean | null {
  if (raw !== null && typeof raw === "object") {
    const obj = raw as Record<string, unknown>;
    if ("richText" in obj && Array.isArray(obj.richText)) {
      return (obj.richText as { text: string }[]).map((t) => t.text).join("");
    }
    if ("result" in obj) {
      return resolverValor(obj.result);
    }
    return null;
  }
  if (raw === undefined) return null;
  return raw as string | number | boolean;
}

function textoCelula(raw: unknown): string {
  const v = resolverValor(raw);
  return v === null || v === undefined ? "" : String(v).trim();
}

export async function parsePlanilhaPendencias(
  buffer: Buffer,
): Promise<PlanilhaParseada> {
  const workbook = new ExcelJS.Workbook();
  await workbook.xlsx.load(
    buffer as unknown as Parameters<typeof workbook.xlsx.load>[0],
  );

  const sheet =
    workbook.getWorksheet("Pend") ??
    workbook.worksheets.find((w) => w.name.trim().toLowerCase() === "pend");

  if (!sheet) {
    throw new Error(
      'Planilha "Pend" não encontrada no arquivo enviado. Verifique se é o export correto.',
    );
  }

  const header = sheet.getRow(1);
  for (let i = 0; i < CABECALHO_ESPERADO.length; i++) {
    const valor = textoCelula(header.getCell(i + 1).value);
    if (valor.toLowerCase() !== CABECALHO_ESPERADO[i].toLowerCase()) {
      throw new Error(
        `Formato inesperado: a coluna ${i + 1} deveria ser "${CABECALHO_ESPERADO[i]}", mas veio "${valor}". O layout da planilha pode ter mudado.`,
      );
    }
  }

  const colaboradoresMap = new Map<string, ColaboradorLinha>();
  const treinamentosMap = new Map<string, TreinamentoLinha>();
  const pendencias: PendenciaLinha[] = [];

  sheet.eachRow((row, rowNumber) => {
    if (rowNumber === 1) return;

    const matricula = textoCelula(row.getCell(1).value);
    if (!matricula) return;

    const nome = textoCelula(row.getCell(2).value);
    const estruturaTexto = textoCelula(row.getCell(3).value);
    const turnoTexto = textoCelula(row.getCell(4).value).toUpperCase();
    const idTreina = textoCelula(row.getCell(5).value);
    const treinamentoNome = textoCelula(row.getCell(6).value);
    const qualisValor = resolverValor(row.getCell(7).value);

    const separador = estruturaTexto.indexOf(" -");
    const estruturaCodigo =
      separador >= 0
        ? estruturaTexto.slice(0, separador).trim()
        : estruturaTexto;

    const turno = TURNO_MAP[turnoTexto];
    if (!turno || !idTreina) return;

    // Coluna "Gestor" (fórmula): 1 => Qualis Não; "Gestor" ou em branco => Qualis Sim.
    const qualis = !(qualisValor === 1 || qualisValor === "1");

    colaboradoresMap.set(matricula, {
      matricula,
      nome,
      estrutura_codigo: estruturaCodigo,
      turno,
    });

    treinamentosMap.set(idTreina, { id_treina: idTreina, nome: treinamentoNome });
    pendencias.push({ matricula, id_treina: idTreina, turno, qualis });
  });

  return {
    colaboradores: [...colaboradoresMap.values()],
    treinamentos: [...treinamentosMap.values()],
    pendencias,
  };
}
