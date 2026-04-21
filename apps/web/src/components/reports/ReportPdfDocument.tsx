import { Document, Page, View, Text, StyleSheet } from "@react-pdf/renderer";
import { ReportEntry } from "@/lib/api/coordinator";

const styles = StyleSheet.create({
  page: {
    fontFamily: "Helvetica",
    fontSize: 9,
    padding: 32,
    backgroundColor: "#ffffff",
    color: "#1a1a2e",
  },
  header: {
    marginBottom: 20,
    borderBottomWidth: 2,
    borderBottomColor: "#4f46e5",
    paddingBottom: 10,
  },
  title: {
    fontSize: 18,
    fontFamily: "Helvetica-Bold",
    color: "#4f46e5",
  },
  subtitle: {
    fontSize: 10,
    color: "#6b7280",
    marginTop: 3,
  },
  statsRow: {
    flexDirection: "row",
    gap: 10,
    marginBottom: 18,
  },
  statCard: {
    flex: 1,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: "#e5e7eb",
    padding: 10,
  },
  statCardRisk: {
    flex: 1,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: "#fca5a5",
    padding: 10,
    backgroundColor: "#fff5f5",
  },
  statLabel: {
    fontSize: 8,
    color: "#6b7280",
    marginBottom: 3,
  },
  statLabelRisk: {
    fontSize: 8,
    color: "#ef4444",
    marginBottom: 3,
  },
  statValue: {
    fontSize: 20,
    fontFamily: "Helvetica-Bold",
    color: "#111827",
  },
  statValueRisk: {
    fontSize: 20,
    fontFamily: "Helvetica-Bold",
    color: "#dc2626",
  },
  table: {
    borderRadius: 6,
    borderWidth: 1,
    borderColor: "#e5e7eb",
    overflow: "hidden",
  },
  tableHeader: {
    flexDirection: "row",
    backgroundColor: "#f3f4f6",
    borderBottomWidth: 1,
    borderBottomColor: "#e5e7eb",
  },
  tableRow: {
    flexDirection: "row",
    borderBottomWidth: 1,
    borderBottomColor: "#f3f4f6",
  },
  tableRowRisk: {
    flexDirection: "row",
    borderBottomWidth: 1,
    borderBottomColor: "#fecaca",
    backgroundColor: "#fff5f5",
  },
  tableRowLast: {
    flexDirection: "row",
  },
  thName: {
    width: "22%",
    padding: "6 8",
    fontFamily: "Helvetica-Bold",
    color: "#6b7280",
  },
  thType: {
    width: "10%",
    padding: "6 8",
    fontFamily: "Helvetica-Bold",
    color: "#6b7280",
  },
  thScore: {
    width: "10%",
    padding: "6 8",
    fontFamily: "Helvetica-Bold",
    color: "#6b7280",
    textAlign: "right",
  },
  thDim: {
    padding: "6 8",
    fontFamily: "Helvetica-Bold",
    color: "#6b7280",
    textAlign: "right",
  },
  thRisk: {
    width: "8%",
    padding: "6 8",
    fontFamily: "Helvetica-Bold",
    color: "#6b7280",
    textAlign: "center",
  },
  tdName: {
    width: "22%",
    padding: "5 8",
    fontFamily: "Helvetica-Bold",
    color: "#111827",
  },
  tdType: {
    width: "10%",
    padding: "5 8",
    color: "#374151",
  },
  tdScore: {
    width: "10%",
    padding: "5 8",
    textAlign: "right",
  },
  tdDim: {
    padding: "5 8",
    textAlign: "right",
    color: "#374151",
  },
  tdRisk: {
    width: "8%",
    padding: "5 8",
    textAlign: "center",
    color: "#374151",
  },
  scoreGreen: { color: "#16a34a", fontFamily: "Helvetica-Bold" },
  scoreYellow: { color: "#ca8a04", fontFamily: "Helvetica-Bold" },
  scoreRed: { color: "#dc2626", fontFamily: "Helvetica-Bold" },
  footer: {
    position: "absolute",
    bottom: 20,
    left: 32,
    right: 32,
    flexDirection: "row",
    justifyContent: "space-between",
    color: "#9ca3af",
    fontSize: 8,
    borderTopWidth: 1,
    borderTopColor: "#e5e7eb",
    paddingTop: 6,
  },
});

