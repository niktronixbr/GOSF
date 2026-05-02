# EduPulse Wave 3 — Lists, Forms & Settings Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Apply EduPulse design tokens to all ~20 remaining pages (student, teacher, coordinator, admin). Replace hardcoded colors with CSS vars, migrate custom modals to Radix Dialog, standardize Button/Chip/Card/ProgressBar usage, wire chart colors to `useChartColors()`.

**Architecture:** Purely presentational — no API or business logic changes. Strategy: fix shared infrastructure first (modal.tsx, utilities), then restyle page batches by role.

**Tech Stack:** Next.js 15, Tailwind CSS + CSS vars, Radix UI (already installed), existing EduPulse components (Card, Chip, Button, StatCard, ProgressBar, InsightCard), useChartColors hook.

**Worktree:** `.worktrees/edupulse-lists`

---

## Pre-flight: read these files before any task

- `apps/web/src/components/ui/modal.tsx`
- `apps/web/src/components/ui/chip.tsx`
- `apps/web/src/components/ui/button.tsx`
- `apps/web/src/components/ui/card.tsx`
- `apps/web/src/components/ui/progress-bar.tsx`
- `apps/web/src/components/ui/dialog.tsx`
- `apps/web/src/lib/chart-colors.ts`
- `apps/web/src/app/globals.css` (CSS var names available)

---

### Task 1: Fix modal.tsx + criar utilitário scoreVariant

**Files:**
- Modify: `apps/web/src/components/ui/modal.tsx`
- Create: `apps/web/src/lib/score-color.ts`

**Context:** The shared `modal.tsx` uses `bg-white` which breaks dark mode. Additionally, many pages define their own inline `scoreColor()` function returning hardcoded hex. Centralizing it once prevents duplication.

- [ ] **Step 1: Read modal.tsx in full**

- [ ] **Step 2: Fix modal.tsx for dark mode**

In `modal.tsx`, replace `bg-white` with `bg-surface` and ensure `text-foreground` is set. The modal panel div should use:
```tsx
className="relative w-full max-w-lg rounded-xl bg-surface p-6 shadow-xl border border-outline-variant text-foreground"
```
Also check if the overlay uses `bg-black/50` — if it uses `bg-black bg-opacity-50`, convert to `bg-black/50`.

- [ ] **Step 3: Create score-color utility**

```ts
// apps/web/src/lib/score-color.ts

export function scoreVariant(score: number): "success" | "warning" | "danger" {
  if (score >= 70) return "success";
  if (score >= 50) return "warning";
  return "danger";
}

// Returns Tailwind classes for a score-colored inline badge (use Chip when possible)
export function scoreBgClass(score: number): string {
  if (score >= 70) return "bg-success/10 text-success";
  if (score >= 50) return "bg-warning/10 text-warning";
  return "bg-error/10 text-error";
}
```

- [ ] **Step 4: Typecheck**

```bash
export PATH="/c/Program Files/nodejs:$PATH"
pnpm --filter web typecheck 2>&1 | tail -5
```

- [ ] **Step 5: Commit**

```bash
git add apps/web/src/components/ui/modal.tsx apps/web/src/lib/score-color.ts
git commit -m "fix(web): modal.tsx dark mode + utilitário scoreVariant centralizado"
```

---

### Task 2: Páginas student — restyle batch

**Files:**
- Modify: `apps/web/src/app/(student)/student/goals/page.tsx`
- Modify: `apps/web/src/app/(student)/student/plan/page.tsx`
- Modify: `apps/web/src/app/(student)/student/progress/page.tsx`
- Modify: `apps/web/src/app/(student)/student/feedback/page.tsx`
- Modify: `apps/web/src/app/(student)/student/evaluations/page.tsx`

**Context:** Read all 5 files before starting. Apply only what's needed per file:

**goals/page.tsx (467 lines, complex):**
- Replace custom Modal with Radix `<Dialog>` from `@/components/ui/dialog`
- Replace hardcoded status colors (`bg-slate-100`, `bg-blue-100`, etc.) with `<Chip variant={...}>`
- Map goal status to chip variant: PENDING→neutral, IN_PROGRESS→info, COMPLETED→success, CANCELLED→danger
- Keep all existing form logic (react-hook-form + zod) — only the modal shell changes

**plan/page.tsx (310 lines):**
- Replace "Gerar plano" button raw `<button>` with `<Button variant="primary">`
- The GradesSection and PlanSection components are already well-structured — only touch top-level button styling
- Check if any hardcoded hex colors exist (e.g. grade bars)

