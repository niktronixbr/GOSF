import Link from "next/link";
import {
  BarChart2,
  Brain,
  GraduationCap,
  Users,
  BookOpen,
  TrendingUp,
  CheckCircle2,
  ArrowRight,
  School,
} from "lucide-react";

export const metadata = {
  title: "GOSF — Plataforma de Inteligência Educacional",
  description:
    "Avaliações colaborativas, análise por IA e planos de desenvolvimento personalizados para escolas.",
};

// ─── Nav ─────────────────────────────────────────────────────────────────────

function Nav() {
  return (
    <header className="sticky top-0 z-50 border-b border-white/10 bg-indigo-950/80 backdrop-blur">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
        <Link href="/" className="flex items-center gap-2">
          <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-500 text-white font-bold text-sm">G</span>
          <span className="text-white font-bold text-lg tracking-tight">GOSF</span>
        </Link>

        <nav className="hidden md:flex items-center gap-7 text-sm text-indigo-200">
          <a href="#features" className="hover:text-white transition-colors">Funcionalidades</a>
          <a href="#how" className="hover:text-white transition-colors">Como funciona</a>
          <a href="#audience" className="hover:text-white transition-colors">Para quem</a>
          <Link href="/pricing" className="hover:text-white transition-colors">Preços</Link>
        </nav>

        <div className="flex items-center gap-3">
          <Link
            href="/login"
            className="text-sm text-indigo-200 hover:text-white transition-colors px-3 py-1.5"
          >
            Entrar
          </Link>
          <Link
            href="/register"
            className="rounded-lg bg-indigo-500 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-400 transition-colors"
          >
            Criar escola grátis
          </Link>
        </div>
      </div>
    </header>
  );
}

// ─── Hero ────────────────────────────────────────────────────────────────────

