# EduPulse Redesign — Wave 1: Foundation Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Substituir o sistema visual atual do GOSF (navy/teal/amber + Plus Jakarta Sans) pelo novo design system EduPulse (marrom/azul + Lexend) com suporte a dark/light mode togglable, e refatorar as páginas auth para o novo visual.

**Architecture:** Tokens CSS em `globals.css` (com classe `.dark` para dark mode), mapeados em `tailwind.config.ts` via CSS vars. ThemeProvider via `next-themes` (resolve FOUC SSR e persistência). Componentes refatorados/novos em `apps/web/src/components/ui/`. Radix Primitives encapsulados como wrappers para a11y sem adotar shadcn/ui.

**Tech Stack:** Next.js 15 + React 19 + Tailwind CSS + next-themes + @radix-ui/react-* + Lexend (next/font/google) + lucide-react.

**Spec:** [docs/superpowers/specs/2026-05-02-edupulse-redesign-design.md](../specs/2026-05-02-edupulse-redesign-design.md)

---

## File Map

**Criar:**
- `apps/web/src/components/ui/Card.tsx`
- `apps/web/src/components/ui/StatCard.tsx`
- `apps/web/src/components/ui/InsightCard.tsx`
- `apps/web/src/components/ui/Input.tsx`
- `apps/web/src/components/ui/ProgressBar.tsx`
- `apps/web/src/components/ui/Avatar.tsx`
- `apps/web/src/components/ui/ThemeToggle.tsx`
- `apps/web/src/components/ui/Dialog.tsx` (Radix wrapper)
- `apps/web/src/components/ui/DropdownMenu.tsx` (Radix wrapper)
- `apps/web/src/components/ui/Popover.tsx` (Radix wrapper)
- `apps/web/src/components/ui/Tooltip.tsx` (Radix wrapper)
- `apps/web/src/components/providers/ThemeProvider.tsx`
- `apps/web/src/lib/avatar-color.ts`

**Modificar:**
- `apps/web/src/app/globals.css` (substituir todos os tokens OKLCH pelo novo conjunto + dark mode)
- `apps/web/tailwind.config.ts` (mapear novas CSS vars)
- `apps/web/src/app/layout.tsx` (carregar Lexend, envolver em ThemeProvider)
- `apps/web/src/components/ui/button.tsx` (refatorar para novos tokens + variants)
- `apps/web/src/components/ui/badge.tsx` → renomear para `Chip.tsx` e refatorar
- `apps/web/src/components/dashboard/sidebar.tsx` (restyle completo)
- `apps/web/src/components/dashboard/top-bar.tsx` (restyle completo)
- `apps/web/src/app/(auth)/login/page.tsx` (restyle)
- `apps/web/src/features/auth/login-form.tsx` (atualizar inputs/button)
- `apps/web/src/app/(auth)/register/page.tsx` (restyle se existir)
- `apps/web/src/app/(auth)/forgot-password/page.tsx` (restyle)
- `apps/web/src/app/(auth)/reset-password/page.tsx` (restyle)
- `apps/web/src/app/pricing/page.tsx` (restyle)
- Todos os usos de `<Badge>` → `<Chip>` (busca global)

**Adicionar deps:** `next-themes`, `@radix-ui/react-dialog`, `@radix-ui/react-dropdown-menu`, `@radix-ui/react-popover`, `@radix-ui/react-tooltip`

---

## Task 1: Setup do worktree

**Files:** (apenas comandos)

- [ ] **Step 1: Criar worktree**

```bash
cd C:\Users\LENOVO\NikProjects\GOSF
git worktree add .worktrees/edupulse-foundation -b feat/edupulse-foundation
cd .worktrees/edupulse-foundation
```

Expected: `Preparing worktree (new branch 'feat/edupulse-foundation')` sem erros.

- [ ] **Step 2: Copiar arquivos .env (não trackeados pelo git)**

```bash
cp ../../packages/database/.env packages/database/.env
cp ../../apps/api/.env apps/api/.env
cp ../../apps/web/.env.local apps/web/.env.local
```

- [ ] **Step 3: Instalar deps**

```powershell
$env:PATH = "C:\Program Files\nodejs;" + $env:PATH
cmd /c "pnpm install 2>&1" | Select-Object -Last 5
```

Expected: `Done in Xs using pnpm v10.33.0`.

- [ ] **Step 4: Verificar baseline**

```powershell
cd apps/web
cmd /c "node_modules\.bin\tsc.CMD --noEmit"
echo "tsc exit: $LASTEXITCODE"
```

Expected: `tsc exit: 0`.

---

## Task 2: Instalar dependências do EduPulse

**Files:**
- Modify: `apps/web/package.json` (via pnpm add)
- Modify: `pnpm-lock.yaml` (gerado automaticamente)

- [ ] **Step 1: Instalar next-themes e Radix Primitives**

```powershell
cd C:\Users\LENOVO\NikProjects\GOSF\.worktrees\edupulse-foundation
$env:PATH = "C:\Program Files\nodejs;" + $env:PATH
cmd /c "pnpm --filter web add next-themes @radix-ui/react-dialog @radix-ui/react-dropdown-menu @radix-ui/react-popover @radix-ui/react-tooltip 2>&1" | Select-Object -Last 10
```

Expected: `Done in Xs` sem erros de peer dependency. Pacotes adicionados em `apps/web/package.json` dependencies.

- [ ] **Step 2: Commit**

```bash
git add apps/web/package.json pnpm-lock.yaml
git commit -m "chore(web): adicionar next-themes e Radix Primitives para Wave 1"
```

---

## Task 3: Configurar Lexend como fonte global

**Files:**
- Modify: `apps/web/src/app/layout.tsx`

- [ ] **Step 1: Carregar Lexend via next/font**

Substitua o conteúdo de `apps/web/src/app/layout.tsx` para usar Lexend. Localize a importação atual de fonte (provavelmente Plus Jakarta Sans) e substitua:

```typescript
import { Lexend } from "next/font/google";

const lexend = Lexend({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-lexend",
  weight: ["400", "500", "600", "700"],
});
```

E aplique no `<html>` ou `<body>`:

```tsx
<html lang="pt-BR" className={lexend.variable}>
  <body className="font-sans antialiased">
    ...
  </body>
</html>
```

- [ ] **Step 2: Atualizar tailwind.config.ts pra usar Lexend como sans**

Em `apps/web/tailwind.config.ts`, no `theme.extend.fontFamily`:

```typescript
fontFamily: {
  sans: ["var(--font-lexend)", "system-ui", "sans-serif"],
},
```

(Substitua qualquer referência a Plus Jakarta Sans existente.)

- [ ] **Step 3: Verificar visualmente que Lexend carrega**

```powershell
cd apps/web
cmd /c "pnpm dev" # OU pnpm --filter web dev na raiz
```

Abra `http://localhost:3002/login` e confirme que a fonte mudou (Lexend tem letras um pouco mais arredondadas que Plus Jakarta Sans, mais "amigável"). Se ainda usar a fonte antiga, limpe cache: `rm -rf apps/web/.next` e rode dev de novo.

- [ ] **Step 4: Commit**

```bash
git add apps/web/src/app/layout.tsx apps/web/tailwind.config.ts
git commit -m "feat(web): substituir Plus Jakarta Sans por Lexend"
```

---

## Task 4: Substituir tokens CSS — Light mode

**Files:**
- Modify: `apps/web/src/app/globals.css`

- [ ] **Step 1: Localizar bloco de tokens atual**

Em `apps/web/src/app/globals.css` há uma seção com tokens OKLCH (do redesign anterior — navy/teal/amber). Identifique e remova esse bloco completo (geralmente dentro de `:root { ... }`).

- [ ] **Step 2: Adicionar novos tokens light mode**

Substitua pelo novo conjunto:

