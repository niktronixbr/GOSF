"use client";

import dynamic from "next/dynamic";
import { FileText } from "lucide-react";
import { ReportEntry } from "@/lib/api/coordinator";

const PdfDownloadButtonInner = dynamic(() => import("./PdfDownloadButtonInner"), {
  ssr: false,
  loading: () => (
    <button
      disabled
      className="flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground disabled:opacity-40 transition-opacity shrink-0"
    >
      <FileText size={15} />
      Exportar PDF
    </button>
  ),
});

interface Props {
  rows: ReportEntry[];
  allDimensions: string[];
  cycleTitle: string;
  studentCount: number;
  teacherCount: number;
  atRiskCount: number;
  disabled: boolean;
}

export function ExportPdfButton(props: Props) {
  return <PdfDownloadButtonInner {...props} />;
}