**progress/page.tsx (234 lines):**
- Wire recharts LineChart to `useChartColors()` — replace any hardcoded `stroke` colors with `chartColors.primary`, `chartColors.secondary`
- Check current chart strokes — the triage says it uses `stroke="var(--border)"` already, which may be a missing token. Replace with `chartColors.gridLine` for grid and `chartColors.primary`/`chartColors.secondary` for data lines.
- Table header: replace `bg-muted/40` or similar with `bg-surface-container`

**feedback/page.tsx (190 lines):**
- Tab toggle buttons: apply `Button variant="ghost"` for inactive tabs, `variant="primary"` for active
- Or use a simpler approach: apply EduPulse chip-like styling for toggle (see note below)
- Replace any hardcoded category badge colors with `<Chip>`

**evaluations/page.tsx (59 lines — simple):**
- Check for any hardcoded colors or old Badge imports
- Replace status badges with `<Chip variant={...}>`
- This is likely already close to EduPulse — verify and minimal touch

**For each file:**

- [ ] **Step 1: Read all 5 files**

- [ ] **Step 2: Apply restyle to goals/page.tsx**

In `goals/page.tsx`, find the modal section. Replace the custom overlay div with Radix Dialog:
```tsx
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";

// Replace: {isModalOpen && <div className="fixed inset-0 ...">...</div>}
// With:
<Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
  <DialogContent className="max-w-lg">
    <DialogTitle>{editingGoal ? "Editar meta" : "Nova meta"}</DialogTitle>
    {/* existing form content, unchanged */}
  </DialogContent>
</Dialog>
```

Replace goal status badges. Find the badge rendering code and replace inline colored divs with `<Chip>`:
```tsx
import { Chip } from "@/components/ui/chip";

function goalStatusVariant(status: string): "neutral" | "info" | "success" | "danger" {
  if (status === "COMPLETED") return "success";
  if (status === "IN_PROGRESS") return "info";
  if (status === "CANCELLED") return "danger";
  return "neutral";
}

function goalStatusLabel(status: string): string {
  const map: Record<string, string> = {
    PENDING: "Pendente",
    IN_PROGRESS: "Em andamento",
    COMPLETED: "Concluída",
    CANCELLED: "Cancelada",
  };
  return map[status] ?? status;
}

// Usage: <Chip variant={goalStatusVariant(goal.status)}>{goalStatusLabel(goal.status)}</Chip>
```

- [ ] **Step 3: Apply restyle to plan/page.tsx**

Read the file. Find all `<button>` elements that trigger plan generation and replace with `<Button>`:
```tsx
import { Button } from "@/components/ui/button";

// Replace: <button onClick={...} className="...">Gerar plano</button>
// With: <Button variant="primary" onClick={...}>Gerar plano</Button>
```

Check for hardcoded hex colors in grade bars — replace with CSS vars or `ProgressBar` component if applicable.

- [ ] **Step 4: Apply restyle to progress/page.tsx**

Read the file. Add `useChartColors`:
```tsx
import { useChartColors } from "@/lib/chart-colors";
const chartColors = useChartColors();
```

In the LineChart, replace hardcoded stroke colors with `chartColors.primary`, `chartColors.secondary`. Replace grid stroke with `chartColors.gridLine`. Replace axis tick fill with `chartColors.muted`.

- [ ] **Step 5: Apply restyle to feedback/page.tsx**

Read the file. Replace raw tab toggle buttons with `Button` components. Replace any hardcoded category badge colors with `<Chip>`.

- [ ] **Step 6: Apply restyle to evaluations/page.tsx**

Read the file. Replace status badges with `<Chip>`. Verify no hardcoded colors remain.

- [ ] **Step 7: Typecheck**

```bash
export PATH="/c/Program Files/nodejs:$PATH"
pnpm --filter web typecheck 2>&1 | tail -10
```

Fix all errors.

- [ ] **Step 8: Commit**

```bash
git add apps/web/src/app/(student)/student/goals/page.tsx \
        apps/web/src/app/(student)/student/plan/page.tsx \
        apps/web/src/app/(student)/student/progress/page.tsx \
        apps/web/src/app/(student)/student/feedback/page.tsx \
        apps/web/src/app/(student)/student/evaluations/page.tsx
git commit -m "feat(web): restyle páginas student — metas, plano, progresso, feedback, avaliações"
```

---

### Task 3: Páginas teacher — restyle batch