```css
:root {
  /* Cores primárias e variantes — EduPulse light mode */
  --primary: #703e0e;
  --primary-foreground: #ffffff;
  --primary-container: #ffdcc3;
  --on-primary-container: #2f1500;

  --secondary: #0061a5;
  --secondary-foreground: #ffffff;
  --secondary-container: #d2e4ff;
  --on-secondary-container: #001d37;

  --tertiary: #6c4100;
  --tertiary-foreground: #ffffff;
  --tertiary-container: #ffddba;
  --on-tertiary-container: #2b1700;

  /* Surfaces */
  --background: #f8f9ff;
  --foreground: #0d1c2e;
  --surface: #ffffff;
  --surface-container: #e5eeff;
  --surface-container-high: #dce9ff;
  --surface-container-low: #eff4ff;
  --on-surface: #0d1c2e;
  --on-surface-variant: #52443a;

  /* Borders */
  --outline: #847469;
  --outline-variant: #d7c3b6;

  /* Estados semânticos */
  --error: #ba1a1a;
  --error-foreground: #ffffff;
  --error-container: #ffdad6;
  --on-error-container: #93000a;

  --success: #2e7d32;
  --success-foreground: #ffffff;
  --success-container: #c8e6c9;
  --on-success-container: #1b5e20;

  --warning: #ed6c02;
  --warning-foreground: #ffffff;
  --warning-container: #ffe0b2;
  --on-warning-container: #663d00;

  /* Aliases para compat com componentes que usam variável genérica */
  --muted: var(--surface-container);
  --muted-foreground: var(--on-surface-variant);
  --border: var(--outline-variant);
  --input: var(--surface-container);
  --ring: var(--primary);
  --card: var(--surface);
  --card-foreground: var(--on-surface);
  --popover: var(--surface);
  --popover-foreground: var(--on-surface);
  --accent: var(--surface-container);
  --accent-foreground: var(--on-surface);
  --destructive: var(--error);
  --destructive-foreground: var(--error-foreground);

  /* Tipografia */
  --font-sans: var(--font-lexend), system-ui, sans-serif;

  /* Radius */
  --radius-sm: 0.25rem;
  --radius: 0.5rem;
  --radius-md: 0.75rem;
  --radius-lg: 1rem;
  --radius-xl: 1.5rem;
  --radius-pill: 9999px;
}
```

- [ ] **Step 3: Commit**

```bash
git add apps/web/src/app/globals.css
git commit -m "feat(web): tokens CSS do EduPulse — light mode"
```

---

## Task 5: Adicionar tokens — Dark mode

**Files:**
- Modify: `apps/web/src/app/globals.css`

- [ ] **Step 1: Adicionar bloco .dark após o :root**

Em `apps/web/src/app/globals.css`, após o bloco `:root { ... }`, adicione:

```css
.dark {
  /* Cores primárias — EduPulse dark mode (inverse-* tokens) */
  --primary: #ffb77f;
  --primary-foreground: #2f1500;
  --primary-container: #6c3a0a;
  --on-primary-container: #ffdcc3;

  --secondary: #9fcaff;
  --secondary-foreground: #001d37;
  --secondary-container: #00497e;
  --on-secondary-container: #d2e4ff;

  --tertiary: #ffb866;
  --tertiary-foreground: #2b1700;
  --tertiary-container: #673d00;
  --on-tertiary-container: #ffddba;

  /* Surfaces (dark navy) */
  --background: #0d1c2e;
  --foreground: #eaf1ff;
  --surface: #223144;
  --surface-container: #2c3a4d;
  --surface-container-high: #354357;
  --surface-container-low: #1a2940;
  --on-surface: #eaf1ff;
  --on-surface-variant: #aab4c2;

  /* Borders */
  --outline: #5c6a7d;
  --outline-variant: #3a4759;

  /* Estados semânticos (cores ajustadas pra dark) */
  --error: #ffb4ab;
  --error-foreground: #690005;
  --error-container: #93000a;
  --on-error-container: #ffdad6;

  --success: #81c784;
  --success-foreground: #0c2d10;
  --success-container: #1b5e20;
  --on-success-container: #c8e6c9;

  --warning: #ffb74d;
  --warning-foreground: #663d00;
  --warning-container: #663d00;
  --on-warning-container: #ffe0b2;

  /* Aliases (mesmos do :root, herdam do dark) */
  --muted: var(--surface-container);
  --muted-foreground: var(--on-surface-variant);
  --border: var(--outline-variant);
  --input: var(--surface-container);
  --ring: var(--primary);
  --card: var(--surface);
  --card-foreground: var(--on-surface);
  --popover: var(--surface);
  --popover-foreground: var(--on-surface);
  --accent: var(--surface-container);
  --accent-foreground: var(--on-surface);
  --destructive: var(--error);
  --destructive-foreground: var(--error-foreground);
}
```

- [ ] **Step 2: Atualizar tailwind.config.ts pra mapear todas as cores via CSS vars**

Substitua o `theme.extend.colors` em `apps/web/tailwind.config.ts`:

```typescript
colors: {
  background: "var(--background)",
  foreground: "var(--foreground)",
  primary: {
    DEFAULT: "var(--primary)",
    foreground: "var(--primary-foreground)",
    container: "var(--primary-container)",
  },
  secondary: {
    DEFAULT: "var(--secondary)",
    foreground: "var(--secondary-foreground)",
    container: "var(--secondary-container)",
  },
  tertiary: {
    DEFAULT: "var(--tertiary)",
    foreground: "var(--tertiary-foreground)",
    container: "var(--tertiary-container)",
  },
  surface: {
    DEFAULT: "var(--surface)",
    container: "var(--surface-container)",
    "container-high": "var(--surface-container-high)",
    "container-low": "var(--surface-container-low)",
  },
  muted: {
    DEFAULT: "var(--muted)",
    foreground: "var(--muted-foreground)",
  },
  card: {
    DEFAULT: "var(--card)",
    foreground: "var(--card-foreground)",
  },
  popover: {
    DEFAULT: "var(--popover)",
    foreground: "var(--popover-foreground)",
  },
  border: "var(--border)",
  input: "var(--input)",
  ring: "var(--ring)",
  outline: {
    DEFAULT: "var(--outline)",
    variant: "var(--outline-variant)",
  },
  destructive: {
    DEFAULT: "var(--destructive)",
    foreground: "var(--destructive-foreground)",
  },
  error: {
    DEFAULT: "var(--error)",
    foreground: "var(--error-foreground)",
    container: "var(--error-container)",
  },
  success: {
    DEFAULT: "var(--success)",
    foreground: "var(--success-foreground)",
    container: "var(--success-container)",
  },
  warning: {
    DEFAULT: "var(--warning)",
    foreground: "var(--warning-foreground)",
    container: "var(--warning-container)",
  },
  accent: {
    DEFAULT: "var(--accent)",
    foreground: "var(--accent-foreground)",
  },
},
```

E adicione `darkMode: "class"` no topo do config (se não existir).

- [ ] **Step 3: Verificar que aplicar `.dark` no html funciona**

Em DevTools do browser, na página de login, adicione manualmente classe `.dark` ao `<html>`. As cores devem mudar (background fica navy, texto fica claro).

- [ ] **Step 4: Commit**

```bash
git add apps/web/src/app/globals.css apps/web/tailwind.config.ts
git commit -m "feat(web): tokens dark mode + mapeamento Tailwind via CSS vars"
```

---

## Task 6: ThemeProvider via next-themes

**Files:**
- Create: `apps/web/src/components/providers/ThemeProvider.tsx`
- Modify: `apps/web/src/app/layout.tsx`

- [ ] **Step 1: Criar wrapper do ThemeProvider**

Crie `apps/web/src/components/providers/ThemeProvider.tsx`:

```typescript
"use client";

import { ThemeProvider as NextThemesProvider } from "next-themes";
import { ReactNode } from "react";

export function ThemeProvider({ children }: { children: ReactNode }) {
  return (
    <NextThemesProvider
      attribute="class"
      defaultTheme="light"
      enableSystem={false}
      storageKey="gosf-theme"
      disableTransitionOnChange
    >
      {children}
    </NextThemesProvider>
  );
}
```

- [ ] **Step 2: Envolver o layout.tsx**

Em `apps/web/src/app/layout.tsx`, importe e envolva os children:

```typescript
import { ThemeProvider } from "@/components/providers/ThemeProvider";

// Dentro do <body>:
<body className="font-sans antialiased">
  <ThemeProvider>
    {/* outros providers existentes (TanStack Query, etc.) ficam DENTRO */}
    {children}
  </ThemeProvider>
</body>
```

- [ ] **Step 3: Adicionar suppressHydrationWarning no html**

```tsx
<html lang="pt-BR" className={lexend.variable} suppressHydrationWarning>
```

(Necessário porque next-themes injeta a classe `.dark` no client antes do hydration, gerando warning sem essa flag.)

