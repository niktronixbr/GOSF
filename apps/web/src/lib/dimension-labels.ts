const LABELS: Record<string, string> = {
  participacao: "Participação",
  consistencia: "Consistência",
  desempenho: "Desempenho",
  evolucao: "Evolução",
  entrega: "Entrega",
  colaboracao: "Colaboração",
  responsabilidade: "Responsabilidade",
  criatividade: "Criatividade",
  comunicacao: "Comunicação",
  pontualidade: "Pontualidade",
};

export function dimensionLabel(key: string): string {
  return (
    LABELS[key] ??
    key.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase())
  );
}
