# GOSF UI/UX Redesign — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Redesenhar o sistema visual do GOSF com sidebar navy, Plus Jakarta Sans, teal como acento primário e âmbar como acento acadêmico secundário.

**Architecture:** Design system global primeiro — atualizar tokens CSS e Tailwind config de uma vez, depois refatorar Sidebar e TopBar (herdadas por todas as páginas autenticadas), criar componentes UI reutilizáveis, e por fim redesenhar Login e atualizar stat cards dos dashboards.

**Tech Stack:** Next.js 15 App Router, React 19, TypeScript, Tailwind CSS puro (sem shadcn/ui), `next/font/google`, `clsx`, `tailwind-merge`, Lucide icons.

---

## Mapa de arquivos

| Ação | Arquivo |
|---|---|
| Modificar | `apps/web/src/app/layout.tsx` |
| Modificar | `apps/web/src/app/globals.css` |
| Modificar | `apps/web/tailwind.config.ts` |
| Modificar | `apps/web/src/components/dashboard/sidebar.tsx` |
| Modificar | `apps/web/src/components/dashboard/top-bar.tsx` |
| Criar | `apps/web/src/lib/cn.ts` |
| Criar | `apps/web/src/components/ui/button.tsx` |
| Criar | `apps/web/src/components/ui/badge.tsx` |
| Modificar | `apps/web/src/app/(auth)/login/page.tsx` |
| Modificar | `apps/web/src/app/(student)/student/page.tsx` |

---

## Task 1: cn utility + design tokens (font, CSS, Tailwind)

**Files:**
- Create: `apps/web/src/lib/cn.ts`
- Modify: `apps/web/src/app/layout.tsx`
- Modify: `apps/web/src/app/globals.css`
- Modify: `apps/web/tailwind.config.ts`

- [ ] **Step 1: Criar utilitário cn**

```ts
// apps/web/src/lib/cn.ts
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}
```

- [ ] **Step 2: Substituir fonte em layout.tsx**

Substituir todo o conteúdo de `apps/web/src/app/layout.tsx` por:

```tsx
import type { Metadata } from "next";
import { Plus_Jakarta_Sans } from "next/font/google";
import { Providers } from "@/components/providers";
import { Toaster } from "sonner";
import "./globals.css";

const fontSans = Plus_Jakarta_Sans({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800"],
  variable: "--font-sans",
});

export const metadata: Metadata = {
  title: { default: "GOSF", template: "%s | GOSF" },
  description: "Plataforma de inteligência educacional para personalização de aprendizagem",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR" suppressHydrationWarning>
      <body className={`${fontSans.variable} antialiased`}>
        <Providers>
          {children}
          <Toaster richColors position="top-right" />
        </Providers>
      </body>
    </html>
  );
}
```

- [ ] **Step 3: Atualizar globals.css com novos tokens e animações**

Substituir todo o conteúdo de `apps/web/src/app/globals.css` por:

```css
@tailwind base;
@tailwind components;
@tailwind utilities;

@layer base {
  :root {
    /* Neutros — Stone (subtom marrom-quente) */
    --background:         30 5% 98%;
    --foreground:         20 7% 10%;
    --card:               0 0% 100%;
    --card-foreground:    20 7% 10%;
    --popover:            0 0% 100%;
    --popover-foreground: 20 7% 10%;

    /* Primary → teal */
    --primary:            186 30% 38%;
    --primary-foreground: 0 0% 100%;

    /* Secondary → âmbar soft */
    --secondary:            40 55% 94%;
    --secondary-foreground: 30 35% 28%;

    /* Muted → stone quente */
    --muted:            30 6% 95%;
    --muted-foreground: 20 5% 45%;

    /* Accent → teal soft */
    --accent:            186 40% 95%;
    --accent-foreground: 186 30% 32%;

    /* Destrutivo */
    --destructive:            0 72% 51%;
    --destructive-foreground: 0 0% 100%;

    /* Bordas e inputs */
    --border: 30 5% 91%;
    --input:  30 6% 84%;
    --ring:   186 30% 38%;

    --radius: 0.625rem;
  }

  .dark {
    --background:         222 47% 6%;
    --foreground:         210 20% 98%;
    --card:               222 47% 8%;
    --card-foreground:    210 20% 98%;
    --popover:            222 47% 8%;
    --popover-foreground: 210 20% 98%;
    --primary:            186 35% 55%;
    --primary-foreground: 0 0% 100%;
    --secondary:          40 20% 18%;
    --secondary-foreground: 40 30% 75%;
    --muted:              220 20% 14%;
    --muted-foreground:   218 10% 60%;
    --accent:             186 30% 15%;
    --accent-foreground:  186 40% 75%;
    --destructive:        0 60% 40%;
    --destructive-foreground: 0 0% 100%;
    --border: 220 20% 18%;
    --input:  220 20% 18%;
    --ring:   186 35% 55%;
  }
}

@layer base {
  * { @apply border-border; }
  body { @apply bg-background text-foreground; }
}

@layer utilities {
  @keyframes slide-up {
    from { opacity: 0; transform: translateY(12px); }
    to   { opacity: 1; transform: translateY(0); }
  }

  .animate-slide-up {
    animation: slide-up 0.35s cubic-bezier(0.22, 1, 0.36, 1) both;
  }

  .animate-delay-75  { animation-delay: 75ms; }
  .animate-delay-100 { animation-delay: 100ms; }
  .animate-delay-150 { animation-delay: 150ms; }
  .animate-delay-200 { animation-delay: 200ms; }
  .animate-delay-250 { animation-delay: 250ms; }
  .animate-delay-300 { animation-delay: 300ms; }
}
```

