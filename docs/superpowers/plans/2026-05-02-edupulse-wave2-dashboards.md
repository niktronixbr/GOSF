# EduPulse Wave 2 — Dashboards Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Restyle all four role dashboards (/student, /teacher, /coordinator, /admin) with the EduPulse design system from Wave 1, migrate TopBar modals to Radix Dialog, and wire Recharts to read CSS vars for dark mode support.

**Architecture:** Each dashboard page is a standalone client component that fetches data via React Query and renders EduPulse components (StatCard, InsightCard, Card, Chip, ProgressBar, Button). No API changes — only presentation layer is touched. The coordinator and admin pages keep existing data logic but replace raw div/tailwind with typed EduPulse components.

**Tech Stack:** Next.js 15 App Router, React 19, React Query, Recharts, Lucide React, Radix UI Dialog (already installed from Wave 1), Tailwind CSS + CSS custom properties

**Worktree:** `.worktrees/edupulse-dashboards` — all work happens here.

---

## Pre-flight: read these files before any task

Before starting any task, read these component files to know their exact props:
- `apps/web/src/components/ui/stat-card.tsx`
- `apps/web/src/components/ui/insight-card.tsx`
- `apps/web/src/components/ui/card.tsx`
- `apps/web/src/components/ui/chip.tsx`
- `apps/web/src/components/ui/progress-bar.tsx`
- `apps/web/src/components/ui/button.tsx`
- `apps/web/src/components/ui/dialog.tsx`
- `apps/web/src/lib/api/analytics.ts` (for exact TypeScript interfaces)

---

### Task 1: Hook useChartColors para Recharts (dark mode)

**Files:**
- Create: `apps/web/src/lib/chart-colors.ts`

**Context:** Recharts uses inline `fill`/`stroke` props — it can't read CSS vars directly. This hook reads CSS custom properties from the DOM after mount, so charts render with the correct palette in both light and dark mode. It must re-read on theme change, so it uses a `MutationObserver` watching for class changes on `<html>`.

- [ ] **Step 1: Create chart-colors.ts**

```ts
// apps/web/src/lib/chart-colors.ts
"use client";

import { useEffect, useState } from "react";

function readCssVar(name: string): string {
  if (typeof window === "undefined") return "";
  return getComputedStyle(document.documentElement)
    .getPropertyValue(name)
    .trim();
}

export interface ChartColors {
  primary: string;
  secondary: string;
  success: string;
  warning: string;
  danger: string;
  muted: string;
  foreground: string;
  gridLine: string;
}

function snapshot(): ChartColors {
  return {
    primary: readCssVar("--primary") || "#703e0e",
    secondary: readCssVar("--secondary") || "#0061a5",
    success: readCssVar("--success") || "#1a6b3c",
    warning: readCssVar("--warning") || "#b45309",
    danger: readCssVar("--error") || "#ba1a1a",
    muted: readCssVar("--muted-foreground") || "#847469",
    foreground: readCssVar("--foreground") || "#0d1c2e",
    gridLine: readCssVar("--outline-variant") || "#d7c3b6",
  };
}

export function useChartColors(): ChartColors {
  const [colors, setColors] = useState<ChartColors>(snapshot);

  useEffect(() => {
    const observer = new MutationObserver(() => setColors(snapshot()));
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ["class"],
    });
    return () => observer.disconnect();
  }, []);

  return colors;
}
```

- [ ] **Step 2: Verify typecheck**

```bash
cd apps/web && npx tsc --noEmit 2>&1 | head -20
```

Expected: no errors related to `chart-colors.ts`.

- [ ] **Step 3: Commit**

```bash
git add apps/web/src/lib/chart-colors.ts
git commit -m "feat(web): hook useChartColors para suporte dark mode em Recharts"
```

---

### Task 2: TopBar — migrar modais para Radix Dialog

**Files:**
- Modify: `apps/web/src/components/dashboard/top-bar.tsx`

**Context:** The TopBar currently implements the "Editar perfil" and "Trocar senha" modals as custom `<div>` overlays (no focus trap, no ESC handling, no scroll lock). Wave 1 added a Radix Dialog wrapper at `apps/web/src/components/ui/dialog.tsx`. This task replaces the two custom overlays with `<Dialog>` from that wrapper.

