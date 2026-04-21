"use client";

import { PDFDownloadLink } from "@react-pdf/renderer";
import { FileText } from "lucide-react";
import { ReportPdfDocument } from "./ReportPdfDocument";
import { ReportEntry } from "@/lib/api/coordinator";

interface Props {
  rows: ReportEntry[];
  allDimensions: string[];
  cycleTitle: string;
  studentCount: number;
  teacherCount: number;
  atRiskCount: number;
  disabled: boolean;
}

export default function PdfDownloadButtonInner({
  rows,
  allDimensions,
  cycleTitle,
  studentCount,
  teacherCount,
  atRiskCount,
  disabled,
}: Props) {
  const generatedAt = new Date().toLocaleDateString("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });

  const fileName = `relatorio-${cycleTitle.replace(/\s+/g, "-").toLowerCase()}.pdf`;

  if (disabled) {
    return (
      <button
        disabled
        className="flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground disabled:opacity-40 transition-opacity shrink-0"
      >
        <FileText size={15} />
        Exportar PDF
      </button>
    );
  }

  return (
    <PDFDownloadLink
      document={
        <ReportPdfDocument
          cycleTitle={cycleTitle}
          rows={rows}
          allDimensions={allDimensions}
          studentCount={studentCount}
          teacherCount={teacherCount}
          atRiskCount={atRiskCount}
          generatedAt={generatedAt}
        />
      }
      fileName={fileName}
      className="flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground hover:opacity-90 disabled:opacity-40 transition-opacity shrink-0 no-underline"
    >
      {({ loading }) => (
        <>
          <FileText size={15} />
          {loading ? "Gerando PDF…" : "Exportar PDF"}
        </>
      )}
    </PDFDownloadLink>
  );
}