**Files:**
- Modify: `apps/web/src/app/(teacher)/teacher/grades/page.tsx`
- Modify: `apps/web/src/app/(teacher)/teacher/insights/page.tsx`
- Modify: `apps/web/src/app/(teacher)/teacher/development/page.tsx`
- Modify: `apps/web/src/app/(teacher)/teacher/classes/page.tsx`
- Modify: `apps/web/src/app/(teacher)/teacher/evaluations/page.tsx`

**Context:** Read all 5 files. The most complex are grades and insights.

**grades/page.tsx (321 lines, complex):**
- Replace the custom `GradeModal` (fixed-position div overlay) with Radix `<Dialog>`
- The modal contains a form (add grade) and a list (existing grades) — keep all logic
- Replace `gradeColor`/`gradeBarColor` inline functions with `scoreVariant` from `@/lib/score-color`
- Replace grade progress bar divs with `<ProgressBar>`

**insights/page.tsx (357 lines, complex):**
- Wire recharts BarChart to `useChartColors()`
- Replace at-risk indicator border colors (`border-red-300`) with `border-error/40`
- Replace `ScoreBar` custom component inline bars with `<ProgressBar variant={scoreVariant(score)}>`
- Replace hardcoded chart tooltip inline styles with CSS var equivalents

**development/page.tsx (207 lines):**
- Replace "Gerar plano" button with `<Button variant="primary">`
- Same pattern as student/plan.tsx

**classes/page.tsx (72 lines — simple):**
- Verify no hardcoded colors
- Replace status badges with `<Chip>` if present

**evaluations/page.tsx (115 lines):**
- Replace status badges with `<Chip>`

- [ ] **Step 1: Read all 5 files**

- [ ] **Step 2: Restyle grades/page.tsx**

Find the `GradeModal` component. It renders as a fixed-position overlay. Replace with Radix Dialog:
```tsx
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { ProgressBar } from "@/components/ui/progress-bar";
import { scoreVariant } from "@/lib/score-color";

// Replace the custom modal overlay with:
<Dialog open={!!selectedStudent} onOpenChange={(open) => !open && setSelectedStudent(null)}>
  <DialogContent className="max-w-md">
    <DialogTitle>{selectedStudent?.fullName ?? "Notas"}</DialogTitle>
    {/* existing grade list and form content */}
  </DialogContent>
</Dialog>
```

Replace grade bar divs with `<ProgressBar value={grade.value} max={10} variant={scoreVariant(grade.value * 10)} />`.
Replace `gradeColor`/`gradeBarColor` with `scoreVariant` from `@/lib/score-color`.

- [ ] **Step 3: Restyle insights/page.tsx**

```tsx
import { useChartColors } from "@/lib/chart-colors";
import { ProgressBar } from "@/components/ui/progress-bar";
import { scoreVariant } from "@/lib/score-color";

// In component:
const chartColors = useChartColors();
```

Wire chart: replace hardcoded fill/stroke with `chartColors.*`.
Replace `ScoreBar` inline div bars with `<ProgressBar>`.
Replace `border-red-300 dark:border-red-800` with `border-error/40`.

Tooltip contentStyle:
```tsx
contentStyle={{
  borderRadius: "8px",
  border: `1px solid ${chartColors.gridLine}`,
  background: "var(--surface)",
  color: "var(--foreground)",
  fontSize: "13px",
}}
```

- [ ] **Step 4: Restyle development/page.tsx and others**

Apply `Button` for generate plan button. Apply `Chip` for status badges.

- [ ] **Step 5: Typecheck**

```bash
export PATH="/c/Program Files/nodejs:$PATH"
pnpm --filter web typecheck 2>&1 | tail -10
```

- [ ] **Step 6: Commit**

```bash
git add apps/web/src/app/(teacher)/teacher/grades/page.tsx \
        apps/web/src/app/(teacher)/teacher/insights/page.tsx \
        apps/web/src/app/(teacher)/teacher/development/page.tsx \
        apps/web/src/app/(teacher)/teacher/classes/page.tsx \
        apps/web/src/app/(teacher)/teacher/evaluations/page.tsx
git commit -m "feat(web): restyle páginas teacher — notas, insights, desenvolvimento, turmas, avaliações"
```

---

### Task 4: Páginas coordinator batch 1 — classes, cycles, subjects, settings

**Files:**
- Modify: `apps/web/src/app/(coordinator)/coordinator/classes/page.tsx`
- Modify: `apps/web/src/app/(coordinator)/coordinator/cycles/page.tsx`
- Modify: `apps/web/src/app/(coordinator)/coordinator/subjects/page.tsx`
- Modify: `apps/web/src/app/(coordinator)/coordinator/settings/page.tsx`

