// apps/web/src/lib/score-color.ts

export function scoreVariant(score: number): "success" | "warning" | "danger" {
  if (score >= 70) return "success";
  if (score >= 50) return "warning";
  return "danger";
}

export function scoreBgClass(score: number): string {
  if (score >= 70) return "bg-success/10 text-success";
  if (score >= 50) return "bg-warning/10 text-warning";
  return "bg-error/10 text-error";
}