- [ ] **Step 4: Verificar typecheck**

```powershell
cd apps/web
cmd /c "node_modules\.bin\tsc.CMD --noEmit"
echo "tsc: $LASTEXITCODE"
```

Expected: `tsc: 0`.

- [ ] **Step 5: Commit**

```bash
git add apps/web/src/components/providers/ThemeProvider.tsx apps/web/src/app/layout.tsx
git commit -m "feat(web): ThemeProvider via next-themes com persistência"
```

---

## Task 7: Componente ThemeToggle

**Files:**
- Create: `apps/web/src/components/ui/ThemeToggle.tsx`

- [ ] **Step 1: Criar o componente**

Crie `apps/web/src/components/ui/ThemeToggle.tsx`:

```typescript
"use client";

import { useTheme } from "next-themes";
import { Sun, Moon } from "lucide-react";
import { useEffect, useState } from "react";

export function ThemeToggle() {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => setMounted(true), []);

  if (!mounted) {
    return <div className="h-9 w-9" aria-hidden />;
  }

  const isDark = theme === "dark";

  return (
    <button
      onClick={() => setTheme(isDark ? "light" : "dark")}
      className="flex h-9 w-9 items-center justify-center rounded-lg text-muted-foreground hover:bg-surface-container hover:text-foreground transition-colors focus:outline-none focus:ring-2 focus:ring-ring"
      aria-label={isDark ? "Mudar para modo claro" : "Mudar para modo escuro"}
    >
      {isDark ? <Sun size={18} /> : <Moon size={18} />}
    </button>
  );
}
```

- [ ] **Step 2: Verificar typecheck**

```powershell
cmd /c "node_modules\.bin\tsc.CMD --noEmit"; echo "tsc: $LASTEXITCODE"
```

Expected: `tsc: 0`.

- [ ] **Step 3: Commit**

```bash
git add apps/web/src/components/ui/ThemeToggle.tsx
git commit -m "feat(web): componente ThemeToggle (sol/lua)"
```

---

## Task 8: Refatorar Button

**Files:**
- Modify: `apps/web/src/components/ui/button.tsx`

- [ ] **Step 1: Substituir conteúdo de button.tsx**

Substitua todo o conteúdo de `apps/web/src/components/ui/button.tsx`:

```typescript
import { ButtonHTMLAttributes, forwardRef } from "react";
import { cn } from "@/lib/cn";

type ButtonVariant = "primary" | "secondary" | "ghost" | "danger";
type ButtonSize = "sm" | "md" | "lg";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
}

const variantClasses: Record<ButtonVariant, string> = {
  primary:
    "bg-primary text-primary-foreground shadow-[0_2px_0_0_rgba(0,0,0,0.1)] hover:bg-primary/90 active:translate-y-[1px] active:shadow-none",
  secondary:
    "bg-transparent text-secondary border border-secondary hover:bg-secondary/5",
  ghost:
    "bg-transparent text-foreground hover:bg-surface-container",
  danger:
    "bg-destructive text-destructive-foreground hover:bg-destructive/90",
};

const sizeClasses: Record<ButtonSize, string> = {
  sm: "h-8 px-3 text-sm",
  md: "h-10 px-4 text-sm",
  lg: "h-12 px-6 text-base",
};

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ variant = "primary", size = "md", className, ...props }, ref) => {
    return (
      <button
        ref={ref}
        className={cn(
          "inline-flex items-center justify-center gap-2 rounded-lg font-semibold transition-all",
          "focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 focus:ring-offset-background",
          "disabled:opacity-50 disabled:pointer-events-none",
          variantClasses[variant],
          sizeClasses[size],
          className,
        )}
        {...props}
      />
    );
  },
);
Button.displayName = "Button";
```

- [ ] **Step 2: Verificar typecheck e usos**

```powershell
cmd /c "node_modules\.bin\tsc.CMD --noEmit"; echo "tsc: $LASTEXITCODE"
```

Expected: `tsc: 0`. Se houver erros em arquivos que usam `<Button>`, é porque a API mudou. Verifique props específicas que podem ter sumido (ex: variant antiga `teal`, `amber`). Substitua nesses arquivos por `primary`, `secondary` ou similar.

- [ ] **Step 3: Commit**

```bash
git add apps/web/src/components/ui/button.tsx
git commit -m "feat(web): refatorar Button para variants EduPulse com border-shadow tactile"
```

---

## Task 9: Renomear Badge → Chip

**Files:**
- Create: `apps/web/src/components/ui/chip.tsx`
- Delete: `apps/web/src/components/ui/badge.tsx`
- Modify: todos os usos de `<Badge>` no codebase

- [ ] **Step 1: Criar Chip.tsx**

Crie `apps/web/src/components/ui/chip.tsx`:

```typescript
import { HTMLAttributes, forwardRef } from "react";
import { cn } from "@/lib/cn";

type ChipVariant = "success" | "warning" | "danger" | "info" | "neutral";

interface ChipProps extends HTMLAttributes<HTMLSpanElement> {
  variant?: ChipVariant;
}

const variantClasses: Record<ChipVariant, string> = {
  success: "bg-success-container text-on-success-container",
  warning: "bg-warning-container text-on-warning-container",
  danger: "bg-error-container text-on-error-container",
  info: "bg-secondary-container text-on-secondary-container",
  neutral: "bg-surface-container text-on-surface-variant",
};

export const Chip = forwardRef<HTMLSpanElement, ChipProps>(
  ({ variant = "neutral", className, ...props }, ref) => {
    return (
      <span
        ref={ref}
        className={cn(
          "inline-flex items-center gap-1 rounded-full px-3 py-1 text-xs font-semibold",
          variantClasses[variant],
          className,
        )}
        {...props}
      />
    );
  },
);
Chip.displayName = "Chip";
```

**Nota:** as classes `text-on-success-container` etc. ainda não existem no Tailwind. Adicione no `tailwind.config.ts` em `theme.extend.colors`:

```typescript
"on-success-container": "var(--on-success-container)",
"on-warning-container": "var(--on-warning-container)",
"on-error-container": "var(--on-error-container)",
"on-secondary-container": "var(--on-secondary-container)",
"on-surface-variant": "var(--on-surface-variant)",
```

(Ou alternativamente, simplifique definindo `success: { DEFAULT, foreground, container }` etc. e usando `text-success-foreground`. Escolha o estilo consistente com o que já tem.)

- [ ] **Step 2: Buscar e substituir todos os usos de Badge**

```bash
grep -rn "from \"@/components/ui/badge\"" apps/web/src --include="*.tsx" --include="*.ts"
grep -rn "<Badge" apps/web/src --include="*.tsx"
```

Para cada arquivo encontrado, troque:
- Import: `from "@/components/ui/badge"` → `from "@/components/ui/chip"`
- JSX: `<Badge variant="..."` → `<Chip variant="..."` (mapeando variants antigas pra novas: `teal`→`info`, `amber`→`warning`, etc.)

- [ ] **Step 3: Deletar badge.tsx**

```bash
rm apps/web/src/components/ui/badge.tsx
```

- [ ] **Step 4: Verificar typecheck**

```powershell
cmd /c "node_modules\.bin\tsc.CMD --noEmit"; echo "tsc: $LASTEXITCODE"
```

Expected: `tsc: 0`. Se houver erros, são imports/usos faltando ser convertidos.

- [ ] **Step 5: Commit**

```bash
git add -A
git commit -m "feat(web): renomear Badge para Chip + variants semânticas"
```

---

## Task 10: Componente Card

**Files:**
- Create: `apps/web/src/components/ui/card.tsx`

- [ ] **Step 1: Criar Card**

Crie `apps/web/src/components/ui/card.tsx`:

