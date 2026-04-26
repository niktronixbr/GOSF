export const STUDENT_PLAN_FIXTURE = {
  summary: "Aluno com bom desempenho geral; foco em pontualidade.",
  strengths: ["participacao em aula", "engajamento com colegas"],
  attention_points: ["organizacao do material"],
  seven_day_plan: ["Revisar apostila do capitulo 3 por 30 minutos diarios"],
  thirty_day_plan: ["Concluir exercicios praticos do modulo atual"],
  motivation_message: "Voce esta no caminho certo, continue assim!",
  confidence_notes: ["Plano gerado com base em 0 avaliacoes (mock)"],
};

export const TEACHER_PLAN_FIXTURE = {
  summary: "Professor com avaliacoes positivas; oportunidade em metodologia ativa.",
  strengths: ["clareza nas explicacoes"],
  development_points: ["uso de tecnologia em sala"],
  recommended_actions: ["Aplicar uma atividade colaborativa por semana"],
  classroom_experiments: ["Sala invertida em uma das proximas aulas"],
  next_cycle_focus: ["Engajamento dos alunos com baixo desempenho"],
};

export class MockAiProvider {
  public calls: Array<{ system: string; user: string }> = [];

  async generate(system: string, user: string): Promise<string> {
    this.calls.push({ system, user });
    return JSON.stringify(STUDENT_PLAN_FIXTURE);
  }

  async generateJson<T>(system: string, user: string): Promise<T> {
    this.calls.push({ system, user });
    if (system.includes("desenvolvimento docente")) {
      return TEACHER_PLAN_FIXTURE as unknown as T;
    }
    return STUDENT_PLAN_FIXTURE as unknown as T;
  }
}