- [ ] **Step 4: Atualizar tailwind.config.ts**

Substituir todo o conteúdo de `apps/web/tailwind.config.ts` por:

```ts
import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: ["class"],
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/features/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        card: {
          DEFAULT: "hsl(var(--card))",
          foreground: "hsl(var(--card-foreground))",
        },
        popover: {
          DEFAULT: "hsl(var(--popover))",
          foreground: "hsl(var(--popover-foreground))",
        },
        primary: {
          DEFAULT: "hsl(var(--primary))",
          foreground: "hsl(var(--primary-foreground))",
        },
        secondary: {
          DEFAULT: "hsl(var(--secondary))",
          foreground: "hsl(var(--secondary-foreground))",
        },
        muted: {
          DEFAULT: "hsl(var(--muted))",
          foreground: "hsl(var(--muted-foreground))",
        },
        accent: {
          DEFAULT: "hsl(var(--accent))",
          foreground: "hsl(var(--accent-foreground))",
        },
        destructive: {
          DEFAULT: "hsl(var(--destructive))",
          foreground: "hsl(var(--destructive-foreground))",
        },
        border: "hsl(var(--border))",
        input:  "hsl(var(--input))",
        ring:   "hsl(var(--ring))",

        /* Novos tokens diretos */
        sidebar: "#0f172a",
        teal: {
          DEFAULT: "oklch(0.55 0.08 195)",
          soft:    "oklch(0.95 0.025 195)",
          fg:      "oklch(0.42 0.09 195)",
        },
        amber: {
          DEFAULT: "oklch(0.62 0.13 60)",
          soft:    "oklch(0.95 0.04 60)",
          fg:      "oklch(0.42 0.10 60)",
        },
      },
      fontFamily: {
        sans: ["var(--font-sans)", "system-ui", "sans-serif"],
        mono: ["ui-monospace", "SFMono-Regular", "monospace"],
      },
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
      },
      boxShadow: {
        teal: "0 4px 14px oklch(0.55 0.08 195 / 0.2)",
      },
    },
  },
  plugins: [],
};

export default config;
```

- [ ] **Step 5: Verificar typecheck e lint**

```bash
export PATH="/c/Program Files/nodejs:$PATH"
cd C:/Users/LENOVO/NikProjects/GOSF
pnpm --filter web typecheck
pnpm --filter web lint
```

Esperado: sem erros.

- [ ] **Step 6: Commit**

```bash
git add apps/web/src/lib/cn.ts apps/web/src/app/layout.tsx apps/web/src/app/globals.css apps/web/tailwind.config.ts
git commit -m "feat: tokens OKLCH, Plus Jakarta Sans e utilitários de animação"
```

---

## Task 2: Sidebar redesign (navy + teal + amber)

**Files:**
- Modify: `apps/web/src/components/dashboard/sidebar.tsx`

- [ ] **Step 1: Substituir sidebar.tsx**

