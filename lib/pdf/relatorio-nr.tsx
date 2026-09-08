import { Document, Page, View, Text, StyleSheet } from "@react-pdf/renderer";
import { formatNumber, formatDate } from "@/lib/format";
import { NR_STATUS_LABELS, type NrStatus } from "@/lib/nr";

export interface LinhaRelatorioNr {
  matricula: string;
  colaborador: string;
  treinamento: string;
  data_vencimento: string | null;
  status: string;
}

export interface RelatorioNrProps {
  macroEstrutura: string;
  estrutura: string;
  treinamento: string;
  status: string;
  geradoEm: string;
  geradoPor: string;
  totalCount: number;
  linhas: LinhaRelatorioNr[];
}

const VERDE = "#0b4a2c";
const VERDE_CLARO = "#1e7a46";
const MUTED = "#6b7a70";
const MUTED_2 = "#92a099";
const LINHA = "#e4e8e2";
const ZEBRA = "#f6f8f5";

const STATUS_COR: Record<NrStatus, { bg: string; fg: string }> = {
  em_dia: { bg: "#e3f3e8", fg: "#1c7a3e" },
  a_vencer: { bg: "#fdf3dd", fg: "#9a6b12" },
  vencido: { bg: "#fbe6e6", fg: "#b52d2d" },
  aberta_solicitacao: { bg: "#e3ecfd", fg: "#1d4fb0" },
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
  eyebrow: { fontSize: 7, letterSpacing: 1.2, color: "#bcd9c4", marginBottom: 2 },
  title: { fontSize: 14, fontFamily: "Helvetica-Bold" },
  metaStrip: {
    flexDirection: "row",
    paddingHorizontal: 28,
    paddingVertical: 10,
    backgroundColor: ZEBRA,
    borderBottomWidth: 1,
    borderBottomColor: LINHA,
  },
  metaItem: { flex: 1, paddingRight: 10 },
  metaK: { fontSize: 6.5, letterSpacing: 0.8, color: MUTED_2, marginBottom: 2 },
  metaV: { fontSize: 9, fontFamily: "Helvetica-Bold" },
  table: { marginHorizontal: 28, marginTop: 14 },
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
    borderBottomWidth: 1,
    borderBottomColor: LINHA,
  },
  rowZebra: { backgroundColor: ZEBRA },
  cell: { fontSize: 8.5 },
  cellMatricula: { color: MUTED, fontFamily: "Helvetica-Bold" },
  cellColaborador: { fontFamily: "Helvetica-Bold" },
  cellVencimento: { color: MUTED },
  colMatricula: { width: "12%" },
  colColaborador: { width: "30%" },
  colTreinamento: { width: "33%", paddingRight: 6 },
  colVencimento: { width: "12%" },
  colStatus: { width: "13%" },
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
        <Text style={styles.title}>Espelho de NR&apos;s</Text>
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
  status,
}: Pick<RelatorioNrProps, "macroEstrutura" | "estrutura" | "treinamento" | "status">) {
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
      <View style={[styles.metaItem, { paddingRight: 0 }]}>
        <Text style={styles.metaK}>STATUS</Text>
        <Text style={[styles.metaV, { color: VERDE_CLARO }]}>{status}</Text>
      </View>
    </View>
  );
}

export function RelatorioNr({
  macroEstrutura,
  estrutura,
  treinamento,
  status,
  geradoEm,
  geradoPor,
  totalCount,
  linhas,
}: RelatorioNrProps) {
  return (
    <Document title="Espelho de NR's">
      <Page size="A4" style={styles.page}>
        <Letterhead geradoEm={geradoEm} geradoPor={geradoPor} />
        <MetaStrip
          macroEstrutura={macroEstrutura}
          estrutura={estrutura}
          treinamento={treinamento}
          status={status}
        />

        <View style={styles.table}>
          <View style={styles.headerRow} fixed>
            <Text style={[styles.headerCell, styles.colMatricula]}>MATRÍCULA</Text>
            <Text style={[styles.headerCell, styles.colColaborador]}>COLABORADOR</Text>
            <Text style={[styles.headerCell, styles.colTreinamento]}>TREINAMENTO</Text>
            <Text style={[styles.headerCell, styles.colVencimento]}>VENCIMENTO</Text>
            <Text style={[styles.headerCell, styles.colStatus]}>STATUS</Text>
          </View>

          {linhas.map((r, i) => {
            const cor = STATUS_COR[r.status as NrStatus];
            return (
              <View
                key={`${r.matricula}-${r.treinamento}-${i}`}
                style={[styles.row, i % 2 === 1 ? styles.rowZebra : undefined]}
                wrap={false}
              >
                <Text style={[styles.cell, styles.cellMatricula, styles.colMatricula]}>
                  {r.matricula}
                </Text>
                <Text style={[styles.cell, styles.cellColaborador, styles.colColaborador]}>
                  {r.colaborador}
                </Text>
                <Text style={[styles.cell, styles.colTreinamento]}>{r.treinamento}</Text>
                <Text style={[styles.cell, styles.cellVencimento, styles.colVencimento]}>
                  {formatDate(r.data_vencimento)}
                </Text>
                <View style={styles.colStatus}>
                  {cor && (
                    <Text style={[styles.pill, { backgroundColor: cor.bg, color: cor.fg }]}>
                      {NR_STATUS_LABELS[r.status as NrStatus]}
                    </Text>
                  )}
                </View>
              </View>
            );
          })}
        </View>

        <View style={styles.footer} fixed>
          <Text>{formatNumber(totalCount)} registro(s) no filtro aplicado</Text>
          <Text
            render={({ pageNumber, totalPages }) => `Página ${pageNumber} de ${totalPages}`}
          />
          <Text>Dashboard de Pendências — Usina</Text>
        </View>
      </Page>
    </Document>
  );
}