```typescript
import { HTMLAttributes, forwardRef } from "react";
import { cn } from "@/lib/cn";

interface CardProps extends HTMLAttributes<HTMLDivElement> {
  noPadding?: boolean;
}

export const Card = forwardRef<HTMLDivElement, CardProps>(
  ({ noPadding, className, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn(
          "rounded-2xl border border-outline-variant bg-card text-card-foreground shadow-[0_8px_16px_rgba(0,0,0,0.02)]",
          !noPadding && "p-6",
          className,
        )}
        {...props}
      />
    );
  },
);
Card.displayName = "Card";

export const CardHeader = forwardRef<HTMLDivElement, HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div ref={ref} className={cn("mb-4 flex items-start justify-between gap-3", className)} {...props} />
  ),
);
CardHeader.displayName = "CardHeader";

export const CardTitle = forwardRef<HTMLHeadingElement, HTMLAttributes<HTMLHeadingElement>>(
  ({ className, ...props }, ref) => (
    <h3 ref={ref} className={cn("text-lg font-semibold text-foreground", className)} {...props} />
  ),
);
CardTitle.displayName = "CardTitle";

export const CardDescription = forwardRef<HTMLParagraphElement, HTMLAttributes<HTMLParagraphElement>>(
  ({ className, ...props }, ref) => (
    <p ref={ref} className={cn("text-sm text-muted-foreground", className)} {...props} />
  ),
);
CardDescription.displayName = "CardDescription";
```

- [ ] **Step 2: Verificar typecheck**

```powershell
cmd /c "node_modules\.bin\tsc.CMD --noEmit"; echo "tsc: $LASTEXITCODE"
```

Expected: `tsc: 0`.

- [ ] **Step 3: Commit**

```bash
git add apps/web/src/components/ui/card.tsx
git commit -m "feat(web): componente Card base + Header/Title/Description"
```

---

## Task 11: StatCard

**Files:**
- Create: `apps/web/src/components/ui/stat-card.tsx`

- [ ] **Step 1: Criar StatCard**

Crie `apps/web/src/components/ui/stat-card.tsx`:

```typescript
import { ReactNode } from "react";
import { TrendingUp, TrendingDown } from "lucide-react";
import { Card } from "./card";
import { Chip } from "./chip";
import { cn } from "@/lib/cn";

interface StatCardProps {
  icon?: ReactNode;
  label: string;
  value: string | number;
  trend?: { value: string; direction: "up" | "down" | "neutral" };
  badge?: { text: string; variant?: "success" | "warning" | "danger" | "info" | "neutral" };
  className?: string;
}

export function StatCard({ icon, label, value, trend, badge, className }: StatCardProps) {
  return (
    <Card className={cn("space-y-3", className)}>
      <div className="flex items-start justify-between">
        {icon && (
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-surface-container text-on-surface-variant">
            {icon}
          </div>
        )}
        {badge && <Chip variant={badge.variant ?? "neutral"}>{badge.text}</Chip>}
      </div>

      <div>
        <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          {label}
        </p>
        <p className="mt-1 text-3xl font-bold text-foreground">{value}</p>
      </div>

      {trend && (
        <div className="flex items-center gap-1 text-xs font-medium">
          {trend.direction === "up" && <TrendingUp size={12} className="text-success" />}
          {trend.direction === "down" && <TrendingDown size={12} className="text-error" />}
          <span
            className={cn(
              trend.direction === "up" && "text-success",
              trend.direction === "down" && "text-error",
              trend.direction === "neutral" && "text-muted-foreground",
            )}
          >
            {trend.value}
          </span>
        </div>
      )}
    </Card>
  );
}
```

- [ ] **Step 2: Verificar typecheck**

```powershell
cmd /c "node_modules\.bin\tsc.CMD --noEmit"; echo "tsc: $LASTEXITCODE"
```

Expected: `tsc: 0`.

- [ ] **Step 3: Commit**

```bash
git add apps/web/src/components/ui/stat-card.tsx
git commit -m "feat(web): StatCard com ícone, badge e trend"
```

---

## Task 12: InsightCard

**Files:**
- Create: `apps/web/src/components/ui/insight-card.tsx`

- [ ] **Step 1: Criar InsightCard**

Crie `apps/web/src/components/ui/insight-card.tsx`:

```typescript
import { ReactNode } from "react";
import { Sparkles } from "lucide-react";
import { Button } from "./button";
import { cn } from "@/lib/cn";

interface InsightCardProps {
  variant?: "primary" | "tertiary";
  label: string;
  title: string;
  description?: string;
  subItems?: { label: string; text: string }[];
  cta?: { text: string; onClick: () => void };
  icon?: ReactNode;
  className?: string;
}

const variantClasses = {
  primary: "bg-primary text-primary-foreground",
  tertiary: "bg-tertiary-container text-on-tertiary-container",
};

export function InsightCard({
  variant = "primary",
  label,
  title,
  description,
  subItems,
  cta,
  icon = <Sparkles size={16} />,
  className,
}: InsightCardProps) {
  const isOnPrimary = variant === "primary";

  return (
    <div
      className={cn(
        "rounded-2xl p-6 space-y-4 shadow-[0_8px_16px_rgba(0,0,0,0.04)]",
        variantClasses[variant],
        className,
      )}
    >
      <div className="flex items-center gap-2">
        {icon}
        <span className="text-xs font-semibold uppercase tracking-wider opacity-90">
          {label}
        </span>
      </div>

      <h3 className="text-xl font-bold leading-tight">{title}</h3>

      {description && (
        <p className={cn("text-sm leading-relaxed", isOnPrimary ? "opacity-90" : "opacity-80")}>
          {description}
        </p>
      )}

      {subItems && subItems.length > 0 && (
        <div className="space-y-2">
          {subItems.map((item, i) => (
            <div
              key={i}
              className={cn(
                "rounded-lg p-3",
                isOnPrimary ? "bg-black/15" : "bg-white/40",
              )}
            >
              <p className="text-xs font-semibold uppercase tracking-wider opacity-70 mb-0.5">
                {item.label}
              </p>
              <p className="text-sm font-medium">{item.text}</p>
            </div>
          ))}
        </div>
      )}

      {cta && (
        <Button
          variant={isOnPrimary ? "secondary" : "primary"}
          onClick={cta.onClick}
          className={cn(
            "w-full",
            isOnPrimary && "bg-white text-primary border-white hover:bg-white/90",
          )}
        >
          {cta.text}
        </Button>
      )}
    </div>
  );
}
```

- [ ] **Step 2: Verificar typecheck**

```powershell
cmd /c "node_modules\.bin\tsc.CMD --noEmit"; echo "tsc: $LASTEXITCODE"
```

Expected: `tsc: 0`.

- [ ] **Step 3: Commit**

```bash
git add apps/web/src/components/ui/insight-card.tsx
git commit -m "feat(web): InsightCard com sub-itens e CTA"
```

---

## Task 13: Input

**Files:**
- Create: `apps/web/src/components/ui/input.tsx`

- [ ] **Step 1: Criar Input**

Crie `apps/web/src/components/ui/input.tsx`:

```typescript
import { InputHTMLAttributes, forwardRef } from "react";
import { cn } from "@/lib/cn";

export const Input = forwardRef<HTMLInputElement, InputHTMLAttributes<HTMLInputElement>>(
  ({ className, ...props }, ref) => {
    return (
      <input
        ref={ref}
        className={cn(
          "h-10 w-full rounded-lg border border-transparent bg-input px-3 text-sm text-foreground",
          "placeholder:text-muted-foreground",
          "focus:bg-card focus:border-primary focus:border-2 focus:outline-none",
          "disabled:opacity-50 disabled:cursor-not-allowed",
          "transition-colors",
          className,
        )}
        {...props}
      />
    );
  },
);
Input.displayName = "Input";
```

- [ ] **Step 2: Verificar typecheck**

```powershell
cmd /c "node_modules\.bin\tsc.CMD --noEmit"; echo "tsc: $LASTEXITCODE"
```

Expected: `tsc: 0`.

- [ ] **Step 3: Commit**

```bash
git add apps/web/src/components/ui/input.tsx
git commit -m "feat(web): Input com bg cinza claro → focus branco com border primary"
```

---

## Task 14: ProgressBar

**Files:**
- Create: `apps/web/src/components/ui/progress-bar.tsx`

- [ ] **Step 1: Criar ProgressBar**

Crie `apps/web/src/components/ui/progress-bar.tsx`:

