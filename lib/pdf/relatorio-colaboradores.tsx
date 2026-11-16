import { Document, Page, View, Text, StyleSheet } from "@react-pdf/renderer";
import { TURNO_GRUPOS, TURNO_LABELS, type Turno } from "@/lib/filters";
import { formatNumber } from "@/lib/format";

export interface LinhaRelatorio {
  matricula: string;
  colaborador: string;
  id_treina: string;
  treinamento: string;
  turno: Turno | null;
}

export interface RelatorioColaboradoresProps {
  macroEstrutura: string;
  estrutura: string;
  treinamento: string;
  qualis: string;
  turno: string;
  geradoEm: string;
  geradoPor: string;
  totalCount: number;
  linhas: LinhaRelatorio[];
}

const VERDE = "#0b4a2c";
const VERDE_CLARO = "#1e7a46";
const MUTED = "#6b7a70";
const MUTED_2 = "#92a099";
const LINHA = "#e4e8e2";
const LINHA_TABELA = "#b9c2bc";
const ZEBRA = "#f6f8f5";

const TURNO_COR: Record<Turno, { bg: string; fg: string }> = {
  diurno: { bg: "#fdf0dd", fg: "#9a5b12" },
  fixo: { bg: "#fdf0dd", fg: "#9a5b12" },
  vespertino: { bg: "#e2e9fd", fg: "#2c47b0" },
  noturno: { bg: "#e1efe4", fg: "#1c5c34" },
};

const styles = StyleSheet.create({
  page: {
    fontSize: 9,
    fontFamily: "Helvetica",
    color: "#1c2620",
    paddingBottom: 46,
  },
  letterhead: {
    backgroundColor: VERDE,
    color: "#eef5ef",
    paddingHorizontal: 28,
    paddingVertical: 16,
    flexDirection: "row",
    alignItems: "center",
  },
  mark: {
    width: 26,
    height: 26,
    borderRadius: 5,
    backgroundColor: "rgba(255,255,255,0.14)",
    marginRight: 10,
  },
  eyebrow: {
    fontSize: 7,
    letterSpacing: 1.2,
    color: "#bcd9c4",
    marginBottom: 2,
  },
  title: {
    fontSize: 14,
    fontFamily: "Helvetica-Bold",
  },
  metaStrip: {
    flexDirection: "row",
    paddingHorizontal: 28,
    paddingVertical: 10,
    backgroundColor: ZEBRA,
    borderBottomWidth: 1,
    borderBottomColor: LINHA,
  },
  metaItem: {
    flex: 1,
    paddingRight: 10,
  },
  metaK: {
    fontSize: 6.5,
    letterSpacing: 0.8,
    color: MUTED_2,
    marginBottom: 2,
  },
  metaV: {
    fontSize: 9,
    fontFamily: "Helvetica-Bold",
  },
  table: {
    marginHorizontal: 28,
    marginTop: 14,
  },
  headerRow: {
    flexDirection: "row",
    borderBottomWidth: 1.4,
    borderBottomColor: VERDE,
    paddingBottom: 5,
    marginBottom: 2,
  },
  headerCell: {
    fontSize: 7,
    fontFamily: "Helvetica-Bold",
    letterSpacing: 0.6,
    color: VERDE,
  },
  row: {
    flexDirection: "row",
    paddingVertical: 5,
    borderBottomWidth: 0.8,
    borderBottomColor: LINHA_TABELA,
  },
  secaoTurno: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 8,
    paddingVertical: 6,
    borderRadius: 4,
    marginBottom: 8,
  },
  secaoTurnoTitulo: {
    fontSize: 10,
    fontFamily: "Helvetica-Bold",
    letterSpacing: 0.8,
  },
  secaoTurnoTotal: {
    fontSize: 8,
    fontFamily: "Helvetica-Bold",
  },
  rowZebra: {
    backgroundColor: ZEBRA,
  },
  cell: { fontSize: 8.5 },
  cellMatricula: { color: MUTED, fontFamily: "Helvetica-Bold" },
  cellColaborador: { fontFamily: "Helvetica-Bold" },
  cellTreina: { color: MUTED },
  colMatricula: { width: "10%" },
  colColaborador: { width: "28%" },
  colTreina: { width: "10%" },
  colTreinamento: { width: "37%", paddingRight: 6 },
  colTurno: { width: "15%" },
  pill: {
    fontSize: 7,
    fontFamily: "Helvetica-Bold",
    paddingHorizontal: 5,
    paddingVertical: 2,
    borderRadius: 8,
    alignSelf: "flex-start",
  },
  footer: {
    position: "absolute",
    bottom: 18,
    left: 28,
    right: 28,
    flexDirection: "row",
    justifyContent: "space-between",
    fontSize: 7.5,
    color: MUTED,
    borderTopWidth: 1,
    borderTopColor: LINHA,
    paddingTop: 8,
  },
});