**Context:** Read all 4 files. These pages have custom modals and hardcoded alert colors.

**classes/page.tsx (443 lines, complex):**
- Large file with 3 embedded form panels (NewClassForm, EnrollPanel, AssignPanel)
- Replace inline form overlays with Radix `<Dialog>` where appropriate
- Replace `<select>` styling: add EduPulse classes (bg-input, focus:border-primary, rounded-lg)
- Replace button styling throughout with `<Button>` component
- Replace status/role badges with `<Chip>`

**cycles/page.tsx (252 lines):**
- Replace hardcoded alert colors:
  - `bg-green-50 border-green-200 text-green-800` → `bg-success/10 border-success/30 text-success`
  - `bg-amber-50 border-amber-200 text-amber-700` → `bg-warning/10 border-warning/30 text-warning`
- Replace status badges (ACTIVE, CLOSED, etc.) with `<Chip>`
- Replace "Criar ciclo" button with `<Button variant="primary">`

**subjects/page.tsx (300 lines):**
- Replace 3 custom modal/dialog divs with Radix `<Dialog>`
- Replace "Criar disciplina" button with `<Button variant="primary">`
- Apply EduPulse input styles to search input

**settings/page.tsx (272 lines):**
- Tab navigation: replace raw border-bottom tabs with styled tabs using CSS vars
- Active tab: `border-b-2 border-primary text-primary font-semibold`
- Inactive tab: `text-muted-foreground hover:text-foreground`
- Replace form submit button with `<Button variant="primary">`
- Replace plan status badge with `<Chip>`

- [ ] **Step 1: Read all 4 files**

- [ ] **Step 2: Restyle classes/page.tsx**

Key changes:
```tsx
import { Button } from "@/components/ui/button";
import { Chip } from "@/components/ui/chip";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
```

For inline `<select>` elements, apply:
```tsx
className="w-full rounded-lg border border-outline-variant bg-input px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:bg-card focus:border-primary"
```

Replace action buttons with `<Button>`. Replace inline form panels that use fixed overlay div with `<Dialog>`.

- [ ] **Step 3: Restyle cycles/page.tsx**

Replace alert color classes:
```tsx
// Active cycle card header:
className="rounded-t-xl bg-success/10 border-b border-success/30 px-5 py-3"
// Closed:
className="rounded-t-xl bg-surface-container border-b border-outline-variant px-5 py-3"
// Warning state:
className="rounded-xl border border-warning/30 bg-warning/10 p-4"
```

Replace cycle status with `<Chip>`:
```tsx
function cycleStatusVariant(status: string): "success" | "warning" | "neutral" | "danger" {
  if (status === "ACTIVE") return "success";
  if (status === "UPCOMING") return "warning";
  if (status === "CLOSED") return "neutral";
  return "neutral";
}
```

- [ ] **Step 4: Restyle subjects/page.tsx**

Replace 3 custom modal divs with `<Dialog>`. Apply EduPulse input styling.

- [ ] **Step 5: Restyle settings/page.tsx**

Apply tab styling and Button component for form submit.

- [ ] **Step 6: Typecheck**

```bash
export PATH="/c/Program Files/nodejs:$PATH"
pnpm --filter web typecheck 2>&1 | tail -10
```

- [ ] **Step 7: Commit**

```bash
git add apps/web/src/app/(coordinator)/coordinator/classes/page.tsx \
        apps/web/src/app/(coordinator)/coordinator/cycles/page.tsx \
        apps/web/src/app/(coordinator)/coordinator/subjects/page.tsx \
        apps/web/src/app/(coordinator)/coordinator/settings/page.tsx
git commit -m "feat(web): restyle coordinator — turmas, ciclos, disciplinas, configurações"
```

---

### Task 5: Páginas coordinator batch 2 — benchmarking, reports, teachers

**Files:**
- Modify: `apps/web/src/app/(coordinator)/coordinator/benchmarking/page.tsx`
- Modify: `apps/web/src/app/(coordinator)/coordinator/reports/page.tsx`
- Modify: `apps/web/src/app/(coordinator)/coordinator/teachers/page.tsx`
- Modify: `apps/web/src/app/(coordinator)/coordinator/teachers/[id]/page.tsx`

**Context:** Read all 4 files. These pages have Recharts charts and inline color functions.