Read `apps/web/src/components/dashboard/top-bar.tsx` and `apps/web/src/components/ui/dialog.tsx` in full before implementing.

- [ ] **Step 1: Replace the profile modal div with Radix Dialog**

The current profile modal section (the `{profileModalOpen && (...)` block) should become:

```tsx
<Dialog open={profileModalOpen} onOpenChange={setProfileModalOpen}>
  <DialogContent className="max-w-sm">
    <DialogTitle>Editar perfil</DialogTitle>
    <form onSubmit={profileForm.handleSubmit(onProfileSubmit)} className="space-y-4 mt-4">
      <div>
        <label htmlFor="fullName" className="mb-1 block text-sm font-medium text-foreground">
          Nome completo
        </label>
        <input
          id="fullName"
          type="text"
          {...profileForm.register("fullName")}
          className="w-full rounded-lg border border-outline-variant bg-input px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:bg-card focus:border-primary"
        />
        {profileForm.formState.errors.fullName && (
          <p className="mt-1 text-xs text-error">
            {profileForm.formState.errors.fullName.message}
          </p>
        )}
      </div>
      <div>
        <label htmlFor="avatarUrl" className="mb-1 block text-sm font-medium text-foreground">
          URL do avatar{" "}
          <span className="font-normal text-muted-foreground">(opcional)</span>
        </label>
        <input
          id="avatarUrl"
          type="text"
          placeholder="https://..."
          {...profileForm.register("avatarUrl")}
          className="w-full rounded-lg border border-outline-variant bg-input px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:bg-card focus:border-primary"
        />
        {profileForm.formState.errors.avatarUrl && (
          <p className="mt-1 text-xs text-error">
            {profileForm.formState.errors.avatarUrl.message}
          </p>
        )}
      </div>
      <div className="flex gap-3 pt-2">
        <Button type="button" variant="ghost" onClick={() => setProfileModalOpen(false)} className="flex-1">
          Cancelar
        </Button>
        <Button type="submit" variant="primary" disabled={profileForm.formState.isSubmitting} className="flex-1">
          {profileForm.formState.isSubmitting ? "Salvando..." : "Salvar"}
        </Button>
      </div>
    </form>
  </DialogContent>
</Dialog>
```

- [ ] **Step 2: Replace the password modal div with Radix Dialog**

```tsx
<Dialog open={passwordModalOpen} onOpenChange={setPasswordModalOpen}>
  <DialogContent className="max-w-sm">
    <DialogTitle>Trocar senha</DialogTitle>
    <form onSubmit={passwordForm.handleSubmit(onPasswordSubmit)} className="space-y-4 mt-4">
      {[
        { id: "currentPassword", label: "Senha atual", field: "currentPassword" },
        { id: "newPassword", label: "Nova senha", field: "newPassword" },
        { id: "confirmPassword", label: "Confirmar nova senha", field: "confirmPassword" },
      ].map(({ id, label, field }) => (
        <div key={id}>
          <label htmlFor={id} className="mb-1 block text-sm font-medium text-foreground">
            {label}
          </label>
          <input
            id={id}
            type="password"
            {...passwordForm.register(field as "currentPassword" | "newPassword" | "confirmPassword")}
            className="w-full rounded-lg border border-outline-variant bg-input px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:bg-card focus:border-primary"
          />
          {passwordForm.formState.errors[field as keyof PasswordForm] && (
            <p className="mt-1 text-xs text-error">
              {passwordForm.formState.errors[field as keyof PasswordForm]?.message}
            </p>
          )}
        </div>
      ))}
      <div className="flex gap-3 pt-2">
        <Button type="button" variant="ghost" onClick={() => setPasswordModalOpen(false)} className="flex-1">
          Cancelar
        </Button>
        <Button type="submit" variant="primary" disabled={passwordForm.formState.isSubmitting} className="flex-1">
          {passwordForm.formState.isSubmitting ? "Salvando..." : "Salvar"}
        </Button>
      </div>
    </form>
  </DialogContent>
</Dialog>
```

- [ ] **Step 3: Update imports**

Add to imports at top of file:
```tsx
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
```

Remove the `useState` boolean states `passwordModalOpen` and `profileModalOpen` — keep them since Dialog still uses `open`/`onOpenChange`. Remove the `openPasswordModal` and `openProfileModal` helper functions if no longer needed (keep if still used).