```typescript
import { cn } from "@/lib/cn";

interface ProgressBarProps {
  value: number;
  max?: number;
  variant?: "primary" | "secondary" | "success" | "warning" | "danger";
  className?: string;
  showLabel?: boolean;
  thick?: boolean;
}

const variantClasses = {
  primary: "bg-primary",
  secondary: "bg-secondary",
  success: "bg-success",
  warning: "bg-warning",
  danger: "bg-error",
};

export function ProgressBar({
  value,
  max = 100,
  variant = "primary",
  className,
  showLabel = false,
  thick = false,
}: ProgressBarProps) {
  const pct = Math.max(0, Math.min(100, (value / max) * 100));
  const height = thick ? "h-3" : "h-2";

  return (
    <div className={cn("space-y-1", className)}>
      {showLabel && (
        <div className="flex justify-between text-xs">
          <span className="text-muted-foreground">{value} / {max}</span>
          <span className="font-semibold text-foreground">{pct.toFixed(0)}%</span>
        </div>
      )}
      <div className={cn("w-full rounded-full bg-surface-container", height)}>
        <div
          className={cn("rounded-full transition-all", height, variantClasses[variant])}
          style={{ width: `${pct}%` }}
          role="progressbar"
          aria-valuenow={value}
          aria-valuemax={max}
          aria-valuemin={0}
        />
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Verificar typecheck**

```powershell
cmd /c "node_modules\.bin\tsc.CMD --noEmit"; echo "tsc: $LASTEXITCODE"
```

Expected: `tsc: 0`.

- [ ] **Step 3: Commit**

```bash
git add apps/web/src/components/ui/progress-bar.tsx
git commit -m "feat(web): ProgressBar 12px com variants semânticas"
```

---

## Task 15: Avatar (com cor estável por hash do nome)

**Files:**
- Create: `apps/web/src/lib/avatar-color.ts`
- Create: `apps/web/src/components/ui/avatar.tsx`

- [ ] **Step 1: Criar lib de cor**

Crie `apps/web/src/lib/avatar-color.ts`:

```typescript
const AVATAR_PALETTE = [
  { bg: "bg-primary-container", text: "text-on-primary-container" },
  { bg: "bg-secondary-container", text: "text-on-secondary-container" },
  { bg: "bg-tertiary-container", text: "text-on-tertiary-container" },
  { bg: "bg-success-container", text: "text-on-success-container" },
  { bg: "bg-warning-container", text: "text-on-warning-container" },
];

function hashString(s: string): number {
  let h = 0;
  for (let i = 0; i < s.length; i++) {
    h = (h << 5) - h + s.charCodeAt(i);
    h |= 0;
  }
  return Math.abs(h);
}

export function avatarColorForName(name: string) {
  const idx = hashString(name) % AVATAR_PALETTE.length;
  return AVATAR_PALETTE[idx];
}

export function getInitials(name: string): string {
  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase() ?? "")
    .join("");
}
```

**Nota:** isso assume que `text-on-primary-container` etc. estão mapeados em `tailwind.config.ts`. Se não estiverem, adicione antes:

```typescript
"on-primary-container": "var(--on-primary-container)",
"on-secondary-container": "var(--on-secondary-container)",
"on-tertiary-container": "var(--on-tertiary-container)",
"on-success-container": "var(--on-success-container)",
"on-warning-container": "var(--on-warning-container)",
```

(provavelmente já fez no Task 9 step 1; verifique).

- [ ] **Step 2: Criar componente Avatar**

Crie `apps/web/src/components/ui/avatar.tsx`:

```typescript
import Image from "next/image";
import { avatarColorForName, getInitials } from "@/lib/avatar-color";
import { cn } from "@/lib/cn";

interface AvatarProps {
  name: string;
  src?: string | null;
  size?: "sm" | "md" | "lg" | "xl";
  className?: string;
}

const sizeClasses = {
  sm: "h-8 w-8 text-xs",
  md: "h-10 w-10 text-sm",
  lg: "h-12 w-12 text-base",
  xl: "h-20 w-20 text-xl",
};

const sizeDimensions = {
  sm: 32,
  md: 40,
  lg: 48,
  xl: 80,
};

export function Avatar({ name, src, size = "md", className }: AvatarProps) {
  const color = avatarColorForName(name);
  const initials = getInitials(name);
  const dim = sizeDimensions[size];

  if (src && src.startsWith("http")) {
    return (
      <Image
        src={src}
        alt={name}
        width={dim}
        height={dim}
        unoptimized
        className={cn("rounded-full object-cover", sizeClasses[size], className)}
      />
    );
  }

  return (
    <div
      className={cn(
        "flex items-center justify-center rounded-full font-semibold",
        color.bg,
        color.text,
        sizeClasses[size],
        className,
      )}
      aria-label={`Avatar de ${name}`}
    >
      {initials || "?"}
    </div>
  );
}
```

- [ ] **Step 3: Verificar typecheck**

```powershell
cmd /c "node_modules\.bin\tsc.CMD --noEmit"; echo "tsc: $LASTEXITCODE"
```

Expected: `tsc: 0`.

- [ ] **Step 4: Commit**

```bash
git add apps/web/src/lib/avatar-color.ts apps/web/src/components/ui/avatar.tsx
git commit -m "feat(web): Avatar com cor estável por hash do nome + fallback iniciais"
```

---

## Task 16: Wrappers Radix Primitives — Dialog

**Files:**
- Create: `apps/web/src/components/ui/dialog.tsx`

- [ ] **Step 1: Criar wrapper de Dialog**

Crie `apps/web/src/components/ui/dialog.tsx`:

```typescript
"use client";

import * as DialogPrimitive from "@radix-ui/react-dialog";
import { X } from "lucide-react";
import { ReactNode } from "react";
import { cn } from "@/lib/cn";

export const Dialog = DialogPrimitive.Root;
export const DialogTrigger = DialogPrimitive.Trigger;

interface DialogContentProps {
  children: ReactNode;
  title?: string;
  description?: string;
  className?: string;
}