Substituir todo o conteúdo de `apps/web/src/components/dashboard/sidebar.tsx` por:

```tsx
"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  Home, BookOpen, BookMarked, BarChart2, MessageSquare,
  Target, Users, Settings, LogOut, ShieldCheck, GitCompare, FileClock,
} from "lucide-react";
import { cn } from "@/lib/cn";
import { useAuthStore } from "@/store/auth.store";

type NavItem = { href: string; label: string; icon: React.ElementType; badge?: number };

const studentNav: NavItem[] = [
  { href: "/student",          label: "Início",        icon: Home },
  { href: "/student/progress", label: "Meu progresso", icon: BarChart2 },
  { href: "/student/plan",     label: "Plano de estudo", icon: BookOpen },
  { href: "/student/evaluations", label: "Avaliações", icon: MessageSquare },
  { href: "/student/feedback", label: "Feedbacks",     icon: MessageSquare },
  { href: "/student/goals",    label: "Metas",         icon: Target },
];

const teacherNav: NavItem[] = [
  { href: "/teacher",              label: "Início",            icon: Home },
  { href: "/teacher/classes",      label: "Minhas turmas",     icon: Users },
  { href: "/teacher/evaluations",  label: "Avaliações",        icon: MessageSquare },
  { href: "/teacher/development",  label: "Meu desenvolvimento", icon: Target },
  { href: "/teacher/insights",     label: "Insights",          icon: BarChart2 },
];

const coordinatorNav: NavItem[] = [
  { href: "/coordinator",              label: "Visão geral",       icon: Home },
  { href: "/coordinator/classes",      label: "Turmas",            icon: BookOpen },
  { href: "/coordinator/subjects",     label: "Disciplinas",       icon: BookMarked },
  { href: "/coordinator/teachers",     label: "Professores",       icon: Users },
  { href: "/coordinator/cycles",       label: "Ciclos",            icon: Target },
  { href: "/coordinator/benchmarking", label: "Benchmarking",      icon: GitCompare },
  { href: "/coordinator/reports",      label: "Relatórios",        icon: BarChart2 },
  { href: "/coordinator/settings",     label: "Configurações",     icon: Settings },
];

const adminNav: NavItem[] = [
  { href: "/admin",         label: "Usuários",   icon: ShieldCheck },
  { href: "/admin/metrics", label: "Métricas",   icon: BarChart2 },
  { href: "/admin/privacy", label: "LGPD",       icon: ShieldCheck },
  { href: "/admin/audit",   label: "Auditoria",  icon: FileClock },
  ...coordinatorNav,
];

const navByRole: Record<string, NavItem[]> = {
  STUDENT:     studentNav,
  TEACHER:     teacherNav,
  COORDINATOR: coordinatorNav,
  ADMIN:       adminNav,
};

const roleLabel: Record<string, string> = {
  STUDENT:     "Aluno",
  TEACHER:     "Professor",
  COORDINATOR: "Coordenação",
  ADMIN:       "Administrador",
};

export function Sidebar() {
  const pathname  = usePathname();
  const router    = useRouter();
  const { user, logout } = useAuthStore();
  const role  = user?.role ?? "STUDENT";
  const items = navByRole[role] ?? studentNav;

  const initials = user?.fullName
    ? user.fullName.split(" ").slice(0, 2).map((n) => n[0]).join("").toUpperCase()
    : "?";

  async function handleLogout() {
    await logout();
    router.push("/login");
  }

  return (
    <aside className="flex h-full w-60 flex-col bg-sidebar shrink-0">
      {/* Logo */}
      <div className="flex h-16 items-center gap-3 px-5 border-b border-white/[0.07]">
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-teal shrink-0">
          <svg width="16" height="16" fill="none" viewBox="0 0 24 24">
            <path
              d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"
              stroke="#fff" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"
            />
          </svg>
        </div>
        <div>
          <p className="text-[15px] font-extrabold text-white leading-none tracking-tight">GOSF</p>
          {user?.institutionName && (
            <p className="text-[10px] text-white/30 font-medium mt-0.5 truncate max-w-[120px]">
              {user.institutionName}
            </p>
          )}
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-0.5">
        <p className="px-2 mb-2 text-[9px] font-bold uppercase tracking-[1.2px] text-white/25">
          Principal
        </p>
        {items.map(({ href, label, icon: Icon, badge }) => {
          const active = pathname === href;
          return (
            <Link
              key={href}
              href={href}
              className={cn(
                "flex items-center gap-2.5 rounded-lg px-2.5 py-2 text-[13px] transition-colors",
                active
                  ? "bg-white/[0.09] text-white font-semibold"
                  : "text-white/55 font-medium hover:bg-white/[0.06] hover:text-white/80"
              )}
            >
              <Icon
                size={16}
                className={active ? "text-teal" : "text-white/40"}
              />
              <span className="flex-1 truncate">{label}</span>
              {badge != null && badge > 0 && (
                <span className="text-[9px] font-bold bg-teal text-white px-1.5 py-0.5 rounded-full">
                  {badge}
                </span>
              )}
            </Link>
          );
        })}
      </nav>

      {/* Footer */}
      <div className="px-3 pb-4 border-t border-white/[0.07] pt-3 space-y-0.5">
        <Link
          href="/settings/privacy"
          className="flex items-center gap-2.5 rounded-lg px-2.5 py-2 text-[13px] font-medium text-white/55 hover:bg-white/[0.06] hover:text-white/80 transition-colors"
        >
          <Settings size={16} className="text-white/40" />
          Privacidade
        </Link>
        <button
          onClick={handleLogout}
          className="flex w-full items-center gap-2.5 rounded-lg px-2.5 py-2 text-[13px] font-medium text-white/55 hover:bg-destructive/20 hover:text-red-400 transition-colors"
        >
          <LogOut size={16} className="text-white/40" />
          Sair
        </button>

        {/* User info */}
        <div className="mt-2 flex items-center gap-2.5 px-2.5 py-2">
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-amber-soft text-[11px] font-bold text-amber-fg">
            {initials}
          </div>
          <div className="min-w-0">
            <p className="text-[12px] font-semibold text-white/80 truncate">{user?.fullName}</p>
            <p className="text-[10px] text-white/35 truncate">{roleLabel[role]}</p>
          </div>
        </div>
      </div>
    </aside>
  );
}
```