Check that `DialogContent` and `DialogTitle` are exported from `apps/web/src/components/ui/dialog.tsx`. If not, add them to the dialog wrapper exports.

- [ ] **Step 4: Run typecheck**

```bash
cd apps/web && npx tsc --noEmit 2>&1 | head -30
```

- [ ] **Step 5: Commit**

```bash
git add apps/web/src/components/dashboard/top-bar.tsx apps/web/src/components/ui/dialog.tsx
git commit -m "feat(web): migrar modais do TopBar para Radix Dialog com focus trap"
```

---

### Task 3: Student Dashboard — restyle EduPulse

**Files:**
- Modify: `apps/web/src/app/(student)/student/page.tsx`

**Context:** The current student page has custom div-based stat cards, custom color logic, and no InsightCard. Replace with EduPulse layout: Hero → StatCards row → InsightCard + Mapa de Habilidades (2-col) → Plano 7 Dias card.

Read `apps/web/src/app/(student)/student/page.tsx` and `apps/web/src/lib/api/analytics.ts` in full before implementing. Note the exact TypeScript interface for `StudentDashboard` and use it correctly.

- [ ] **Step 1: Rewrite the student dashboard page**

```tsx
"use client";

import { useQuery } from "@tanstack/react-query";
import { useAuthStore } from "@/store/auth.store";
import { analyticsApi } from "@/lib/api/analytics";
import { StatCard } from "@/components/ui/stat-card";
import { InsightCard } from "@/components/ui/insight-card";
import { Card } from "@/components/ui/card";
import { ProgressBar } from "@/components/ui/progress-bar";
import { Chip } from "@/components/ui/chip";
import { TrendingUp, BookOpen, Target, Sparkles } from "lucide-react";

export default function StudentDashboardPage() {
  const { user } = useAuthStore();
  const firstName = user?.fullName?.split(" ")[0] ?? "Aluno";

  const { data, isLoading } = useQuery({
    queryKey: ["student-dashboard"],
    queryFn: analyticsApi.studentDashboard,
  });

  if (isLoading) {
    return (
      <div className="p-6">
        <div className="h-8 w-48 rounded-lg bg-surface-container animate-pulse mb-6" />
        <div className="grid grid-cols-3 gap-4 mb-6">
          {[0, 1, 2].map((i) => (
            <div key={i} className="h-28 rounded-xl bg-surface-container animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="p-6">
        <h1 className="text-2xl font-semibold text-foreground mb-2">Bem-vindo, {firstName}.</h1>
        <p className="text-muted-foreground">Nenhum ciclo ativo no momento. Aguarde seu coordenador abrir um novo ciclo.</p>
      </div>
    );
  }

  const scores = data.scores ?? [];
  const avgScore = scores.length
    ? Math.round(scores.reduce((sum, s) => sum + s.score, 0) / scores.length)
    : 0;
  const plan = data.plan;

  const insightSubItems = [
    ...(plan?.strengths?.slice(0, 2).map((s: string) => ({ title: "Ponto forte", description: s })) ?? []),
    ...(plan?.attentionPoints?.slice(0, 1).map((a: string) => ({ title: "Atenção", description: a })) ?? []),
  ];

  function scoreVariant(score: number): "success" | "warning" | "danger" {
    if (score >= 70) return "success";
    if (score >= 50) return "warning";
    return "danger";
  }

  return (
    <div className="p-6 space-y-6 max-w-[1280px]">
      {/* Hero */}
      <div>
        <h1 className="text-2xl font-semibold text-foreground">
          Bem-vindo, {firstName}.
        </h1>
        <p className="text-sm text-muted-foreground mt-1">
          Acompanhe sua evolução acadêmica.
        </p>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <StatCard
          icon={<TrendingUp size={20} />}
          label="Score geral"
          value={`${avgScore}`}
          trend={avgScore >= 70 ? "up" : avgScore >= 50 ? "neutral" : "down"}
        />
        <StatCard
          icon={<BookOpen size={20} />}
          label="Dimensões avaliadas"
          value={`${scores.length}`}
        />
        <StatCard
          icon={<Target size={20} />}
          label="Plano IA"
          value={plan ? "Ativo" : "Pendente"}
          badge={plan ? { label: "Ativo", variant: "success" } : { label: "Pendente", variant: "warning" }}
        />
      </div>

      {/* InsightCard + Mapa de Habilidades */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {plan && insightSubItems.length > 0 ? (
          <InsightCard
            variant="primary"
            label="DESTAQUES DA SEMANA"
            icon={<Sparkles size={16} />}
            title="Seu progresso em foco"
            description="Baseado no seu plano de desenvolvimento IA."
            subItems={insightSubItems}
          />
        ) : (
          <Card className="flex items-center justify-center min-h-[160px]">
            <p className="text-sm text-muted-foreground text-center">
              Seu plano IA ainda está sendo gerado.
            </p>
          </Card>
        )}

        <Card>
          <h2 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-4">
            Mapa de Habilidades
          </h2>
          {scores.length === 0 ? (
            <p className="text-sm text-muted-foreground">Nenhuma avaliação registrada ainda.</p>
          ) : (
            <div className="space-y-3">
              {scores.map((s) => {
                const variant = scoreVariant(s.score);
                return (
                  <div key={s.dimension}>
                    <div className="flex justify-between items-center mb-1">
                      <span className="text-sm text-foreground">{s.dimension}</span>
                      <Chip variant={variant}>{s.score.toFixed(1)}</Chip>
                    </div>
                    <ProgressBar value={s.score} max={100} variant={variant} />
                  </div>
                );
              })}
            </div>
          )}
        </Card>
      </div>

      {/* Plano 7 Dias */}
      {plan?.sevenDayPlan && plan.sevenDayPlan.length > 0 && (
        <Card>
          <h2 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-4">
            Plano 7 Dias
          </h2>
          <ul className="space-y-2">
            {plan.sevenDayPlan.map((item: string, i: number) => (
              <li key={i} className="flex gap-3 text-sm text-foreground">
                <span className="text-primary font-semibold shrink-0">{i + 1}.</span>
                <span>{item}</span>
              </li>
            ))}
          </ul>
        </Card>
      )}

      {/* Pontos de Atenção */}
      {plan?.attentionPoints && plan.attentionPoints.length > 0 && (
        <Card>
          <h2 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-4">
            Pontos de Atenção
          </h2>
          <ul className="space-y-2">
            {plan.attentionPoints.map((item: string, i: number) => (
              <li key={i} className="flex gap-2 text-sm text-foreground">
                <span className="text-error shrink-0">•</span>
                <span>{item}</span>
              </li>
            ))}
          </ul>
        </Card>
      )}
    </div>
  );
}
```