**benchmarking/page.tsx (296 lines):**
- Wire `useChartColors()` to the BarChart
- Replace `scoreColor()` inline function with `scoreVariant()` + `<Chip>`
- Replace hardcoded tooltip styling with CSS var equivalents
- Wrap main content sections in `<Card>`

**reports/page.tsx (402 lines):**
- Replace `scoreColor()` with `scoreVariant()` + `<Chip>` for `ScoreCell`
- Replace tab filter buttons with consistent styling (active: `bg-primary text-on-primary`, inactive: `bg-surface-container text-foreground hover:bg-surface-container/80`)
- Replace filter/action buttons with `<Button>`
- Wrap table in `<Card noPadding>`

**teachers/page.tsx (170 lines):**
- Replace `ScoreBadge` and `PlanBadge` inline components with `<Chip>`
- Wrap teacher list in `<Card noPadding>`
- Apply EduPulse input styles to search

**teachers/[id]/page.tsx (421 lines):**
- Wire `useChartColors()` to LineChart and BarChart
- Replace `StatusBadge` and `PlanBadge` inline components with `<Chip>`
- Replace hardcoded chart tooltip inline styles with CSS var equivalents
- Wrap profile card and sections in `<Card>`

- [ ] **Step 1: Read all 4 files**

- [ ] **Step 2: Restyle benchmarking/page.tsx**

```tsx
import { useChartColors } from "@/lib/chart-colors";
import { Chip } from "@/components/ui/chip";
import { Card } from "@/components/ui/card";
import { scoreVariant } from "@/lib/score-color";

const chartColors = useChartColors();
```

Remove `scoreColor()` function. Replace `<ScoreBadge>` inline component with `<Chip variant={scoreVariant(score)}>`.

Wire chart tooltip:
```tsx
contentStyle={{
  borderRadius: "8px",
  border: `1px solid ${chartColors.gridLine}`,
  background: "var(--surface)",
  color: "var(--foreground)",
  fontSize: "13px",
}}
```

- [ ] **Step 3: Restyle reports/page.tsx**

Replace `scoreColor()` + inline badge divs with `<Chip variant={scoreVariant(score)}>`.

Tab button styling pattern:
```tsx
className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
  activeTab === tab
    ? "bg-primary text-on-primary"
    : "text-muted-foreground hover:bg-surface-container"
}`}
```

Wrap table in `<Card noPadding>`.

- [ ] **Step 4: Restyle teachers/page.tsx**

Replace inline `ScoreBadge` and `PlanBadge` components with `<Chip>`. Apply input styling.

- [ ] **Step 5: Restyle teachers/[id]/page.tsx**

Wire charts to `useChartColors()`. Replace inline badge components with `<Chip>`. Wrap sections in `<Card>`.

- [ ] **Step 6: Typecheck**

```bash
export PATH="/c/Program Files/nodejs:$PATH"
pnpm --filter web typecheck 2>&1 | tail -10
```

- [ ] **Step 7: Commit**

```bash
git add apps/web/src/app/(coordinator)/coordinator/benchmarking/page.tsx \
        apps/web/src/app/(coordinator)/coordinator/reports/page.tsx \
        apps/web/src/app/(coordinator)/coordinator/teachers/page.tsx \
        "apps/web/src/app/(coordinator)/coordinator/teachers/[id]/page.tsx"
git commit -m "feat(web): restyle coordinator — benchmarking, relatórios, professores"
```

---

### Task 6: Páginas admin — audit, metrics, privacy

**Files:**
- Modify: `apps/web/src/app/(admin)/admin/audit/page.tsx`
- Modify: `apps/web/src/app/(admin)/admin/metrics/page.tsx`
- Modify: `apps/web/src/app/(admin)/admin/privacy/page.tsx`

**Context:** Read all 3 files.

**audit/page.tsx (152 lines):**
- Replace inline `methodTone()` function (returns `bg-X-100 text-X-700`) with `<Chip>`
- HTTP method → chip variant: GET→info, POST→success, PUT/PATCH→warning, DELETE→danger
- Wrap filter form and table in `<Card>` / `<Card noPadding>`
- Apply EduPulse input styling to filter inputs
- Replace action buttons with `<Button>`

**metrics/page.tsx (198 lines):**
- Replace inline progress bar divs (`<div style={{ width: X% }}>`) with `<ProgressBar>`
- Replace refresh button with `<Button variant="ghost">`
- Wrap sections in `<Card>`

**privacy/page.tsx (260 lines):**
- Replace hardcoded status badge colors (`yellow-100`, `blue-100`, `green-100`, `red-100`) with `<Chip>`:
  - PENDING→warning, PROCESSING→info, COMPLETED→success, REJECTED→danger
- Replace filter toggle buttons with consistent styling
- Replace action buttons (approve/reject/view) with `<Button>`
- Wrap table in `<Card noPadding>`

- [ ] **Step 1: Read all 3 files**

- [ ] **Step 2: Restyle audit/page.tsx**

```tsx
import { Chip } from "@/components/ui/chip";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