> **Nota:** `user?.institutionName` pode não existir no tipo `User` do auth store. Se o TypeScript reclamar, substituir por `null` nessa linha (o nome da instituição pode ser adicionado numa sprint futura).

- [ ] **Step 2: Verificar typecheck**

```bash
export PATH="/c/Program Files/nodejs:$PATH"
pnpm --filter web typecheck
```

Se erro em `user?.institutionName`: localizar o tipo `User` em `apps/web/src/store/auth.store.ts` ou `apps/web/src/lib/auth/` e verificar os campos disponíveis. Se o campo não existir, remover o bloco `{user?.institutionName && ...}` da sidebar.

- [ ] **Step 3: Commit**

```bash
git add apps/web/src/components/dashboard/sidebar.tsx
git commit -m "feat: sidebar navy com teal active state e avatar âmbar"
```

---

## Task 3: TopBar — avatar âmbar + focus teal

**Files:**
- Modify: `apps/web/src/components/dashboard/top-bar.tsx`

- [ ] **Step 1: Atualizar avatar e focus rings em top-bar.tsx**

Localizar e substituir as 3 ocorrências abaixo (são as únicas mudanças visuais necessárias):

**Avatar do usuário** (linha ~`className="flex h-8 w-8 items-center justify-center rounded-full bg-primary..."`):
```tsx
// ANTES
<span className="flex h-8 w-8 items-center justify-center rounded-full bg-primary text-xs font-semibold text-primary-foreground">

// DEPOIS
<span className="flex h-8 w-8 items-center justify-center rounded-full bg-amber-soft text-xs font-semibold text-amber-fg">
```

**Focus ring nos inputs dos modais** — substituir todas as ocorrências de `focus:ring-primary` por `focus:ring-teal/50` dentro do arquivo. São 4 inputs (fullName, avatarUrl, currentPassword, newPassword, confirmPassword):
```tsx
// ANTES (em todos os inputs)
className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"

// DEPOIS
className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal/50"
```

**Botões de submit dos modais** — substituir `bg-primary` pelo token teal:
```tsx
// ANTES
className="flex-1 rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground hover:opacity-90 disabled:opacity-50 transition-opacity"

// DEPOIS
className="flex-1 rounded-lg bg-teal px-4 py-2 text-sm font-semibold text-white shadow-teal hover:brightness-110 disabled:opacity-50 transition-all"
```