**Important:** Check the exact property names of `ScoreAggregate` in `analytics.ts`. The `s.dimension` and `s.score` names above are assumptions — adjust to match the actual interface. Same for `plan.sevenDayPlan`, `plan.attentionPoints`, `plan.strengths` — check the actual `StudentPlanOutput` interface.

- [ ] **Step 2: Run typecheck**

```bash
cd apps/web && npx tsc --noEmit 2>&1 | head -30
```

Fix any type errors before committing.

- [ ] **Step 3: Commit**

```bash
git add apps/web/src/app/(student)/student/page.tsx
git commit -m "feat(web): restyle dashboard student com StatCard, InsightCard e mapa de habilidades"
```

---

### Task 4: Teacher Dashboard — restyle EduPulse

**Files:**
- Modify: `apps/web/src/app/(teacher)/teacher/page.tsx`

**Context:** The current teacher page uses the old `<Stat>` component (not the new `StatCard`). Replace with EduPulse layout: Hero with CTA → 2-col grid (StatCards + skill map) → InsightCard.

Read `apps/web/src/app/(teacher)/teacher/page.tsx` and `apps/web/src/lib/api/analytics.ts` in full before implementing.

- [ ] **Step 1: Rewrite teacher dashboard**

```tsx
"use client";

import { useQuery } from "@tanstack/react-query";
import { useAuthStore } from "@/store/auth.store";
import { analyticsApi } from "@/lib/api/analytics";
import { StatCard } from "@/components/ui/stat-card";
import { InsightCard } from "@/components/ui/insight-card";
import { Card } from "@/components/ui/card";
import { ProgressBar } from "@/components/ui/progress-bar";
import { Chip } from "@/components/ui/chip";
import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";
import { TrendingUp, Users, BookOpen, Sparkles } from "lucide-react";

export default function TeacherDashboardPage() {
  const { user } = useAuthStore();
  const router = useRouter();
  const firstName = user?.fullName?.split(" ")[0] ?? "Professor";

  const { data, isLoading } = useQuery({
    queryKey: ["teacher-dashboard"],
    queryFn: analyticsApi.teacherDashboard,
  });

  if (isLoading) {
    return (
      <div className="p-6">
        <div className="h-8 w-56 rounded-lg bg-surface-container animate-pulse mb-6" />
        <div className="grid grid-cols-2 gap-4 mb-6">
          {[0, 1].map((i) => (
            <div key={i} className="h-28 rounded-xl bg-surface-container animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="p-6">
        <h1 className="text-2xl font-semibold text-foreground mb-2">Olá, Prof. {firstName}.</h1>
        <p className="text-muted-foreground">Nenhum ciclo ativo no momento.</p>
      </div>
    );
  }

  const scores = data.scores ?? [];
  const avgScore = scores.length
    ? Math.round(scores.reduce((sum, s) => sum + s.score, 0) / scores.length)
    : 0;
  const plan = data.plan;

  const insightSubItems = [
    ...(plan?.strengths?.slice(0, 2).map((s: string) => ({ title: "Ponto forte", description: s })) ?? []),
    ...(plan?.developmentPoints?.slice(0, 1).map((d: string) => ({ title: "Desenvolvimento", description: d })) ?? []),
  ];

  function scoreVariant(score: number): "success" | "warning" | "danger" {
    if (score >= 70) return "success";
    if (score >= 50) return "warning";
    return "danger";
  }

  return (
    <div className="p-6 space-y-6 max-w-[1280px]">
      {/* Hero */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-foreground">
            Olá, Prof. {firstName}.
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Acompanhe o desempenho dos seus alunos.
          </p>
        </div>
        <Button
          variant="primary"
          onClick={() => router.push("/teacher/evaluations")}
          className="shrink-0"
        >
          Avaliar alunos
        </Button>
      </div>

      {/* StatCards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <StatCard
          icon={<TrendingUp size={20} />}
          label="Score médio"
          value={`${avgScore}`}
          trend={avgScore >= 70 ? "up" : avgScore >= 50 ? "neutral" : "down"}
        />
        <StatCard
          icon={<BookOpen size={20} />}
          label="Dimensões avaliadas"
          value={`${scores.length}`}
        />
        <StatCard
          icon={<Users size={20} />}
          label="Plano IA"
          value={plan ? "Ativo" : "Pendente"}
          badge={plan ? { label: "Ativo", variant: "success" } : { label: "Pendente", variant: "warning" }}
        />
      </div>

      {/* Mapa de Habilidades + InsightCard */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <h2 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-4">
            Desempenho por Dimensão
          </h2>
          {scores.length === 0 ? (
            <p className="text-sm text-muted-foreground">Nenhuma avaliação registrada.</p>
          ) : (
            <div className="space-y-3">
              {scores.map((s) => {
                const variant = scoreVariant(s.score);
                return (
                  <div key={s.dimension}>
                    <div className="flex justify-between items-center mb-1">
                      <span className="text-sm text-foreground">{s.dimension}</span>
                      <Chip variant={variant}>{s.score.toFixed(1)}</Chip>
                    </div>
                    <ProgressBar value={s.score} max={100} variant={variant} />
                  </div>
                );
              })}
            </div>
          )}
        </Card>

        {plan && insightSubItems.length > 0 ? (
          <InsightCard
            variant="primary"
            label="AI INSIGHTS"
            icon={<Sparkles size={16} />}
            title="Seu plano de desenvolvimento"
            description="Baseado nas avaliações dos seus alunos e no seu perfil docente."
            subItems={insightSubItems}
            cta={{ label: "Ver plano completo", onClick: () => router.push("/teacher/development") }}
          />
        ) : (
          <Card className="flex items-center justify-center min-h-[160px]">
            <p className="text-sm text-muted-foreground text-center">
              Gere seu plano IA para ver insights aqui.
            </p>
          </Card>
        )}
      </div>

      {/* Ações recomendadas */}
      {plan?.developmentPoints && plan.developmentPoints.length > 0 && (
        <Card>
          <h2 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-4">
            Ações Recomendadas
          </h2>
          <ul className="space-y-2">
            {plan.developmentPoints.map((item: string, i: number) => (
              <li key={i} className="flex gap-2 text-sm text-foreground">
                <span className="text-secondary shrink-0">→</span>
                <span>{item}</span>
              </li>
            ))}
          </ul>
        </Card>
      )}
    </div>
  );
}
```