function Letterhead({ geradoEm, geradoPor }: { geradoEm: string; geradoPor: string }) {
  return (
    <View style={styles.letterhead} fixed>
      <View style={styles.mark} />
      <View style={{ flex: 1 }}>
        <Text style={styles.eyebrow}>DASHBOARD DE PENDÊNCIAS · USINA</Text>
        <Text style={styles.title}>Detalhamento por Colaborador</Text>
      </View>
      <View>
        <Text style={{ fontSize: 7, color: "#bcd9c4", textAlign: "right" }}>
          Gerado em {geradoEm}
        </Text>
        <Text style={{ fontSize: 7, color: "#bcd9c4", textAlign: "right" }}>
          por {geradoPor}
        </Text>
      </View>
    </View>
  );
}

function MetaStrip({
  macroEstrutura,
  estrutura,
  treinamento,
  qualis,
  turno,
}: Pick<
  RelatorioColaboradoresProps,
  "macroEstrutura" | "estrutura" | "treinamento" | "qualis" | "turno"
>) {
  return (
    <View style={styles.metaStrip} fixed>
      <View style={styles.metaItem}>
        <Text style={styles.metaK}>MACRO ESTRUTURA</Text>
        <Text style={styles.metaV}>{macroEstrutura}</Text>
      </View>
      <View style={styles.metaItem}>
        <Text style={styles.metaK}>ESTRUTURA</Text>
        <Text style={styles.metaV}>{estrutura}</Text>
      </View>
      <View style={styles.metaItem}>
        <Text style={styles.metaK}>TREINAMENTO</Text>
        <Text style={styles.metaV}>{treinamento}</Text>
      </View>
      <View style={styles.metaItem}>
        <Text style={styles.metaK}>QUALIS</Text>
        <Text style={[styles.metaV, { color: VERDE_CLARO }]}>{qualis}</Text>
      </View>
      <View style={[styles.metaItem, { paddingRight: 0 }]}>
        <Text style={styles.metaK}>TURNO</Text>
        <Text style={styles.metaV}>{turno}</Text>
      </View>
    </View>
  );
}

interface SecaoTurno {
  key: string;
  titulo: string;
  cor: { bg: string; fg: string };
  linhas: LinhaRelatorio[];
}

/** Agrupa as linhas em Diurno/Fixo → Vespertino → Noturno (→ Sem turno). */
function agruparPorTurno(linhas: LinhaRelatorio[]): SecaoTurno[] {
  const secoes: SecaoTurno[] = TURNO_GRUPOS.map((g) => ({
    key: g.key,
    titulo: `TURNO ${g.turnos.map((t) => TURNO_LABELS[t]).join(" / ").toUpperCase()}`,
    cor: TURNO_COR[g.turnos[0]],
    linhas: linhas.filter((l) => l.turno !== null && g.turnos.includes(l.turno)),
  }));
  const semTurno = linhas.filter(
    (l) => l.turno === null || !TURNO_GRUPOS.some((g) => g.turnos.includes(l.turno!)),
  );
  if (semTurno.length) {
    secoes.push({
      key: "sem_turno",
      titulo: "SEM TURNO",
      cor: { bg: ZEBRA, fg: MUTED },
      linhas: semTurno,
    });
  }
  return secoes.filter((sec) => sec.linhas.length > 0);
}

