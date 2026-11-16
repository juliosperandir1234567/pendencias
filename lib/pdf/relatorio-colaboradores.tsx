import { Document, Page, View, Text, Image, StyleSheet, Svg, Circle, Path } from "@react-pdf/renderer";
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
  /** Sem estrutura escolhida mas com macro: um grupo por estrutura. */
  grupos: GrupoEstrutura[];
  /** Logo da empresa (PNG/JPG) já baixada. */
  logo?: { data: Buffer; format: "png" | "jpg" } | null;
  /** Turno filtrado (chave de TURNO_GRUPOS); sem filtro, mostra todos os turnos. */
  turnoGrupoFiltro?: string;
}

export interface GrupoEstrutura {
  /** Rótulo da estrutura, ou null quando o relatório não é dividido por estrutura. */
  estrutura: string | null;
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
  logoBox: {
    width: 64,
    height: 30,
    borderRadius: 4,
    backgroundColor: "#ffffff",
    padding: 3,
    marginRight: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  logo: {
    maxWidth: 58,
    maxHeight: 24,
    objectFit: "contain",
  },
  estruturaBanda: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: VERDE,
    paddingHorizontal: 10,
    paddingVertical: 7,
    borderRadius: 4,
    marginBottom: 10,
  },
  estruturaTitulo: {
    fontSize: 11,
    fontFamily: "Helvetica-Bold",
    color: "#ffffff",
  },
  estruturaTotal: {
    fontSize: 8,
    fontFamily: "Helvetica-Bold",
    color: "#bcd9c4",
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
  colMatricula: { width: "11%" },
  colColaborador: { width: "33%", paddingRight: 8 },
  colTreina: { width: "10%" },
  colTreinamento: { width: "46%" },
  parabens: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#e6f4ea",
    borderWidth: 1,
    borderColor: "#9fd3ae",
    borderRadius: 4,
    paddingHorizontal: 10,
    paddingVertical: 8,
    marginBottom: 14,
  },
  parabensTurno: {
    fontSize: 10,
    fontFamily: "Helvetica-Bold",
    letterSpacing: 0.8,
    color: "#1c5c34",
  },
  parabensTexto: {
    fontSize: 9,
    color: "#1c5c34",
    marginTop: 2,
  },
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

function Letterhead({
  geradoEm,
  geradoPor,
  logo,
}: {
  geradoEm: string;
  geradoPor: string;
  logo?: RelatorioColaboradoresProps["logo"];
}) {
  return (
    <View style={styles.letterhead} fixed>
      {logo ? (
        <View style={styles.logoBox}>
          {/* eslint-disable-next-line jsx-a11y/alt-text */}
          <Image style={styles.logo} src={{ data: logo.data, format: logo.format }} />
        </View>
      ) : (
        <View style={styles.mark} />
      )}
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
function agruparPorTurno(linhas: LinhaRelatorio[], turnoGrupoFiltro?: string): SecaoTurno[] {
  const grupos = turnoGrupoFiltro
    ? TURNO_GRUPOS.filter((g) => g.key === turnoGrupoFiltro)
    : TURNO_GRUPOS;
  const secoes: SecaoTurno[] = grupos.map((g) => ({
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
  // Turnos vazios ficam: viram o aviso de "parabéns".
  return secoes;
}

function LinhaTabela({ r, i }: { r: LinhaRelatorio; i: number }) {
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
    </View>
  );
}

function ParabensTurno({ titulo }: { titulo: string }) {
  return (
    <View style={styles.parabens} wrap={false}>
      <Svg width={22} height={22} viewBox="0 0 24 24" style={{ marginRight: 10 }}>
        <Circle cx="12" cy="12" r="11" fill="#1e7a46" />
        <Path
          d="M6.5 12.5l3.5 3.5 7.5-8"
          stroke="#ffffff"
          strokeWidth={2.4}
          fill="none"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </Svg>
      <View>
        <Text style={styles.parabensTurno}>{titulo}</Text>
        <Text style={styles.parabensTexto}>
          Parabéns! Nenhuma pendência de treinamento neste turno.
        </Text>
      </View>
    </View>
  );
}

function SecaoTurnoView({ secao }: { secao: SecaoTurno }) {
  if (secao.linhas.length === 0) return <ParabensTurno titulo={secao.titulo} />;
  return (
    <View style={{ marginBottom: 14 }}>
      {/* Faixa + cabeçalho não ficam sozinhos no pé da página. */}
      <View wrap={false} minPresenceAhead={40}>
        <View style={[styles.secaoTurno, { backgroundColor: secao.cor.bg }]}>
          <Text style={[styles.secaoTurnoTitulo, { color: secao.cor.fg }]}>
            {secao.titulo}
          </Text>
          <Text style={[styles.secaoTurnoTotal, { color: secao.cor.fg }]}>
            {formatNumber(secao.linhas.length)} pendência(s)
          </Text>
        </View>
        <CabecalhoColunasSecao />
      </View>
      {secao.linhas.map((r, i) => (
        <LinhaTabela key={`${r.matricula}-${r.id_treina}-${i}`} r={r} i={i} />
      ))}
    </View>
  );
}

function CabecalhoColunasSecao() {
  return (
    <View style={styles.headerRow}>
      <Text style={[styles.headerCell, styles.colMatricula]}>MATRÍCULA</Text>
      <Text style={[styles.headerCell, styles.colColaborador]}>COLABORADOR</Text>
      <Text style={[styles.headerCell, styles.colTreina]}>ID. TREINA</Text>
      <Text style={[styles.headerCell, styles.colTreinamento]}>TREINAMENTO</Text>
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
  grupos,
  logo,
  turnoGrupoFiltro,
}: RelatorioColaboradoresProps) {
  const gruposComDados = grupos.filter((g) => g.linhas.length > 0);
  // Sem linhas: ainda gera uma página com o cabeçalho e o rodapé.
  const paginas: (GrupoEstrutura | null)[] = gruposComDados.length
    ? gruposComDados
    : [null];

  return (
    <Document title="Detalhamento por Colaborador">
      {paginas.map((grupo, gi) => (
        <Page key={gi} size="A4" style={styles.page}>
          <Letterhead geradoEm={geradoEm} geradoPor={geradoPor} logo={logo} />
          <MetaStrip
            macroEstrutura={macroEstrutura}
            estrutura={estrutura}
            treinamento={treinamento}
            qualis={qualis}
            turno={turno}
          />

          <View style={styles.table}>
            {grupo?.estrutura && (
              <View style={styles.estruturaBanda} fixed>
                <Text style={styles.estruturaTitulo}>{grupo.estrutura}</Text>
                <Text style={styles.estruturaTotal}>
                  {formatNumber(grupo.linhas.length)} pendência(s)
                </Text>
              </View>
            )}
            {grupo ? (
              agruparPorTurno(grupo.linhas, turnoGrupoFiltro).map((secao) => (
                <SecaoTurnoView key={secao.key} secao={secao} />
              ))
            ) : (
              <>
                <CabecalhoColunasSecao />
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
