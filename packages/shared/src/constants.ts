export const SCORE_THRESHOLDS = {
  LOW: 50,
  MEDIUM: 70,
} as const;

export const SCORE_LABELS = {
  LOW: "Atenção alta",
  MEDIUM: "Atenção moderada",
  HIGH: "Evolução positiva",
} as const;

export const STUDENT_DIMENSIONS = [
  "participacao",
  "consistencia",
  "desempenho",
  "evolucao",
  "entrega",
] as const;

export const TEACHER_DIMENSIONS = [
  "didatica",
  "clareza",
  "organizacao",
  "engajamento",
  "justica_avaliativa",
] as const;