- [ ] **Step 2: Verificar typecheck**

```bash
export PATH="/c/Program Files/nodejs:$PATH"
pnpm --filter web typecheck
```

Esperado: sem erros.

- [ ] **Step 3: Commit**

```bash
git add apps/web/src/components/dashboard/top-bar.tsx
git commit -m "feat: topbar com avatar âmbar e focus ring teal"
```

---

## Task 4: Componente Button

**Files:**
- Create: `apps/web/src/components/ui/button.tsx`

- [ ] **Step 1: Criar button.tsx**

```tsx
// apps/web/src/components/ui/button.tsx
import { cn } from "@/lib/cn";
import { Loader2 } from "lucide-react";

type Variant = "primary" | "secondary" | "ghost" | "danger";
type Size    = "sm" | "md" | "lg";

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: Size;
  loading?: boolean;
}

const variantClasses: Record<Variant, string> = {
  primary:   "bg-teal text-white shadow-teal hover:brightness-110 active:brightness-95",
  secondary: "bg-amber-soft text-amber-fg hover:bg-amber/20 active:bg-amber/30",
  ghost:     "bg-transparent text-muted-foreground border border-border hover:bg-muted active:bg-muted/80",
  danger:    "bg-[oklch(0.97_0.02_25)] text-destructive border border-[oklch(0.9_0.04_25)] hover:bg-[oklch(0.93_0.04_25)]",
};

const sizeClasses: Record<Size, string> = {
  sm: "h-7  px-3   text-xs  rounded-md gap-1.5",
  md: "h-9  px-4   text-sm  rounded-[10px] gap-2",
  lg: "h-11 px-6   text-base rounded-xl gap-2",
};

export function Button({
  variant = "primary",
  size = "md",
  loading = false,
  disabled,
  children,
  className,
  ...props
}: ButtonProps) {
  return (
    <button
      disabled={disabled || loading}
      className={cn(
        "inline-flex items-center justify-center font-semibold transition-all",
        "disabled:opacity-50 disabled:pointer-events-none",
        variantClasses[variant],
        sizeClasses[size],
        className,
      )}
      {...props}
    >
      {loading && <Loader2 size={14} className="animate-spin" />}
      {children}
    </button>
  );
}
```

- [ ] **Step 2: Verificar typecheck**

```bash
export PATH="/c/Program Files/nodejs:$PATH"
pnpm --filter web typecheck
```

Esperado: sem erros.

- [ ] **Step 3: Commit**

```bash
git add apps/web/src/components/ui/button.tsx
git commit -m "feat: componente Button com variantes teal/amber/ghost/danger"
```

---

## Task 5: Componente Badge

**Files:**
- Create: `apps/web/src/components/ui/badge.tsx`

- [ ] **Step 1: Criar badge.tsx**

```tsx
// apps/web/src/components/ui/badge.tsx
import { cn } from "@/lib/cn";

type BadgeVariant = "teal" | "amber" | "success" | "warning" | "danger" | "neutral";

interface BadgeProps {
  variant?: BadgeVariant;
  dot?: boolean;
  children: React.ReactNode;
  className?: string;
}

const variantClasses: Record<BadgeVariant, string> = {
  teal:    "bg-teal-soft text-teal-fg",
  amber:   "bg-amber-soft text-amber-fg",
  success: "bg-[oklch(0.95_0.04_150)] text-[oklch(0.38_0.12_150)]",
  warning: "bg-[oklch(0.97_0.04_75)] text-[oklch(0.50_0.14_75)]",
  danger:  "bg-[oklch(0.97_0.03_25)] text-[oklch(0.42_0.18_25)]",
  neutral: "bg-stone-100 text-stone-500",
};

export function Badge({ variant = "neutral", dot = false, children, className }: BadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide",
        variantClasses[variant],
        className,
      )}
    >
      {dot && (
        <span className="h-[5px] w-[5px] rounded-full bg-current" aria-hidden />
      )}
      {children}
    </span>
  );
}
```

- [ ] **Step 2: Verificar typecheck**

```bash
export PATH="/c/Program Files/nodejs:$PATH"
pnpm --filter web typecheck
```

Esperado: sem erros.

