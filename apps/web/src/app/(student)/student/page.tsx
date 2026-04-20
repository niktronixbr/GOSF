import type { Metadata } from "next";

export const metadata: Metadata = { title: "Início" };

function StatCard({ label, value, sub }: { label: string; value: string; sub?: string }) {
  return (
    <div className="rounded-xl border border-border bg-card p-5 shadow-sm">
      <p className="text-sm text-muted-foreground">{label}</p>
      <p className="mt-1 text-3xl font-bold text-foreground">{value}</p>
      {sub && <p className="mt-1 text-xs text-muted-foreground">{sub}</p>}
    </div>
  );
}

export default function StudentHomePage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Olá, Maria!</h1>
        <p className="text-muted-foreground text-sm mt-1">
          Aqui está seu progresso no ciclo atual.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <StatCard label="Nota de evolução" value="78" sub="Ciclo 2024/2" />
        <StatCard label="Atividades entregues" value="12/15" sub="este ciclo" />
        <StatCard label="Tendência" value="+6pts" sub="vs ciclo anterior" />
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <div className="rounded-xl border border-border bg-card p-5 shadow-sm">
          <h2 className="font-semibold text-foreground mb-3">Principais forças</h2>
          <ul className="space-y-2 text-sm text-muted-foreground">
            <li className="flex items-center gap-2">
              <span className="h-2 w-2 rounded-full bg-green-500" />
              Participação em aula
            </li>
            <li className="flex items-center gap-2">
              <span className="h-2 w-2 rounded-full bg-green-500" />
              Consistência nas entregas
            </li>
            <li className="flex items-center gap-2">
              <span className="h-2 w-2 rounded-full bg-green-500" />
              Evolução em matemática
            </li>
          </ul>
        </div>

        <div className="rounded-xl border border-border bg-card p-5 shadow-sm">
          <h2 className="font-semibold text-foreground mb-3">Pontos de atenção</h2>
          <ul className="space-y-2 text-sm text-muted-foreground">
            <li className="flex items-center gap-2">
              <span className="h-2 w-2 rounded-full bg-yellow-500" />
              Revisão de conteúdo de física
            </li>
            <li className="flex items-center gap-2">
              <span className="h-2 w-2 rounded-full bg-yellow-500" />
              Prazo de entrega das atividades
            </li>
          </ul>
        </div>
      </div>

      <div className="rounded-xl border border-border bg-card p-5 shadow-sm">
        <h2 className="font-semibold text-foreground mb-3">Plano desta semana</h2>
        <ul className="space-y-2 text-sm">
          {[
            "Rever capítulos 3 e 4 de física",
            "Entregar atividade de matemática até sexta",
            "Participar da discussão em aula de história",
          ].map((item, i) => (
            <li key={i} className="flex items-center gap-3">
              <input type="checkbox" className="rounded" readOnly />
              <span className="text-muted-foreground">{item}</span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