**Important:** Check actual property names in `TeacherPlanOutput`. The property `developmentPoints` is an assumption — it might be `development_points` or similar. Adjust to match the interface.

- [ ] **Step 2: Run typecheck**

```bash
cd apps/web && npx tsc --noEmit 2>&1 | head -30
```

- [ ] **Step 3: Commit**

```bash
git add apps/web/src/app/(teacher)/teacher/page.tsx
git commit -m "feat(web): restyle dashboard teacher com StatCard, InsightCard e CTA avaliar"
```

---

### Task 5: Coordinator Dashboard — restyle EduPulse

**Files:**
- Modify: `apps/web/src/app/(coordinator)/coordinator/page.tsx`

**Context:** The coordinator page already has good data logic (KPI grid, recharts bar chart, rankings). This task is a restyle — no logic changes. Goals:
1. Replace `<Stat>` with `<StatCard>`
2. Replace hard-coded hex colors in recharts with `useChartColors()`
3. Replace inline `ScoreBadge` component with `<Chip>`
4. Replace raw divs for KPI cards with `<Card>`
5. Wrap the at-risk alert section with a `<Card>` styled with amber/warning background
6. Add an InsightCard at the bottom for recommended coordinator actions (use hardcoded text if no AI data available)

Read `apps/web/src/app/(coordinator)/coordinator/page.tsx` in full before implementing. The file is ~365 lines. Keep all existing data-fetching, memoization, and business logic intact — only swap the presentation layer.