function Hero() {
  return (
    <section className="relative overflow-hidden bg-gradient-to-b from-indigo-950 via-indigo-900 to-slate-900 px-6 pt-20 pb-28 text-center">
      {/* Background glow */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 flex items-center justify-center"
      >
        <div className="h-[500px] w-[800px] rounded-full bg-indigo-600/20 blur-3xl" />
      </div>

      <div className="relative mx-auto max-w-3xl">
        <span className="mb-6 inline-flex items-center gap-2 rounded-full border border-indigo-500/40 bg-indigo-500/10 px-4 py-1.5 text-xs font-medium text-indigo-300">
          <span className="h-1.5 w-1.5 rounded-full bg-indigo-400" />
          Plataforma SaaS para escolas
        </span>

        <h1 className="mt-4 text-4xl font-extrabold leading-tight tracking-tight text-white sm:text-5xl lg:text-6xl">
          Inteligência que transforma{" "}
          <span className="bg-gradient-to-r from-indigo-300 to-sky-300 bg-clip-text text-transparent">
            educação em resultados
          </span>
        </h1>

        <p className="mt-6 text-lg text-indigo-200 leading-relaxed max-w-2xl mx-auto">
          Avalie professores e alunos, identifique quem precisa de atenção e gere planos de
          desenvolvimento com IA — tudo em uma plataforma feita para coordenadores escolares.
        </p>

        <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4">
          <Link
            href="/register"
            className="flex items-center gap-2 rounded-xl bg-indigo-500 px-8 py-3.5 text-base font-semibold text-white shadow-lg shadow-indigo-900/40 hover:bg-indigo-400 transition-colors"
          >
            Criar minha escola grátis
            <ArrowRight size={16} />
          </Link>
          <Link
            href="/login"
            className="rounded-xl border border-white/20 px-8 py-3.5 text-base font-semibold text-indigo-100 hover:border-white/40 hover:text-white transition-colors"
          >
            Já tenho conta
          </Link>
        </div>

        <p className="mt-4 text-xs text-indigo-400">Sem cartão de crédito. Cancele quando quiser.</p>
      </div>

      {/* Stats */}
      <div className="relative mx-auto mt-16 grid max-w-2xl grid-cols-3 gap-4">
        {[
          { value: "100%", label: "Gratuito para começar" },
          { value: "IA", label: "Planos gerados com Claude" },
          { value: "LGPD", label: "Dados protegidos" },
        ].map((s) => (
          <div key={s.label} className="rounded-xl border border-white/10 bg-white/5 px-4 py-4">
            <p className="text-2xl font-bold text-white">{s.value}</p>
            <p className="mt-1 text-xs text-indigo-300">{s.label}</p>
          </div>
        ))}
      </div>
    </section>
  );
}

// ─── Features ────────────────────────────────────────────────────────────────

const features = [
  {
    icon: BarChart2,
    title: "Avaliações colaborativas",
    desc: "Crie ciclos de avaliação onde alunos avaliam professores e professores avaliam alunos. Formulários flexíveis com escala, sim/não e texto livre.",
  },
  {
    icon: Brain,
    title: "Análise por inteligência artificial",
    desc: "O GOSF usa o Claude (Anthropic) para gerar planos de desenvolvimento personalizados para cada professor e aluno com base nos resultados.",
  },
  {
    icon: TrendingUp,
    title: "Dashboard de insights",
    desc: "Visualize scores por dimensão, identifique quem está em risco e acompanhe a evolução da sua instituição ciclo a ciclo.",
  },
  {
    icon: Users,
    title: "Gestão de turmas e vínculos",
    desc: "Crie turmas, adicione alunos, vincule professores às disciplinas. Estrutura completa para o ano letivo em poucos minutos.",
  },
  {
    icon: BookOpen,
    title: "Metas de alunos",
    desc: "Alunos definem e acompanham suas metas pessoais. Professores e coordenadores acompanham o progresso com visibilidade total.",
  },
  {
    icon: GraduationCap,
    title: "Multi-papel, multi-escola",
    desc: "Cada instituição é isolada. Admin, coordenador, professor e aluno têm interfaces e permissões próprias, sem mistura de dados.",
  },
];

function Features() {
  return (
    <section id="features" className="bg-white px-6 py-24">
      <div className="mx-auto max-w-6xl">
        <div className="text-center mb-14">
          <p className="text-xs font-semibold uppercase tracking-widest text-indigo-600 mb-3">
            Funcionalidades
          </p>
          <h2 className="text-3xl font-bold text-gray-900 sm:text-4xl">
            Tudo que sua escola precisa
          </h2>
          <p className="mt-4 text-gray-500 max-w-xl mx-auto">
            Uma plataforma integrada que cobre o ciclo completo: avaliação → análise → plano de ação.
          </p>
        </div>

        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {features.map((f) => (
            <div
              key={f.title}
              className="rounded-2xl border border-gray-100 bg-gray-50/50 p-6 hover:border-indigo-200 hover:bg-indigo-50/30 transition-colors"
            >
              <div className="mb-4 inline-flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-100 text-indigo-600">
                <f.icon size={20} />
              </div>
              <h3 className="font-semibold text-gray-900 mb-2">{f.title}</h3>
              <p className="text-sm text-gray-500 leading-relaxed">{f.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

// ─── How it works ────────────────────────────────────────────────────────────

const steps = [
  {
    n: "01",
    title: "Cadastre sua escola",
    desc: "Crie a conta da sua instituição em menos de 2 minutos. O onboarding guia você para configurar disciplinas, turmas, professores e alunos.",
  },
  {
    n: "02",
    title: "Abra um ciclo de avaliação",
    desc: "Configure o período, o formulário e os participantes. Com um clique, todos recebem uma notificação para começar a avaliar.",
  },
  {
    n: "03",
    title: "Colete avaliações",
    desc: "Alunos avaliam professores. Professores avaliam alunos. Respostas anônimas e seguras, com acompanhamento de participação em tempo real.",
  },
  {
    n: "04",
    title: "Receba insights e planos de ação",
    desc: "Feche o ciclo e veja os scores calculados automaticamente. A IA gera planos de desenvolvimento individuais para cada professor e aluno.",
  },
];

function HowItWorks() {
  return (
    <section id="how" className="bg-slate-50 px-6 py-24">
      <div className="mx-auto max-w-4xl">
        <div className="text-center mb-14">
          <p className="text-xs font-semibold uppercase tracking-widest text-indigo-600 mb-3">
            Como funciona
          </p>
          <h2 className="text-3xl font-bold text-gray-900 sm:text-4xl">
            Do cadastro ao insight em 4 passos
          </h2>
        </div>

        <div className="space-y-6">
          {steps.map((s) => (
            <div
              key={s.n}
              className="flex gap-6 rounded-2xl border border-gray-100 bg-white p-6 shadow-sm"
            >
              <span className="shrink-0 text-3xl font-extrabold text-indigo-100 select-none w-10 text-right">
                {s.n}
              </span>
              <div>
                <h3 className="font-semibold text-gray-900 mb-1">{s.title}</h3>
                <p className="text-sm text-gray-500 leading-relaxed">{s.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

// ─── Audience ────────────────────────────────────────────────────────────────

const audience = [
  {
    role: "Coordenadores",
    icon: School,
    color: "indigo",
    items: [
      "Dashboard com KPIs da instituição",
      "Ranking de professores por score",
      "Identificação de alunos em risco",
      "Relatórios por ciclo e turma",
    ],
  },
  {
    role: "Professores",
    icon: Users,
    color: "emerald",
    items: [
      "Acesso ao próprio histórico de avaliações",
      "Plano de desenvolvimento personalizado com IA",
      "Visão das turmas e alunos",
      "Acompanhamento de metas dos alunos",
    ],
  },
  {
    role: "Alunos",
    icon: GraduationCap,
    color: "sky",
    items: [
      "Avalie seus professores de forma anônima",
      "Visualize seu plano de desenvolvimento",
      "Defina e acompanhe metas pessoais",
      "Receba feedback dos professores",
    ],
  },
];

const colorMap: Record<string, { bg: string; text: string; icon: string; check: string }> = {
  indigo: { bg: "bg-indigo-50", text: "text-indigo-900", icon: "bg-indigo-100 text-indigo-600", check: "text-indigo-500" },
  emerald: { bg: "bg-emerald-50", text: "text-emerald-900", icon: "bg-emerald-100 text-emerald-600", check: "text-emerald-500" },
  sky: { bg: "bg-sky-50", text: "text-sky-900", icon: "bg-sky-100 text-sky-600", check: "text-sky-500" },
};

function Audience() {
  return (
    <section id="audience" className="bg-white px-6 py-24">
      <div className="mx-auto max-w-6xl">
        <div className="text-center mb-14">
          <p className="text-xs font-semibold uppercase tracking-widest text-indigo-600 mb-3">
            Para quem é
          </p>
          <h2 className="text-3xl font-bold text-gray-900 sm:text-4xl">
            Uma plataforma, três perspectivas
          </h2>
        </div>

        <div className="grid gap-6 sm:grid-cols-3">
          {audience.map((a) => {
            const c = colorMap[a.color];
            return (
              <div key={a.role} className={`rounded-2xl ${c.bg} p-7`}>
                <div className={`mb-4 inline-flex h-10 w-10 items-center justify-center rounded-xl ${c.icon}`}>
                  <a.icon size={20} />
                </div>
                <h3 className={`font-bold text-lg mb-4 ${c.text}`}>{a.role}</h3>
                <ul className="space-y-2.5">
                  {a.items.map((item) => (
                    <li key={item} className="flex items-start gap-2.5 text-sm text-gray-600">
                      <CheckCircle2 size={15} className={`shrink-0 mt-0.5 ${c.check}`} />
                      {item}
                    </li>
                  ))}
                </ul>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}

// ─── CTA final ───────────────────────────────────────────────────────────────

function CtaFinal() {
  return (
    <section className="bg-gradient-to-r from-indigo-950 to-slate-900 px-6 py-24 text-center">
      <div className="mx-auto max-w-2xl">
        <h2 className="text-3xl font-extrabold text-white sm:text-4xl">
          Comece a transformar sua escola hoje
        </h2>
        <p className="mt-4 text-indigo-300 text-lg">
          Crie sua conta gratuitamente e configure sua escola em menos de 5 minutos.
        </p>
        <Link
          href="/register"
          className="mt-8 inline-flex items-center gap-2 rounded-xl bg-indigo-500 px-10 py-4 text-base font-bold text-white shadow-lg shadow-indigo-900/50 hover:bg-indigo-400 transition-colors"
        >
          Criar minha escola grátis
          <ArrowRight size={16} />
        </Link>
        <p className="mt-4 text-xs text-indigo-500">
          Sem cartão de crédito · Cancele quando quiser
        </p>
      </div>
    </section>
  );
}

// ─── Footer ──────────────────────────────────────────────────────────────────

function Footer() {
  return (
    <footer className="border-t border-gray-100 bg-white px-6 py-10">
      <div className="mx-auto max-w-6xl flex flex-col sm:flex-row items-center justify-between gap-4 text-sm text-gray-400">
        <div className="flex items-center gap-2">
          <span className="flex h-6 w-6 items-center justify-center rounded-md bg-indigo-600 text-white font-bold text-xs">G</span>
          <span className="font-semibold text-gray-700">GOSF</span>
          <span>— Plataforma de Inteligência Educacional</span>
        </div>
        <div className="flex items-center gap-5">
          <Link href="/login" className="hover:text-gray-700 transition-colors">Entrar</Link>
          <Link href="/register" className="hover:text-gray-700 transition-colors">Cadastrar escola</Link>
        </div>
      </div>
    </footer>
  );
}

// ─── Page ────────────────────────────────────────────────────────────────────

export default function LandingPage() {
  return (
    <>
      <Nav />
      <Hero />
      <Features />
      <HowItWorks />
      <Audience />
      <CtaFinal />
      <Footer />
    </>
  );
}