function CabecalhoColunas() {
  return (
    <View style={styles.headerRow} fixed>
      <Text style={[styles.headerCell, styles.colMatricula]}>MATRÍCULA</Text>
      <Text style={[styles.headerCell, styles.colColaborador]}>COLABORADOR</Text>
      <Text style={[styles.headerCell, styles.colTreina]}>ID. TREINA</Text>
      <Text style={[styles.headerCell, styles.colTreinamento]}>TREINAMENTO</Text>
      <Text style={[styles.headerCell, styles.colTurno]}>TURNO</Text>
    </View>
  );
}

function LinhaTabela({ r, i }: { r: LinhaRelatorio; i: number }) {
  const cor = r.turno ? TURNO_COR[r.turno] : null;
  return (
    <View
      style={[styles.row, i % 2 === 1 ? styles.rowZebra : undefined]}
      wrap={false}
    >
      <Text style={[styles.cell, styles.cellMatricula, styles.colMatricula]}>
        {r.matricula}
      </Text>
      <Text style={[styles.cell, styles.cellColaborador, styles.colColaborador]}>
        {r.colaborador}
      </Text>
      <Text style={[styles.cell, styles.cellTreina, styles.colTreina]}>
        {r.id_treina}
      </Text>
      <Text style={[styles.cell, styles.colTreinamento]}>{r.treinamento}</Text>
      <View style={styles.colTurno}>
        {r.turno && cor && (
          <Text style={[styles.pill, { backgroundColor: cor.bg, color: cor.fg }]}>
            {TURNO_LABELS[r.turno]}
          </Text>
        )}
      </View>
    </View>
  );
}

export function RelatorioColaboradores({
  macroEstrutura,
  estrutura,
  treinamento,
  qualis,
  turno,
  geradoEm,
  geradoPor,
  totalCount,
  linhas,
}: RelatorioColaboradoresProps) {
  const secoes = agruparPorTurno(linhas);
  // Sem linhas: ainda gera uma página com o cabeçalho e o rodapé.
  const paginas: (SecaoTurno | null)[] = secoes.length ? secoes : [null];

  return (
    <Document title="Detalhamento por Colaborador">
      {paginas.map((secao) => (
        <Page key={secao?.key ?? "vazio"} size="A4" style={styles.page}>
          <Letterhead geradoEm={geradoEm} geradoPor={geradoPor} />
          <MetaStrip
            macroEstrutura={macroEstrutura}
            estrutura={estrutura}
            treinamento={treinamento}
            qualis={qualis}
            turno={turno}
          />

          <View style={styles.table}>
            {secao ? (
              <>
                <View
                  style={[styles.secaoTurno, { backgroundColor: secao.cor.bg }]}
                  fixed
                >
                  <Text style={[styles.secaoTurnoTitulo, { color: secao.cor.fg }]}>
                    {secao.titulo}
                  </Text>
                  <Text style={[styles.secaoTurnoTotal, { color: secao.cor.fg }]}>
                    {formatNumber(secao.linhas.length)} pendência(s)
                  </Text>
                </View>
                <CabecalhoColunas />
                {secao.linhas.map((r, i) => (
                  <LinhaTabela key={`${r.matricula}-${r.id_treina}-${i}`} r={r} i={i} />
                ))}
              </>
            ) : (
              <>
                <CabecalhoColunas />
                <Text style={{ marginTop: 12, color: MUTED }}>
                  Nenhuma pendência no filtro aplicado.
                </Text>
              </>
            )}
          </View>

          <View style={styles.footer} fixed>
            <Text>{formatNumber(totalCount)} pendência(s) no filtro aplicado</Text>
            <Text
              render={({ pageNumber, totalPages }) =>
                `Página ${pageNumber} de ${totalPages}`
              }
            />
            <Text>Dashboard de Pendências — Usina</Text>
          </View>
        </Page>
      ))}
    </Document>
  );
}
