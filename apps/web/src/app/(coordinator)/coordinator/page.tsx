import type { Metadata } from "next";

export const metadata: Metadata = { title: "Visão Geral — Coordenação" };

export default function CoordinatorHomePage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Visão Geral</h1>
        <p className="text-sm text-muted-foreground mt-1">Ciclo 2024/2 — Escola Demo GOSF</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-4">
        {[
          { label: "Turmas ativas", value: "8" },
          { label: "Professores", value: "14" },
          { label: "Alunos", value: "230" },
          { label: "Ciclo atual", value: "Aberto" },
        ].map((s) => (
          <div key={s.label} className="rounded-xl border border-border bg-card p-5 shadow-sm">
            <p className="text-sm text-muted-foreground">{s.label}</p>
            <p className="mt-1 text-3xl font-bold text-foreground">{s.value}</p>
          </div>
        ))}
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <div className="rounded-xl border border-border bg-card p-5 shadow-sm">
          <h2 className="font-semibold mb-3">Turmas em atenção</h2>
          <div className="space-y-3">
            {[
              { turma: "3º A — Matemática", score: 52, status: "Atenção" },
              { turma: "2º B — Física", score: 48, status: "Risco" },
              { turma: "1º C — Português", score: 61, status: "Moderado" },
            ].map(({ turma, score, status }) => (
              <div key={turma} className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">{turma}</span>
                <div className="flex items-center gap-2">
                  <span className="font-medium">{score}</span>
                  <span
                    className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                      status === "Risco"
                        ? "bg-destructive/10 text-destructive"
                        : status === "Atenção"
                        ? "bg-yellow-100 text-yellow-700"
                        : "bg-blue-100 text-blue-700"
                    }`}
                  >
                    {status}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-xl border border-border bg-card p-5 shadow-sm">
          <h2 className="font-semibold mb-3">Professores em destaque</h2>
          <div className="space-y-3">
            {[
              { nome: "Profa. Ana Costa", score: 4.8 },
              { nome: "Prof. Ricardo Melo", score: 4.6 },
              { nome: "Profa. Sônia Barros", score: 4.5 },
            ].map(({ nome, score }) => (
              <div key={nome} className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">{nome}</span>
                <span className="font-medium text-green-600">{score} / 5.0</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