function scoreStyle(score: number | null) {
  if (score === null) return {};
  if (score >= 70) return styles.scoreGreen;
  if (score >= 50) return styles.scoreYellow;
  return styles.scoreRed;
}

function dimWidth(count: number) {
  const remaining = 100 - 22 - 10 - 10 - 8;
  return `${remaining / Math.max(count, 1)}%`;
}

interface Props {
  cycleTitle: string;
  rows: ReportEntry[];
  allDimensions: string[];
  studentCount: number;
  teacherCount: number;
  atRiskCount: number;
  generatedAt: string;
}

export function ReportPdfDocument({
  cycleTitle,
  rows,
  allDimensions,
  studentCount,
  teacherCount,
  atRiskCount,
  generatedAt,
}: Props) {
  return (
    <Document>
      <Page size="A4" orientation="landscape" style={styles.page}>
        <View style={styles.header}>
          <Text style={styles.title}>GOSF — Relatório de Avaliações</Text>
          <Text style={styles.subtitle}>
            Ciclo: {cycleTitle} · Gerado em {generatedAt}
          </Text>
        </View>

        <View style={styles.statsRow}>
          <View style={styles.statCard}>
            <Text style={styles.statLabel}>Alunos</Text>
            <Text style={styles.statValue}>{studentCount}</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statLabel}>Professores</Text>
            <Text style={styles.statValue}>{teacherCount}</Text>
          </View>
          <View style={styles.statCardRisk}>
            <Text style={styles.statLabelRisk}>Em risco</Text>
            <Text style={styles.statValueRisk}>{atRiskCount}</Text>
          </View>
          <View style={{ flex: 2 }} />
        </View>

        <View style={styles.table}>
          <View style={styles.tableHeader}>
            <Text style={styles.thName}>Nome</Text>
            <Text style={styles.thType}>Tipo</Text>
            <Text style={styles.thScore}>Score Médio</Text>
            {allDimensions.map((d) => (
              <Text key={d} style={[styles.thDim, { width: dimWidth(allDimensions.length) }]}>
                {d.charAt(0).toUpperCase() + d.slice(1)}
              </Text>
            ))}
            <Text style={styles.thRisk}>Risco</Text>
          </View>

          {rows.map((row, idx) => {
            const dimMap = Object.fromEntries(row.scores.map((s) => [s.dimension, s.score]));
            const isLast = idx === rows.length - 1;
            const rowStyle = row.atRisk
              ? styles.tableRowRisk
              : isLast
              ? styles.tableRowLast
              : styles.tableRow;

            return (
              <View key={`${row.type}-${row.id}`} style={rowStyle}>
                <Text style={styles.tdName}>{row.fullName}</Text>
                <Text style={styles.tdType}>
                  {row.type === "STUDENT" ? "Aluno" : "Professor"}
                </Text>
                <Text style={[styles.tdScore, scoreStyle(row.avgScore)]}>
                  {row.avgScore !== null ? row.avgScore.toFixed(1) : "—"}
                </Text>
                {allDimensions.map((d) => {
                  const s = dimMap[d] ?? null;
                  return (
                    <Text
                      key={d}
                      style={[styles.tdDim, { width: dimWidth(allDimensions.length) }, scoreStyle(s)]}
                    >
                      {s !== null ? s.toFixed(1) : "—"}
                    </Text>
                  );
                })}
                <Text style={styles.tdRisk}>{row.atRisk ? "⚠" : "—"}</Text>
              </View>
            );
          })}
        </View>

        <View style={styles.footer} fixed>
          <Text>GOSF · Plataforma SaaS de Avaliação Escolar</Text>
          <Text render={({ pageNumber, totalPages }) => `Página ${pageNumber} / ${totalPages}`} />
        </View>
      </Page>
    </Document>
  );
}