- [ ] **Step 3: Commit**

```bash
git add apps/web/src/components/ui/badge.tsx
git commit -m "feat: componente Badge com variantes teal/amber/semânticas"
```

---

## Task 6: Login page — split layout

**Files:**
- Modify: `apps/web/src/app/(auth)/login/page.tsx`

- [ ] **Step 1: Substituir login/page.tsx por split layout**

```tsx
// apps/web/src/app/(auth)/login/page.tsx
import type { Metadata } from "next";
import Link from "next/link";
import { LoginForm } from "@/features/auth/login-form";

export const metadata: Metadata = { title: "Entrar" };

export default function LoginPage() {
  return (
    <div className="min-h-screen grid lg:grid-cols-2">
      {/* Hero — sidebar navy */}
      <div className="relative hidden lg:flex flex-col justify-between bg-sidebar px-10 py-10 overflow-hidden">
        {/* Glows decorativos */}
        <div
          aria-hidden
          className="pointer-events-none absolute -top-24 -right-24 h-72 w-72 rounded-full"
          style={{ background: "radial-gradient(circle, oklch(0.55 0.08 195 / 0.18), transparent 70%)" }}
        />
        <div
          aria-hidden
          className="pointer-events-none absolute -bottom-16 -left-16 h-56 w-56 rounded-full"
          style={{ background: "radial-gradient(circle, oklch(0.62 0.13 60 / 0.12), transparent 70%)" }}
        />

        {/* Logo */}
        <div className="relative flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-[10px] bg-teal">
            <svg width="18" height="18" fill="none" viewBox="0 0 24 24">
              <path
                d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"
                stroke="#fff" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"
              />
            </svg>
          </div>
          <span className="text-[18px] font-extrabold text-white tracking-tight">GOSF</span>
        </div>

        {/* Body */}
        <div className="relative space-y-4">
          <h1 className="text-[28px] font-extrabold text-white leading-tight tracking-tight">
            Inteligência relacional<br />para educação de excelência
          </h1>
          <p className="text-[14px] text-white/50 leading-relaxed max-w-sm">
            Avaliações cruzadas, planos personalizados por IA e dashboards claros
            para alunos, professores e coordenação.
          </p>
        </div>

        {/* Stats */}
        <div className="relative flex gap-8">
          {[
            { value: "1.2k+", label: "Escolas" },
            { value: "98%",   label: "Adesão" },
            { value: "LGPD",  label: "Compliance" },
          ].map(({ value, label }) => (
            <div key={label}>
              <p className="text-[18px] font-extrabold text-white tracking-tight">{value}</p>
              <p className="text-[11px] text-white/35 font-medium">{label}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Formulário */}
      <div className="flex items-center justify-center bg-background px-6 py-12">
        <div className="w-full max-w-sm space-y-8">
          {/* Logo mobile */}
          <div className="flex items-center gap-2 lg:hidden">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-teal">
              <svg width="14" height="14" fill="none" viewBox="0 0 24 24">
                <path
                  d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"
                  stroke="#fff" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"
                />
              </svg>
            </div>
            <span className="text-[16px] font-extrabold tracking-tight">GOSF</span>
          </div>

          <div>
            <h2 className="text-[22px] font-extrabold text-foreground tracking-tight">
              Entrar na plataforma
            </h2>
            <p className="mt-1 text-[13px] text-muted-foreground">
              Use suas credenciais institucionais
            </p>
          </div>

          <LoginForm />

          <p className="text-center text-[12px] text-muted-foreground">
            Sua escola ainda não está cadastrada?{" "}
            <Link href="/register" className="text-primary hover:underline font-semibold">
              Cadastrar nova escola
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Verificar typecheck**

```bash
export PATH="/c/Program Files/nodejs:$PATH"
pnpm --filter web typecheck
```

Esperado: sem erros.

- [ ] **Step 3: Commit**

```bash
git add apps/web/src/app/(auth)/login/page.tsx
git commit -m "feat: login com split layout hero navy + formulário"
```

---

## Task 7: Student dashboard — stat cards animados + score bars com tokens

**Files:**
- Modify: `apps/web/src/app/(student)/student/page.tsx`

- [ ] **Step 1: Substituir student/page.tsx**

Substituir todo o conteúdo por:

```tsx
"use client";