function methodVariant(method: string): "info" | "success" | "warning" | "danger" | "neutral" {
  if (method === "GET") return "info";
  if (method === "POST") return "success";
  if (method === "PUT" || method === "PATCH") return "warning";
  if (method === "DELETE") return "danger";
  return "neutral";
}
```

Replace filter inputs with EduPulse input styling. Wrap table in `<Card noPadding>`.

- [ ] **Step 3: Restyle metrics/page.tsx**

```tsx
import { ProgressBar } from "@/components/ui/progress-bar";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
```

Replace inline `<div style={{ width: ... }}>` progress bars with `<ProgressBar value={count} max={total} variant="info" />`.

- [ ] **Step 4: Restyle privacy/page.tsx**

```tsx
function privacyStatusVariant(status: string): "warning" | "info" | "success" | "danger" {
  if (status === "PENDING") return "warning";
  if (status === "PROCESSING") return "info";
  if (status === "COMPLETED") return "success";
  if (status === "REJECTED") return "danger";
  return "neutral";
}
```

Replace filter button active styling with CSS var tokens. Wrap table in `<Card noPadding>`.

- [ ] **Step 5: Typecheck**

```bash
export PATH="/c/Program Files/nodejs:$PATH"
pnpm --filter web typecheck 2>&1 | tail -10
```

- [ ] **Step 6: Commit**

```bash
git add apps/web/src/app/(admin)/admin/audit/page.tsx \
        apps/web/src/app/(admin)/admin/metrics/page.tsx \
        apps/web/src/app/(admin)/admin/privacy/page.tsx
git commit -m "feat(web): restyle páginas admin — auditoria, métricas, privacidade"
```

---

### Task 7: Validação final + lint

**Files:** None (validation only)

- [ ] **Step 1: Full typecheck**

```bash
export PATH="/c/Program Files/nodejs:$PATH"
pnpm --filter api typecheck && pnpm --filter web typecheck
```

Expected: 0 errors in both.

- [ ] **Step 2: Lint**

```bash
pnpm --filter web lint
```

Expected: 0 errors.

- [ ] **Step 3: Fix any remaining issues**

Common issues to watch:
- `scoreVariant` import missing in some files
- `useChartColors` used in a file that's not a client component
- `Dialog` / `DialogTitle` not exported from dialog.tsx for some usage pattern
- `ProgressBar` max prop expects number

- [ ] **Step 4: Commit if needed**

```bash
git add -A
git commit -m "fix(web): ajustes finais Wave 3 — typecheck + lint"
```

---

## Key implementation notes

1. **scoreVariant(score)** — the score scale is 0-100 for analytics (≥70 success, ≥50 warning, <50 danger). For grades (0-10), multiply: `scoreVariant(grade * 10)`.

2. **Modal vs Dialog** — use Radix `<Dialog>` (from `ui/dialog.tsx`) for all new modal migrations. The old `modal.tsx` is fine to keep for pages that already use it, but new modal work should use Dialog.

3. **Chart tooltips** — always pass:
```tsx
contentStyle={{
  borderRadius: "8px",
  border: `1px solid ${chartColors.gridLine}`,
  background: "var(--surface)",
  color: "var(--foreground)",
  fontSize: "13px",
}}
```

4. **Tab buttons** — consistent active/inactive pattern:
```tsx
className={cn(
  "px-4 py-2 text-sm font-medium rounded-lg transition-colors",
  isActive ? "bg-primary text-on-primary" : "text-muted-foreground hover:bg-surface-container"
)}
```

5. **Select inputs** — style all `<select>` elements with:
```tsx
className="w-full rounded-lg border border-outline-variant bg-input px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring appearance-none"
```

6. **Don't add features** — restyle only. Keep all existing data-fetching, mutations, form validation, and business logic intact.

7. **ProgressBar in metrics** — the metrics page uses inline progress bars for percentage counts. Use `<ProgressBar value={count} max={total} variant="info" />`. Check that `ProgressBar` accepts `max` prop.