export function DialogContent({ children, title, description, className }: DialogContentProps) {
  return (
    <DialogPrimitive.Portal>
      <DialogPrimitive.Overlay className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0" />
      <DialogPrimitive.Content
        className={cn(
          "fixed left-1/2 top-1/2 z-50 w-full max-w-lg -translate-x-1/2 -translate-y-1/2",
          "rounded-2xl bg-card p-6 shadow-[0_16px_32px_rgba(0,0,0,0.06)]",
          "data-[state=open]:animate-in data-[state=closed]:animate-out",
          "data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0",
          "data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95",
          className,
        )}
      >
        {title && (
          <DialogPrimitive.Title className="text-lg font-semibold text-foreground mb-1">
            {title}
          </DialogPrimitive.Title>
        )}
        {description && (
          <DialogPrimitive.Description className="text-sm text-muted-foreground mb-4">
            {description}
          </DialogPrimitive.Description>
        )}
        {children}
        <DialogPrimitive.Close className="absolute right-4 top-4 rounded-md p-1 text-muted-foreground hover:bg-surface-container focus:outline-none focus:ring-2 focus:ring-ring">
          <X size={16} />
          <span className="sr-only">Fechar</span>
        </DialogPrimitive.Close>
      </DialogPrimitive.Content>
    </DialogPrimitive.Portal>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add apps/web/src/components/ui/dialog.tsx
git commit -m "feat(web): Dialog wrapper Radix com a11y completa"
```

---

## Task 17: Wrappers Radix — DropdownMenu, Popover, Tooltip

**Files:**
- Create: `apps/web/src/components/ui/dropdown-menu.tsx`
- Create: `apps/web/src/components/ui/popover.tsx`
- Create: `apps/web/src/components/ui/tooltip.tsx`

- [ ] **Step 1: Criar DropdownMenu**

Crie `apps/web/src/components/ui/dropdown-menu.tsx`:

```typescript
"use client";

import * as DropdownPrimitive from "@radix-ui/react-dropdown-menu";
import { ReactNode } from "react";
import { cn } from "@/lib/cn";

export const DropdownMenu = DropdownPrimitive.Root;
export const DropdownMenuTrigger = DropdownPrimitive.Trigger;

export function DropdownMenuContent({ children, className, align = "end" }: { children: ReactNode; className?: string; align?: "start" | "center" | "end" }) {
  return (
    <DropdownPrimitive.Portal>
      <DropdownPrimitive.Content
        align={align}
        sideOffset={6}
        className={cn(
          "z-50 min-w-[180px] rounded-lg border border-outline-variant bg-card p-1 shadow-[0_8px_16px_rgba(0,0,0,0.08)]",
          "data-[state=open]:animate-in data-[state=closed]:animate-out",
          "data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0",
          className,
        )}
      >
        {children}
      </DropdownPrimitive.Content>
    </DropdownPrimitive.Portal>
  );
}

export function DropdownMenuItem({ children, onSelect, className, danger }: { children: ReactNode; onSelect?: () => void; className?: string; danger?: boolean }) {
  return (
    <DropdownPrimitive.Item
      onSelect={onSelect}
      className={cn(
        "flex cursor-pointer items-center gap-2 rounded-md px-3 py-2 text-sm outline-none",
        "data-[highlighted]:bg-surface-container",
        danger ? "text-error" : "text-foreground",
        className,
      )}
    >
      {children}
    </DropdownPrimitive.Item>
  );
}

export function DropdownMenuSeparator({ className }: { className?: string }) {
  return <DropdownPrimitive.Separator className={cn("my-1 h-px bg-outline-variant", className)} />;
}
```

- [ ] **Step 2: Criar Popover**

Crie `apps/web/src/components/ui/popover.tsx`:

```typescript
"use client";

import * as PopoverPrimitive from "@radix-ui/react-popover";
import { ReactNode } from "react";
import { cn } from "@/lib/cn";

export const Popover = PopoverPrimitive.Root;
export const PopoverTrigger = PopoverPrimitive.Trigger;

export function PopoverContent({ children, className, align = "center" }: { children: ReactNode; className?: string; align?: "start" | "center" | "end" }) {
  return (
    <PopoverPrimitive.Portal>
      <PopoverPrimitive.Content
        align={align}
        sideOffset={6}
        className={cn(
          "z-50 w-72 rounded-lg border border-outline-variant bg-card p-4 shadow-[0_8px_16px_rgba(0,0,0,0.08)]",
          "data-[state=open]:animate-in data-[state=closed]:animate-out",
          className,
        )}
      >
        {children}
      </PopoverPrimitive.Content>
    </PopoverPrimitive.Portal>
  );
}
```

- [ ] **Step 3: Criar Tooltip**

Crie `apps/web/src/components/ui/tooltip.tsx`:

```typescript
"use client";

import * as TooltipPrimitive from "@radix-ui/react-tooltip";
import { ReactNode } from "react";
import { cn } from "@/lib/cn";

export const TooltipProvider = TooltipPrimitive.Provider;
export const Tooltip = TooltipPrimitive.Root;
export const TooltipTrigger = TooltipPrimitive.Trigger;

export function TooltipContent({ children, className, side = "top" }: { children: ReactNode; className?: string; side?: "top" | "bottom" | "left" | "right" }) {
  return (
    <TooltipPrimitive.Portal>
      <TooltipPrimitive.Content
        side={side}
        sideOffset={4}
        className={cn(
          "z-50 rounded-md bg-foreground px-2 py-1 text-xs text-background",
          "data-[state=delayed-open]:animate-in data-[state=closed]:animate-out",
          className,
        )}
      >
        {children}
        <TooltipPrimitive.Arrow className="fill-foreground" />
      </TooltipPrimitive.Content>
    </TooltipPrimitive.Portal>
  );
}
```

- [ ] **Step 4: Adicionar TooltipProvider no layout root**

Em `apps/web/src/app/layout.tsx`, importe e envolva (dentro do ThemeProvider):

```typescript
import { TooltipProvider } from "@/components/ui/tooltip";

// dentro do <ThemeProvider>:
<TooltipProvider delayDuration={300}>
  {children}
</TooltipProvider>
```

- [ ] **Step 5: Verificar typecheck**

```powershell
cmd /c "node_modules\.bin\tsc.CMD --noEmit"; echo "tsc: $LASTEXITCODE"
```

Expected: `tsc: 0`.

- [ ] **Step 6: Commit**

```bash
git add apps/web/src/components/ui/dropdown-menu.tsx apps/web/src/components/ui/popover.tsx apps/web/src/components/ui/tooltip.tsx apps/web/src/app/layout.tsx
git commit -m "feat(web): wrappers Radix Primitives — DropdownMenu, Popover, Tooltip"
```

---

## Task 18: Restyle Sidebar

**Files:**
- Modify: `apps/web/src/components/dashboard/sidebar.tsx`

- [ ] **Step 1: Substituir conteúdo do sidebar**

Abra `apps/web/src/components/dashboard/sidebar.tsx` e substitua todo o conteúdo:

```typescript
"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  Home, BookOpen, BookMarked, BarChart2, BarChart3, MessageSquare,
  Target, Users, Settings, LogOut, ShieldCheck, GitCompare, FileClock,
  GraduationCap,
} from "lucide-react";
import { cn } from "@/lib/cn";
import { useAuthStore } from "@/store/auth.store";
import type { SessionUser } from "@/lib/auth/session";
import { ThemeToggle } from "@/components/ui/ThemeToggle";

type NavItem = { href: string; label: string; icon: React.ElementType };

const studentNav: NavItem[] = [
  { href: "/student", label: "Início", icon: Home },
  { href: "/student/progress", label: "Meu progresso", icon: BarChart2 },
  { href: "/student/plan", label: "Plano de estudo", icon: BookOpen },
  { href: "/student/evaluations", label: "Avaliações", icon: MessageSquare },
  { href: "/student/feedback", label: "Feedbacks", icon: MessageSquare },
  { href: "/student/goals", label: "Metas", icon: Target },
];

const teacherNav: NavItem[] = [
  { href: "/teacher", label: "Início", icon: Home },
  { href: "/teacher/classes", label: "Minhas turmas", icon: Users },
  { href: "/teacher/evaluations", label: "Avaliações", icon: MessageSquare },
  { href: "/teacher/grades", label: "Notas", icon: BarChart3 },
  { href: "/teacher/development", label: "Meu desenvolvimento", icon: Target },
  { href: "/teacher/insights", label: "Insights", icon: BarChart2 },
];

const coordinatorNav: NavItem[] = [
  { href: "/coordinator", label: "Visão geral", icon: Home },
  { href: "/coordinator/classes", label: "Turmas", icon: BookOpen },
  { href: "/coordinator/subjects", label: "Disciplinas", icon: BookMarked },
  { href: "/coordinator/teachers", label: "Professores", icon: Users },
  { href: "/coordinator/cycles", label: "Ciclos", icon: Target },
  { href: "/coordinator/benchmarking", label: "Benchmarking", icon: GitCompare },
  { href: "/coordinator/reports", label: "Relatórios", icon: BarChart2 },
  { href: "/coordinator/settings", label: "Configurações", icon: Settings },
];

const adminNav: NavItem[] = [
  { href: "/admin", label: "Usuários", icon: Users },
  { href: "/admin/metrics", label: "Métricas", icon: BarChart2 },
  { href: "/admin/privacy", label: "Privacidade", icon: ShieldCheck },
  { href: "/admin/audit", label: "Auditoria", icon: FileClock },
];

const navByRole: Record<SessionUser["role"], NavItem[]> = {
  STUDENT: studentNav,
  TEACHER: teacherNav,
  COORDINATOR: coordinatorNav,
  ADMIN: adminNav,
};

export function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const user = useAuthStore((s) => s.user);
  const logout = useAuthStore((s) => s.logout);

  if (!user) return null;

  const items = navByRole[user.role];

  async function handleLogout() {
    await logout();
    router.push("/login");
  }

  return (
    <aside className="flex h-screen w-64 flex-col border-r border-outline-variant bg-surface">
      {/* Logo card */}
      <div className="p-6">
        <div className="flex items-start gap-3 rounded-2xl bg-surface-container p-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary text-primary-foreground">
            <GraduationCap size={18} />
          </div>
          <div>
            <p className="text-sm font-bold text-foreground">GOSF</p>
            <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground leading-tight">
              Inteligência<br />acadêmica
            </p>
          </div>
        </div>
      </div>

      {/* Nav items */}
      <nav className="flex-1 overflow-y-auto px-3 space-y-1">
        {items.map((item) => {
          const active = pathname === item.href || pathname.startsWith(item.href + "/");
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors relative",
                active
                  ? "bg-primary-container text-on-primary-container"
                  : "text-muted-foreground hover:bg-surface-container hover:text-foreground",
              )}
            >
              {active && <span className="absolute left-0 top-1/2 h-6 w-1 -translate-y-1/2 rounded-r-full bg-primary" />}
              <Icon size={18} />
              {item.label}
            </Link>
          );
        })}
      </nav>

      {/* Footer: Upgrade card (apenas COORDINATOR) + theme toggle + logout */}
      <div className="p-3 space-y-2 border-t border-outline-variant">
        {user.role === "COORDINATOR" && (
          <div className="rounded-xl bg-surface-container p-3 space-y-2">
            <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              Plano
            </p>
            <p className="text-sm font-medium text-foreground">Veja seu plano atual</p>
            <Link
              href="/coordinator/settings"
              className="block rounded-lg bg-primary px-3 py-1.5 text-center text-xs font-semibold text-primary-foreground hover:bg-primary/90 transition-colors"
            >
              Gerenciar
            </Link>
          </div>
        )}

        <div className="flex items-center justify-between">
          <ThemeToggle />
          <button
            onClick={handleLogout}
            className="flex h-9 items-center gap-2 rounded-lg px-3 text-sm font-medium text-muted-foreground hover:bg-surface-container hover:text-foreground transition-colors"
          >
            <LogOut size={16} />
            Sair
          </button>
        </div>
      </div>
    </aside>
  );
}
```

- [ ] **Step 2: Verificar typecheck**

```powershell
cmd /c "node_modules\.bin\tsc.CMD --noEmit"; echo "tsc: $LASTEXITCODE"
```

Expected: `tsc: 0`.

- [ ] **Step 3: Commit**

```bash
git add apps/web/src/components/dashboard/sidebar.tsx
git commit -m "feat(web): restyle sidebar com logo card + nav items + footer EduPulse"
```

---

## Task 19: Restyle TopBar

**Files:**
- Modify: `apps/web/src/components/dashboard/top-bar.tsx`

- [ ] **Step 1: Verificar conteúdo atual**

Leia `apps/web/src/components/dashboard/top-bar.tsx` para entender o que está lá hoje (notifications-bell, avatar, etc.) e mantenha esse comportamento, só restilando.

- [ ] **Step 2: Substituir o JSX da topbar**

Substitua o componente principal mantendo as funcionalidades existentes (notification bell, avatar com dropdown). Estrutura nova:

```typescript
"use client";

