import type { Metadata } from "next";

export const metadata: Metadata = { title: "Início — Professor" };

export default function TeacherHomePage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Olá, Prof. João!</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Veja como está seu desempenho pedagógico neste ciclo.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        {[
          { label: "Média geral", value: "4.2", sub: "de 5.0" },
          { label: "Avaliações recebidas", value: "28", sub: "este ciclo" },
          { label: "Tendência", value: "+0.3", sub: "vs ciclo anterior" },
        ].map((s) => (
          <div key={s.label} className="rounded-xl border border-border bg-card p-5 shadow-sm">
            <p className="text-sm text-muted-foreground">{s.label}</p>
            <p className="mt-1 text-3xl font-bold text-foreground">{s.value}</p>
            <p className="mt-1 text-xs text-muted-foreground">{s.sub}</p>
          </div>
        ))}
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <div className="rounded-xl border border-border bg-card p-5 shadow-sm">
          <h2 className="font-semibold mb-3">Dimensões avaliadas</h2>
          <div className="space-y-3">
            {[
              { dim: "Didática", score: 4.5 },
              { dim: "Clareza", score: 4.1 },
              { dim: "Organização", score: 3.8 },
              { dim: "Engajamento", score: 4.3 },
              { dim: "Justiça avaliativa", score: 4.0 },
            ].map(({ dim, score }) => (
              <div key={dim}>
                <div className="flex justify-between text-sm mb-1">
                  <span className="text-muted-foreground">{dim}</span>
                  <span className="font-medium">{score}</span>
                </div>
                <div className="h-2 rounded-full bg-muted overflow-hidden">
                  <div
                    className="h-full rounded-full bg-primary"
                    style={{ width: `${(score / 5) * 100}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-xl border border-border bg-card p-5 shadow-sm">
          <h2 className="font-semibold mb-3">Microações sugeridas pela IA</h2>
          <ul className="space-y-2 text-sm text-muted-foreground">
            {[
              "Aplicar atividades práticas curtas ao início de cada aula",
              "Disponibilizar resumos de conteúdo no portal após as aulas",
              "Variar o ritmo com perguntas abertas durante explicações",
            ].map((a, i) => (
              <li key={i} className="flex gap-2">
                <span className="mt-1 h-2 w-2 flex-shrink-0 rounded-full bg-primary" />
                {a}
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}