import { useQuery } from "@tanstack/react-query";
import { analyticsApi } from "@/lib/api/analytics";
import { useAuthStore } from "@/store/auth.store";
import { cn } from "@/lib/cn";

function ScoreBar({ label, score }: { label: string; score: number }) {
  const pct = Math.min(score, 100);
  const fillColor =
    score < 50 ? "bg-destructive" : score < 70 ? "bg-[oklch(0.72_0.14_75)]" : "bg-teal";
  return (
    <div>
      <div className="flex justify-between text-sm mb-1.5">
        <span className="text-muted-foreground capitalize font-medium">
          {label.replace(/_/g, " ")}
        </span>
        <span className="font-bold text-foreground tabular-nums">{score.toFixed(0)}</span>
      </div>
      <div className="h-1.5 rounded-full bg-teal-soft overflow-hidden">
        <div
          className={cn("h-full rounded-full transition-all duration-700", fillColor)}
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}

interface StatCardProps {
  label: string;
  value: React.ReactNode;
  delta?: string;
  deltaVariant?: "positive" | "warning";
  delayClass?: string;
}

function StatCard({ label, value, delta, deltaVariant = "positive", delayClass }: StatCardProps) {
  return (
    <div
      className={cn(
        "rounded-xl border border-border bg-card p-5 shadow-sm",
        "animate-slide-up",
        "transition-all duration-250 ease-out hover:-translate-y-0.5 hover:shadow-md",
        delayClass,
      )}
    >
      <p className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground mb-1">
        {label}
      </p>
      <p className="text-[28px] font-extrabold text-foreground leading-none tracking-tight">
        {value}
      </p>
      {delta && (
        <p
          className={cn(
            "mt-1.5 text-[11px] font-semibold",
            deltaVariant === "positive"
              ? "text-[oklch(0.62_0.13_150)]"
              : "text-[oklch(0.72_0.14_75)]",
          )}
        >
          {delta}
        </p>
      )}
    </div>
  );
}

export default function StudentHomePage() {
  const user = useAuthStore((s) => s.user);
  const { data, isLoading } = useQuery({
    queryKey: ["student-dashboard"],
    queryFn: () => analyticsApi.studentDashboard(),
    enabled: !!user,
  });

  const firstName = user?.fullName?.split(" ")[0] ?? "aluno(a)";
  const avgScore =
    data?.scores.length
      ? Math.round(data.scores.reduce((a, s) => a + s.score, 0) / data.scores.length)
      : null;
  const plan = data?.plan?.aiOutputJson;

  if (isLoading) {
    return (
      <div className="space-y-4 animate-pulse">
        {[...Array(3)].map((_, i) => (
          <div key={i} className="h-24 rounded-xl bg-muted" />
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="animate-slide-up">
        <h1 className="text-[22px] font-extrabold text-foreground tracking-tight">
          Olá, {firstName}!
        </h1>
        <p className="text-[13px] text-muted-foreground mt-1">
          {data?.cycle ? `Ciclo: ${data.cycle.title}` : "Nenhum ciclo ativo no momento."}
        </p>
      </div>

      {/* Stat cards */}
      {avgScore !== null && (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <StatCard
            label="Nota de evolução"
            value={<span className="text-teal-fg">{avgScore}</span>}
            delta="↑ média geral do ciclo"
            delayClass="animate-delay-75"
          />
          <StatCard
            label="Dimensões avaliadas"
            value={data?.scores.length ?? 0}
            delayClass="animate-delay-150"
          />
          <StatCard
            label="Status do plano"
            value={
              data?.plan?.status === "READY"
                ? "Pronto"
                : data?.plan
                ? "Gerando..."
                : "—"
            }
            delta={data?.plan?.status === "READY" ? "↑ Disponível" : undefined}
            delayClass="animate-delay-200"
          />
        </div>
      )}

      {/* Desempenho por dimensão */}
      {data?.scores.length ? (
        <div className="rounded-xl border border-border bg-card p-5 shadow-sm animate-slide-up animate-delay-250">
          <h2 className="text-[14px] font-bold text-foreground mb-4">Desempenho por dimensão</h2>
          <div className="space-y-3.5">
            {data.scores.map((s) => (
              <ScoreBar key={s.dimension} label={s.dimension} score={s.score} />
            ))}
          </div>
        </div>
      ) : null}

      {/* Plano de IA */}
      {plan && (
        <div className="grid gap-4 lg:grid-cols-2 animate-slide-up animate-delay-300">
          <div className="rounded-xl border border-border bg-card p-5 shadow-sm">
            <h2 className="text-[14px] font-bold text-foreground mb-3">Pontos fortes</h2>
            <ul className="space-y-2">
              {plan.strengths.map((s, i) => (
                <li key={i} className="flex gap-2.5 text-[13px] text-muted-foreground">
                  <span className="mt-1.5 h-2 w-2 flex-shrink-0 rounded-full bg-[oklch(0.62_0.13_150)]" />
                  {s}
                </li>
              ))}
            </ul>
          </div>
          <div className="rounded-xl border border-border bg-card p-5 shadow-sm">
            <h2 className="text-[14px] font-bold text-foreground mb-3">Pontos de atenção</h2>
            <ul className="space-y-2">
              {plan.attention_points.map((s, i) => (
                <li key={i} className="flex gap-2.5 text-[13px] text-muted-foreground">
                  <span className="mt-1.5 h-2 w-2 flex-shrink-0 rounded-full bg-amber" />
                  {s}
                </li>
              ))}
            </ul>
          </div>
        </div>
      )}

      {/* Plano da semana */}
      {plan?.seven_day_plan && (
        <div className="rounded-xl border border-border bg-card p-5 shadow-sm animate-slide-up animate-delay-300">
          <h2 className="text-[14px] font-bold text-foreground mb-3">Plano desta semana</h2>
          <ul className="space-y-2">
            {plan.seven_day_plan.map((item, i) => (
              <li key={i} className="flex items-start gap-3 text-[13px] text-muted-foreground">
                <input type="checkbox" className="mt-0.5 rounded accent-teal" readOnly />
                {item}
              </li>
            ))}
          </ul>
          {plan.motivation_message && (
            <p className="mt-4 text-[13px] italic text-muted-foreground border-t border-border pt-3">
              {plan.motivation_message}
            </p>
          )}
        </div>
      )}

      {/* Empty state */}
      {!data?.cycle && (
        <div className="rounded-xl border border-border bg-card p-8 text-center text-[13px] text-muted-foreground">
          Nenhum ciclo de avaliação ativo. Aguarde a abertura do próximo ciclo.
        </div>
      )}
    </div>
  );
}
```

- [ ] **Step 2: Verificar typecheck**

```bash
export PATH="/c/Program Files/nodejs:$PATH"
pnpm --filter web typecheck
```

Esperado: sem erros. Se o tipo de `analyticsApi.studentDashboard()` não incluir `scores[].dimension` ou `scores[].score`, ajustar o acesso aos campos de acordo com o tipo real em `apps/web/src/lib/api/analytics.ts`.

- [ ] **Step 3: Commit**

```bash
git add apps/web/src/app/(student)/student/page.tsx
git commit -m "feat: dashboard aluno com stat cards animados e score bars teal/amber"
```

---

## Task 8: Push e verificação final

- [ ] **Step 1: Rodar lint e typecheck completo**

```bash
export PATH="/c/Program Files/nodejs:$PATH"
pnpm --filter web lint
pnpm --filter web typecheck
```

Esperado: 0 erros, 0 warnings críticos.

- [ ] **Step 2: Iniciar servidor de dev e verificar visualmente**

```bash
export PATH="/c/Program Files/nodejs:$PATH"
pnpm --filter web dev
```

Abrir `http://localhost:3002` e verificar:
- [ ] Fonte Plus Jakarta Sans carregada (inspecionar no DevTools — `font-family` no body)
- [ ] Sidebar navy em todas as páginas autenticadas
- [ ] Logo GOSF com ícone teal
- [ ] Item ativo com `bg-white/9` e ícone teal
- [ ] Avatar do usuário com cor âmbar (sidebar e topbar)
- [ ] Login com split layout (hero navy à esquerda, formulário à direita)
- [ ] Login hero com glows decorativos visíveis
- [ ] Student dashboard com stat cards e animação slide-up na entrada
- [ ] Score bars com cor teal (>70), âmbar-warning (50-70), vermelho (<50)
- [ ] Pontos de atenção com dots âmbar

- [ ] **Step 3: Push**

```bash
git push origin main
```