import { useRouter } from "next/navigation";
import { LogOut, User } from "lucide-react";
import { useAuthStore } from "@/store/auth.store";
import { NotificationsBell } from "./notifications-bell"; // assumindo que existe
import { Avatar } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export function TopBar() {
  const router = useRouter();
  const user = useAuthStore((s) => s.user);
  const logout = useAuthStore((s) => s.logout);

  if (!user) return null;

  const firstName = user.fullName?.split(" ")[0] ?? "Usuário";

  async function handleLogout() {
    await logout();
    router.push("/login");
  }

  return (
    <header className="flex h-16 items-center justify-between border-b border-outline-variant bg-surface px-6">
      <div>
        <h1 className="text-lg font-semibold text-foreground">
          Olá, {firstName}
        </h1>
        <p className="text-xs text-muted-foreground">
          {/* mensagem secundária dinâmica — preencher conforme contexto */}
        </p>
      </div>

      <div className="flex items-center gap-2">
        <NotificationsBell />

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button className="rounded-full focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 focus:ring-offset-background">
              <Avatar name={user.fullName} src={user.avatarUrl ?? null} size="md" />
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent>
            <DropdownMenuItem onSelect={() => router.push("/settings/profile")}>
              <User size={14} />
              Meu perfil
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onSelect={handleLogout} danger>
              <LogOut size={14} />
              Sair
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}
```

**Nota:** se `NotificationsBell` não existe, comente o import e o JSX por enquanto e adicione um placeholder:

```typescript
{/* TODO Wave 4: NotificationsBell restyled */}
```

Se `user.avatarUrl` não existir no SessionUser, ajuste para `undefined` ou pegue de outro lugar.

- [ ] **Step 3: Verificar typecheck**

```powershell
cmd /c "node_modules\.bin\tsc.CMD --noEmit"; echo "tsc: $LASTEXITCODE"
```

Expected: `tsc: 0`. Se houver erros sobre `avatarUrl`, ajuste o tipo `SessionUser` ou use fallback.

- [ ] **Step 4: Commit**

```bash
git add apps/web/src/components/dashboard/top-bar.tsx
git commit -m "feat(web): restyle topbar com greeting + notif + dropdown avatar"
```

---

## Task 20: Restyle página de login

**Files:**
- Modify: `apps/web/src/app/(auth)/login/page.tsx`
- Modify: `apps/web/src/features/auth/login-form.tsx`

- [ ] **Step 1: Substituir página de login**

Em `apps/web/src/app/(auth)/login/page.tsx`, substitua pelo novo layout:

```typescript
import type { Metadata } from "next";
import Link from "next/link";
import { GraduationCap } from "lucide-react";
import { LoginForm } from "@/features/auth/login-form";

export const metadata: Metadata = { title: "Entrar" };

export default function LoginPage() {
  return (
    <div className="min-h-screen grid lg:grid-cols-2">
      {/* Hero side */}
      <div className="relative hidden lg:flex flex-col justify-between bg-primary px-10 py-10 text-primary-foreground">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/15">
            <GraduationCap size={20} />
          </div>
          <div>
            <p className="font-bold text-lg">GOSF</p>
            <p className="text-xs uppercase tracking-wider opacity-75">Academic Excellence</p>
          </div>
        </div>

        <div className="space-y-4">
          <h1 className="text-3xl font-bold leading-tight">
            Inteligência relacional<br />para educação de excelência
          </h1>
          <p className="text-base opacity-80 max-w-md">
            Avaliações cruzadas, planos personalizados por IA e dashboards claros
            para alunos, professores e coordenação.
          </p>
        </div>

        <div className="flex gap-8">
          {[
            { value: "1.2k+", label: "Escolas" },
            { value: "98%", label: "Adesão" },
            { value: "LGPD", label: "Compliance" },
          ].map(({ value, label }) => (
            <div key={label}>
              <p className="text-xl font-bold">{value}</p>
              <p className="text-xs opacity-75 uppercase tracking-wider">{label}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Form side */}
      <div className="flex items-center justify-center bg-background px-6 py-12">
        <div className="w-full max-w-sm space-y-8">
          <div className="flex items-center gap-2 lg:hidden">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary text-primary-foreground">
              <GraduationCap size={16} />
            </div>
            <span className="text-base font-bold">GOSF</span>
          </div>

          <div>
            <h2 className="text-2xl font-bold text-foreground">
              Entrar na plataforma
            </h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Use suas credenciais institucionais
            </p>
          </div>

          <LoginForm />

          <p className="text-center text-sm text-muted-foreground">
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

- [ ] **Step 2: Atualizar LoginForm pra usar novos componentes**

Em `apps/web/src/features/auth/login-form.tsx`, troque os inputs raw por `Input` e botão por `Button` novo:

```typescript
"use client";

import Link from "next/link";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { loginSchema, LoginFormValues } from "@/lib/schemas/auth.schema";
import { api, ApiError } from "@/lib/api/client";
import { useAuthStore } from "@/store/auth.store";
import { toast } from "sonner";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

export function LoginForm() {
  const router = useRouter();
  const login = useAuthStore((s) => s.login);

  const form = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: { institutionSlug: "", email: "", password: "" },
  });

  const { isSubmitting } = form.formState;

  async function onSubmit(values: LoginFormValues) {
    try {
      const res = await api.post<{ accessToken: string; refreshToken: string }>(
        "/auth/login",
        values,
        true,
      );
      const redirectTo = login(res.accessToken, res.refreshToken);
      router.push(redirectTo);
    } catch (err) {
      const message =
        err instanceof ApiError && err.status === 401
          ? "E-mail ou senha incorretos."
          : "Erro ao conectar. Tente novamente.";
      toast.error(message);
    }
  }

  return (
    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
      <div>
        <label className="block text-sm font-semibold text-foreground mb-1.5">
          Código da instituição
        </label>
        <Input
          {...form.register("institutionSlug")}
          placeholder="ex: escola-demo"
          autoComplete="organization"
        />
        {form.formState.errors.institutionSlug && (
          <p className="mt-1 text-xs text-error">
            {form.formState.errors.institutionSlug.message}
          </p>
        )}
      </div>

      <div>
        <label className="block text-sm font-semibold text-foreground mb-1.5">
          E-mail
        </label>
        <Input
          {...form.register("email")}
          type="email"
          placeholder="voce@escola.com"
          autoComplete="email"
        />
        {form.formState.errors.email && (
          <p className="mt-1 text-xs text-error">
            {form.formState.errors.email.message}
          </p>
        )}
      </div>

      <div>
        <label className="block text-sm font-semibold text-foreground mb-1.5">
          Senha
        </label>
        <Input
          {...form.register("password")}
          type="password"
          placeholder="••••••••"
          autoComplete="current-password"
        />
        {form.formState.errors.password && (
          <p className="mt-1 text-xs text-error">
            {form.formState.errors.password.message}
          </p>
        )}
      </div>

      <div className="flex justify-end">
        <Link
          href="/forgot-password"
          className="text-xs text-muted-foreground hover:text-primary transition-colors"
        >
          Esqueci minha senha
        </Link>
      </div>

      <Button type="submit" disabled={isSubmitting} className="w-full">
        {isSubmitting ? "Entrando..." : "Entrar"}
      </Button>
    </form>
  );
}
```

- [ ] **Step 3: Testar visualmente em ambos os modos**

Suba o dev server e abra `/login`:
- Light mode: hero side em marrom escuro, form side em off-white
- Toggle no DevTools `<html class="dark">`: hero permanece marrom (mais escuro/saturado), form side em navy
- Inputs ao receber focus: bg muda pra branco/surface + border marrom 2px

- [ ] **Step 4: Commit**

```bash
git add apps/web/src/app/\(auth\)/login/page.tsx apps/web/src/features/auth/login-form.tsx
git commit -m "feat(web): restyle login com hero marrom + form usando novos componentes"
```

---

## Task 21: Restyle register, forgot, reset

**Files:**
- Modify: `apps/web/src/app/(auth)/register/page.tsx` (se existir)
- Modify: `apps/web/src/app/(auth)/forgot-password/page.tsx`
- Modify: `apps/web/src/app/(auth)/reset-password/page.tsx`
- Modify: forms correspondentes em `apps/web/src/features/auth/`

- [ ] **Step 1: Aplicar mesmo padrão do login**

Para cada uma das páginas auth, aplicar o mesmo padrão de split layout (hero marrom à esquerda, form à direita) usado no login. Trocar inputs por `<Input>` e botões por `<Button>` novos.

Verifique primeiro que arquivos existem:

```bash
ls apps/web/src/app/\(auth\)/
```

- [ ] **Step 2: Para cada página existente, replicar o template do login**

Use a Task 20 como template. Mudanças mínimas: título, subtítulo, campos do form, e o link de retorno (forgot → login, reset → login).

- [ ] **Step 3: Verificar typecheck**

```powershell
cmd /c "node_modules\.bin\tsc.CMD --noEmit"; echo "tsc: $LASTEXITCODE"
```

Expected: `tsc: 0`.

- [ ] **Step 4: Commit**

```bash
git add apps/web/src/app/\(auth\)/ apps/web/src/features/auth/
git commit -m "feat(web): restyle register, forgot-password e reset-password no padrão EduPulse"
```

---

## Task 22: Restyle página pricing

**Files:**
- Modify: `apps/web/src/app/pricing/page.tsx`

- [ ] **Step 1: Identificar conteúdo atual**

```bash
cat apps/web/src/app/pricing/page.tsx
```

Mantenha os planos e preços (Starter R$97, Escola R$297, Enterprise R$797), só restilando.

- [ ] **Step 2: Aplicar restyle**

Estrutura: header centralizado com título + subtítulo, grid 3 colunas com cards de plano, plano "Escola" com badge "Mais popular" e bg primary-container destacado, badge de preço, lista de features com checkmarks verdes, CTA primary em cada card.

Usar `<Card>`, `<Chip>`, `<Button>` novos. Sem sidebar/topbar (página pública).

- [ ] **Step 3: Verificar typecheck**

```powershell
cmd /c "node_modules\.bin\tsc.CMD --noEmit"; echo "tsc: $LASTEXITCODE"
```

Expected: `tsc: 0`.

- [ ] **Step 4: Commit**

```bash
git add apps/web/src/app/pricing/page.tsx
git commit -m "feat(web): restyle página pricing com cards EduPulse"
```

---

## Task 23: Validação final visual e técnica

**Files:** (apenas comandos de validação)

- [ ] **Step 1: Lint completo**

```powershell
cd apps/web
$env:PATH = "C:\Program Files\nodejs;" + $env:PATH
$r = cmd /c "node_modules\.bin\eslint.CMD src --max-warnings 0 2>&1"
Write-Host "eslint: $LASTEXITCODE"
if ($r) { $r | Select-String -Pattern "error" | Select-Object -First 20 }
```

Expected: `eslint: 0`. Se houver warnings novos, corrija (mesma estratégia de antes).

- [ ] **Step 2: Typecheck completo**

```powershell
cmd /c "node_modules\.bin\tsc.CMD --noEmit"; echo "tsc: $LASTEXITCODE"
```

Expected: `tsc: 0`.

- [ ] **Step 3: Validação visual em ambos os modos**

Suba o dev e teste manualmente cada página auth:

- `/login` em light → toggle dark → light de novo
- `/register` (se existir) em ambos
- `/forgot-password` em ambos
- `/reset-password` em ambos
- `/pricing` em ambos

Confirme:
- Sem flash branco no carregamento (FOUC)
- Cores corretas em ambos os modos
- Botões com border-shadow tactile no primary
- Inputs cinza→branco no focus
- Lexend renderiza
- Theme toggle funciona e persiste após F5

- [ ] **Step 4: Build de produção pra confirmar**

```powershell
cmd /c "pnpm --filter web build 2>&1" | Select-Object -Last 30
```

Expected: build success sem erros. Avisos de Sentry e webpack são esperados/aceitáveis.

- [ ] **Step 5: Commit (se houver fixes)**

Se algum fix foi aplicado nessa validação:

```bash
git add -A
git commit -m "fix(web): ajustes finais Wave 1 EduPulse"
```

---

## Task 24: Merge para main

**Files:** (apenas comandos)

- [ ] **Step 1: Push da branch (vai disparar pre-push hook com typecheck)**

```bash
cd C:\Users\LENOVO\NikProjects\GOSF\.worktrees\edupulse-foundation
git push origin feat/edupulse-foundation
```

Expected: hook roda typecheck OK + push sucede.

- [ ] **Step 2: Merge local pra main**

```bash
cd C:\Users\LENOVO\NikProjects\GOSF
git checkout main
git pull origin main
git merge feat/edupulse-foundation --no-ff -m "feat: Wave 1 EduPulse — design system + auth pages"
git push origin main
```

- [ ] **Step 3: Limpar worktree**

```bash
git worktree remove --force .worktrees/edupulse-foundation 2>&1
git worktree prune
git branch -d feat/edupulse-foundation
```

Se `worktree remove --force` falhar com "Directory not empty", remova manualmente:

```bash
rm -rf .worktrees/edupulse-foundation
git worktree prune
git branch -d feat/edupulse-foundation
```

- [ ] **Step 4: Validar deploy em prod**

Aguardar ~5min pelo Easypanel rebuildar com nova lockfile (lockfile mudou — cache invalidado).

Acessar `https://gosf.niktronix.com.br/login` e confirmar:
- Página carrega sem erro
- Lexend renderiza
- Theme toggle aparece se já estiver na sidebar (nesta wave a sidebar não aparece em /login, mas a página deve estar redesenhada)

---

## Critérios de aceite da Wave 1

- [ ] Typecheck e lint passam (zero errors, zero warnings novos)
- [ ] Build de produção sucede
- [ ] Páginas auth (login, register, forgot, reset, pricing) funcionam visualmente em light e dark mode
- [ ] Theme toggle persiste preferência entre F5
- [ ] Sem FOUC visível no carregamento inicial
- [ ] Lexend carregando em todas as páginas
- [ ] Tokens novos aplicados, OKLCH antigos removidos
- [ ] Componentes base prontos: Button, Chip, Card, StatCard, InsightCard, Input, ProgressBar, Avatar, ThemeToggle
- [ ] Wrappers Radix prontos: Dialog, DropdownMenu, Popover, Tooltip
- [ ] Sidebar e TopBar restilados
- [ ] Deploy em prod funcional

## Próximos passos

Após Wave 1 mergear, voltar pra `superpowers:brainstorming` ou direto pra `superpowers:writing-plans` para escrever a Wave 2 (Dashboards) baseado no que aprendemos da Wave 1.