- [ ] **Step 1: Add imports and replace ScoreBadge**

At the top of the file, replace the existing imports with the EduPulse components:

```tsx
import { StatCard } from "@/components/ui/stat-card";
import { Card } from "@/components/ui/card";
import { Chip } from "@/components/ui/chip";
import { InsightCard } from "@/components/ui/insight-card";
import { useChartColors } from "@/lib/chart-colors";
import { Lightbulb } from "lucide-react";
```

Remove the inline `ScoreBadge` component and `scoreColor` function — replace all usages with `<Chip variant={...}>`.

Replace `scoreColor` logic with chip variant logic:
```tsx
function scoreVariant(score: number): "success" | "warning" | "danger" {
  if (score >= 70) return "success";
  if (score >= 50) return "warning";
  return "danger";
}
```

- [ ] **Step 2: Replace Stat with StatCard in KPI grid**

The 6-card KPI section currently uses `<Stat icon={...} label={...} value={...}>`. Replace each with `<StatCard icon={...} label={...} value={...}>`.

- [ ] **Step 3: Wire chart colors**

Add at the top of the component function:
```tsx
const chartColors = useChartColors();
```

In the `<BarChart>` section, replace hardcoded colors like `"#703e0e"` and `"#0061a5"` with `chartColors.primary` and `chartColors.secondary`. Replace `"#d7c3b6"` grid lines with `chartColors.gridLine`. Replace `"#52443a"` axis ticks with `chartColors.muted`.

- [ ] **Step 4: Wrap at-risk alert with styled Card**

The at-risk subjects banner currently uses raw divs. Wrap with:
```tsx
{atRiskSubjects.length > 0 && (
  <div className="rounded-xl border border-warning/40 bg-warning/10 p-5">
    <div className="flex items-center gap-2 mb-3">
      <AlertTriangle size={16} className="text-warning" />
      <span className="text-sm font-semibold text-warning uppercase tracking-wide">
        Disciplinas em risco
      </span>
    </div>
    <div className="flex flex-wrap gap-2">
      {atRiskSubjects.map((s) => (
        <Chip key={s.subjectId} variant="warning">{s.subjectName} — média {s.avg.toFixed(1)}</Chip>
      ))}
    </div>
  </div>
)}
```

Add `import { AlertTriangle } from "lucide-react"` if not already imported.

- [ ] **Step 5: Add InsightCard for coordinator actions**

At the bottom of the page (after rankings), add:

```tsx
<InsightCard
  variant="tertiary"
  label="AÇÕES RECOMENDADAS"
  icon={<Lightbulb size={16} />}
  title="Próximos passos para o coordenador"
  description="Com base nos dados do ciclo atual."
  subItems={[
    { title: "Alunos em risco", description: "Acompanhe os alunos abaixo de 50 pontos e agende intervenções." },
    { title: "Benchmarking", description: "Compare o desempenho das turmas para identificar melhores práticas." },
    { title: "Relatórios", description: "Exporte os dados do ciclo para compartilhar com a direção." },
  ]}
/>
```

- [ ] **Step 6: Run typecheck**

```bash
cd apps/web && npx tsc --noEmit 2>&1 | head -30
```

- [ ] **Step 7: Commit**

```bash
git add apps/web/src/app/(coordinator)/coordinator/page.tsx apps/web/src/lib/chart-colors.ts
git commit -m "feat(web): restyle dashboard coordinator com StatCard, Chip, chart dark mode e InsightCard"
```

---

### Task 6: Admin Dashboard — restyle EduPulse

**Files:**
- Modify: `apps/web/src/app/(admin)/admin/page.tsx`

**Context:** The admin page is a user management table with search, filters, pagination, and two modals (create/edit user). Restyle goals:
1. Replace raw div cards for stats with `<StatCard>`
2. Replace `<input>` search with the EduPulse `<Input>` component (or at minimum apply EduPulse input classes)
3. Replace role/status color maps (string → tailwind class) with `<Chip variant={...}>`
4. Wrap the table in `<Card noPadding>`
5. Replace `<Button>` raw elements with `<Button>` component
6. Replace the two custom modal divs (CreateUserModal, EditUserModal) with Radix `<Dialog>`

Read `apps/web/src/app/(admin)/admin/page.tsx` in full before implementing. Keep all existing data-fetching, mutations, form logic, and pagination logic intact.

- [ ] **Step 1: Add imports**

```tsx
import { StatCard } from "@/components/ui/stat-card";
import { Card } from "@/components/ui/card";
import { Chip } from "@/components/ui/chip";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { Users, UserCheck, GraduationCap, BookOpen } from "lucide-react";
```

- [ ] **Step 2: Replace stats grid with StatCard**

The 4 stat boxes (total, active, students, teachers) become:
```tsx
<div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
  <StatCard icon={<Users size={20} />} label="Total de usuários" value={`${total}`} />
  <StatCard icon={<UserCheck size={20} />} label="Usuários ativos" value={`${active}`} />
  <StatCard icon={<GraduationCap size={20} />} label="Alunos" value={`${students}`} />
  <StatCard icon={<BookOpen size={20} />} label="Professores" value={`${teachers}`} />
</div>
```

Adjust variable names to match actual computed values in the file.

- [ ] **Step 3: Replace role/status display with Chip**

The current code uses string maps like `roleColors` and `statusColors` to produce tailwind classes. Replace with:

```tsx
// Role mapping
function roleChipVariant(role: string): "info" | "success" | "warning" | "neutral" {
  if (role === "STUDENT") return "info";
  if (role === "TEACHER") return "success";
  if (role === "COORDINATOR") return "warning";
  return "neutral";
}

function roleLabel(role: string): string {
  const map: Record<string, string> = {
    STUDENT: "Aluno",
    TEACHER: "Professor",
    COORDINATOR: "Coordenador",
    ADMIN: "Admin",
  };
  return map[role] ?? role;
}

// Status mapping
function statusVariant(active: boolean): "success" | "danger" {
  return active ? "success" : "danger";
}
```

In the table rows, replace role/status cells with:
```tsx
<Chip variant={roleChipVariant(user.role)}>{roleLabel(user.role)}</Chip>
<Chip variant={statusVariant(user.active)}>{user.active ? "Ativo" : "Inativo"}</Chip>
```

- [ ] **Step 4: Wrap table in Card**

```tsx
<Card noPadding>
  <table className="w-full text-sm">
    {/* existing table content */}
  </table>
</Card>
```

Add `noPadding` prop support to Card if not already present. Check `apps/web/src/components/ui/card.tsx` — if there's no `noPadding` prop, add it:
```tsx
interface CardProps {
  noPadding?: boolean;
  className?: string;
  children: React.ReactNode;
}
// In className: noPadding ? "" : "p-6"
```

- [ ] **Step 5: Replace modals with Radix Dialog**

`CreateUserModal` and `EditUserModal` are currently custom overlay divs. Replace their outer wrapper div with `<Dialog>`:

```tsx
// CreateUserModal
<Dialog open={showCreate} onOpenChange={setShowCreate}>
  <DialogContent className="max-w-md">
    <DialogTitle>Criar usuário</DialogTitle>
    {/* existing form content */}
  </DialogContent>
</Dialog>
```

```tsx
// EditUserModal
<Dialog open={!!editUser} onOpenChange={(open) => !open && setEditUser(null)}>
  <DialogContent className="max-w-md">
    <DialogTitle>Editar usuário</DialogTitle>
    {/* existing form content */}
  </DialogContent>
</Dialog>
```

Keep all existing form logic (`useForm`, `zodResolver`, `onSubmit` handlers). Only the modal shell changes.

- [ ] **Step 6: Replace action buttons with Button component**

Replace raw `<button>` elements in the table row actions with:
```tsx
<Button variant="ghost" size="sm" onClick={() => setEditUser(u)}>
  <Pencil size={14} />
</Button>
<Button variant="ghost" size="sm" onClick={() => handleToggleStatus(u)}>
  <Power size={14} />
</Button>
```

Replace the "Criar usuário" header button:
```tsx
<Button variant="primary" onClick={() => setShowCreate(true)}>
  Criar usuário
</Button>
```

- [ ] **Step 7: Run typecheck**

```bash
cd apps/web && npx tsc --noEmit 2>&1 | head -30
```

Fix any type errors.

- [ ] **Step 8: Commit**

```bash
git add apps/web/src/app/(admin)/admin/page.tsx apps/web/src/components/ui/card.tsx
git commit -m "feat(web): restyle dashboard admin com StatCard, Chip, Radix Dialog e Button EduPulse"
```

---

### Task 7: Validação final e commit de fechamento

**Files:** None (validation only)

- [ ] **Step 1: Run full typecheck**

```bash
export PATH="/c/Program Files/nodejs:$PATH"
pnpm --filter api typecheck && pnpm --filter web typecheck
```

Expected: 0 errors in both packages.

- [ ] **Step 2: Run lint**

```bash
pnpm --filter web lint
```

Expected: 0 errors (warnings are acceptable if pre-existing).

- [ ] **Step 3: If typecheck or lint fails**

Fix the errors before proceeding. Common issues to watch for:
- Property name mismatches with actual API interfaces (ScoreAggregate, StudentDashboard, etc.)
- Missing exports from dialog.tsx (DialogTitle, DialogContent)
- `noPadding` prop not added to Card if referenced
- Chart colors hook used in server context (must be client component)

- [ ] **Step 4: Final commit if needed**

```bash
git add -A
git commit -m "fix(web): ajustes finais Wave 2 — typecheck + lint"
```

---

## Notes for the implementer

1. **Check exact API interfaces first** — `analytics.ts` has the ground truth for `ScoreAggregate`, `StudentDashboard`, `TeacherDashboard`. Property names like `s.dimension`, `s.score`, `plan.sevenDayPlan` are educated guesses. Read the file and adjust.

2. **InsightCard subItems type** — check the `InsightCard` component's `subItems` prop type. It likely expects `{ title: string; description: string }[]`.

3. **StatCard badge prop** — check the `StatCard` component. If it doesn't have a `badge` prop, either add it or use `<Chip>` alongside instead.

4. **Card noPadding** — if the `Card` component doesn't support `noPadding`, add it before using it in the admin page.

5. **Dialog exports** — the Radix Dialog wrapper may only export `Dialog`, `DialogContent`. If it doesn't export `DialogTitle`, add it to `apps/web/src/components/ui/dialog.tsx` using `@radix-ui/react-dialog`'s `Root`, `Title`, etc.

6. **Dark mode chart colors** — `useChartColors` uses a `MutationObserver` to detect theme changes. This must be used inside a client component. The coordinator page is already a client component, so this is fine.

7. **No new features** — this wave is styling only. Do not add new API endpoints, new data queries, or new business logic.
