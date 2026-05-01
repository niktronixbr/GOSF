# GOSF UI/UX Redesign — Design Spec

**Data:** 2026-05-01  
**Status:** Aprovado  
**Abordagem:** Design system global primeiro (Abordagem 1)

---

## 1. Decisões de design aprovadas

| Decisão | Escolha |
|---|---|
| Direção visual | Sidebar navy `#0f172a` + conteúdo off-white + teal como acento primário |
| Tipografia | Plus Jakarta Sans (400/500/600/700/800) |
| Animações | Balanceadas — stagger slide-up na entrada, hover elevation nos cards |
| Integração marrom | Navy sidebar + âmbar OKLCH como 2º acento para contexto acadêmico |
| Implementação | Design system global primeiro, depois componentes e páginas prioritárias |

---

## 2. Design system

### 2.1 Paleta de cores

```css
/* Sidebar */
--sidebar: #0f172a;

/* Teal — ações, progresso, IA, estados ativos */
--teal:       oklch(0.55 0.08 195);
--teal-soft:  oklch(0.95 0.025 195);
--teal-text:  oklch(0.42 0.09 195);
--teal-glow:  rgba(0, 148, 148, 0.18);

/* Âmbar — contexto acadêmico: disciplinas, metas, categorias */
--amber:      oklch(0.62 0.13 60);
--amber-soft: oklch(0.95 0.04 60);
--amber-text: oklch(0.42 0.10 60);

/* Neutros (Stone — subtom marrom-quente) */
--bg:            #fafaf9;
--surface:       #ffffff;
--border:        #e7e5e4;
--border-strong: #d6d3d1;
--text:          #1c1917;
--text-muted:    #57534e;
--text-subtle:   #78716c;

/* Semânticos */
--success: oklch(0.62 0.13 150);
--warning: oklch(0.72 0.14 75);
--danger:  oklch(0.58 0.18 25);
--info:    oklch(0.60 0.10 240);
```

**Semântica das duas cores de acento:**
- **Teal** → ações primárias (botões CTA, links, progress bars, badges de status de ciclo, ícones ativos na sidebar, output de IA)
- **Âmbar** → contexto acadêmico (tags de disciplina, badges de meta, avatar de usuário, indicadores de categoria pedagógica)

### 2.2 Tipografia

**Fonte:** Plus Jakarta Sans — importar via `next/font/google`

```ts
// apps/web/src/app/layout.tsx
import { Plus_Jakarta_Sans } from 'next/font/google'

const font = Plus_Jakarta_Sans({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700', '800'],
  variable: '--font-sans',
})
```

| Estilo | Tamanho | Peso | Letter-spacing | Uso |
|---|---|---|---|---|
| Display | 28–36px | 800 | -0.8px | Hero login, banners principais |
| H1 | 20–22px | 700 | -0.4px | Título de tela |
| H2 / Card | 13–15px | 700 | -0.2px | Card headers, section titles |
| Body | 13px | 400–500 | 0 | Conteúdo geral |
| Caption | 10px | 600 | 1px | Labels uppercase, badges |
| Mono | 12px | 400 | 0 | IDs, IPs, timestamps |

### 2.3 Tokens de forma e sombra

```css
--radius-sm: 6px;
--radius-md: 10px;
--radius-lg: 14px;

--shadow-sm: 0 1px 2px rgba(15,23,42,0.05);
--shadow-md: 0 1px 3px rgba(15,23,42,0.07), 0 4px 12px rgba(15,23,42,0.05);
```

### 2.4 Tailwind config atualizado

```ts
// tailwind.config.ts
extend: {
  colors: {
    sidebar: '#0f172a',
    teal: {
      DEFAULT: 'oklch(0.55 0.08 195)',
      soft:    'oklch(0.95 0.025 195)',
      fg:      'oklch(0.42 0.09 195)',
    },
    amber: {
      DEFAULT: 'oklch(0.62 0.13 60)',
      soft:    'oklch(0.95 0.04 60)',
      fg:      'oklch(0.42 0.10 60)',
    },
  },
  fontFamily: {
    sans: ['var(--font-sans)', 'system-ui', 'sans-serif'],
  },
  borderRadius: {
    sm: '6px',
    md: '10px',
    lg: '14px',
  },
}
```

### 2.5 CSS variables em globals.css

**Estratégia:** atualizar os valores das variáveis semânticas HSL existentes (mantendo os nomes `--primary`, `--background`, etc. para não quebrar as classes Tailwind já usadas nas páginas) E adicionar as novas custom properties OKLCH para uso direto.

```css
:root {
  /* Neutros atualizados */
  --background:      30 5% 98%;      /* #fafaf9 — off-white quente */
  --foreground:      20 7% 10%;      /* #1c1917 */
  --card:            0 0% 100%;
  --card-foreground: 20 7% 10%;
  --muted:           30 6% 95%;
  --muted-foreground: 20 5% 45%;    /* #78716c */
  --border:          30 5% 91%;     /* #e7e5e4 */
  --input:           30 6% 84%;     /* #d6d3d1 */

  /* Primary → teal (atualizar de azul-escuro para teal) */
  --primary:            185 32% 40%;  /* aproximação HSL do teal OKLCH */
  --primary-foreground: 0 0% 100%;
  --ring:               185 32% 40%;

  /* Secondary → amber soft */
  --secondary:            40 55% 94%;
  --secondary-foreground: 30 35% 30%;

  /* Novos tokens OKLCH diretos (usados via bg-teal, text-amber-fg etc.) */
  /* Definidos via tailwind.config.ts — não precisam de custom property aqui */
}
```

> As classes existentes (`bg-primary`, `text-muted-foreground`, `ring-ring`, `bg-secondary`) continuam funcionando com os valores atualizados. As novas classes Tailwind (`bg-teal`, `bg-amber-soft`, `text-teal-fg`, `text-amber-fg`, `bg-sidebar`) vêm do `tailwind.config.ts` e são usadas nos novos componentes.

---

## 3. Componentes a criar/refatorar

### 3.1 Sidebar (refatorar `components/dashboard/sidebar.tsx`)

**Mudanças:**
- Background: `bg-sidebar` (`#0f172a`)
- Item ativo: `bg-white/9` + label `text-white font-semibold`
- Item inativo: label `text-white/55`, hover `bg-white/6`
- Badge de notificação: `bg-teal text-white`
- Avatar do usuário no rodapé: `bg-amber-soft text-amber-fg`
- Logo icon: `bg-teal rounded-lg`
- Seção labels: `text-white/22 uppercase tracking-widest text-[9px]`

### 3.2 TopBar (refatorar `components/dashboard/top-bar.tsx`)

**Mudanças:**
- `bg-white border-b border-border`
- Título: `text-[16px] font-bold tracking-tight`
- Search: `bg-bg border border-border rounded-lg` com atalho `⌘K`
- Avatar: `bg-amber-soft text-amber-fg`
- Notif dot: `bg-danger`

### 3.3 Componentes novos a criar em `components/ui/`

| Componente | Arquivo | Descrição |
|---|---|---|
| `Button` | `button.tsx` | Variantes: `primary` (teal), `secondary` (amber-soft), `ghost`, `danger`. Props: `variant`, `size`, `loading`, `icon` |
| `Badge` | `badge.tsx` | Variantes: `teal` (status ciclo), `amber` (disciplina/meta), `success`, `warning`, `danger`, `neutral`. Com dot opcional |
| `Input` | `input.tsx` | Focus ring teal (`ring-teal/30`). Props: `label`, `hint`, `error` |
| `Card` | `card.tsx` | `bg-surface border-border rounded-lg shadow-sm`. Sub: `CardHeader`, `CardContent` |
| `Stat` | `stat.tsx` | KPI card: `icon`, `label`, `value`, `delta`. Hover elevation animado |
| `Modal` | `modal.tsx` | Overlay + dialog com `rounded-xl shadow-xl`. Fechar: ESC + backdrop click |

### 3.4 Animações (CSS puro — sem Framer Motion)

```css
/* Entrada de cards — stagger via animation-delay */
@keyframes slide-up {
  from { opacity: 0; transform: translateY(12px); }
  to   { opacity: 1; transform: translateY(0); }
}

.animate-slide-up {
  animation: slide-up 0.35s cubic-bezier(0.22, 1, 0.36, 1) both;
}

/* Hover elevation nos stat cards */
.stat-card {
  transition: transform 0.25s cubic-bezier(0.22, 1, 0.36, 1),
              box-shadow 0.25s cubic-bezier(0.22, 1, 0.36, 1);
}
.stat-card:hover {
  transform: translateY(-2px);
  box-shadow: var(--shadow-md);
}
```

Stagger aplicado via `[&>*:nth-child(n)]:animation-delay-[Xms]` ou classes utilitárias no Tailwind config.

---

## 4. Páginas prioritárias

### Prioridade 1 — Afetadas pelo design system (mudança automática com Sidebar/TopBar)
Todas as páginas autenticadas herdam o novo visual assim que Sidebar e TopBar forem refatorados.

### Prioridade 2 — Login (`app/(auth)/login/page.tsx`)

**Mudança:** card centrado → split layout

- **Esquerda (hero):** `bg-sidebar` + glow radial teal no canto superior + glow âmbar sutil no inferior. Logo, título display, descrição, stats institucionais (1.2k+ escolas, 98% adesão, LGPD).
- **Direita (formulário):** `bg-surface`. Campos: slug da instituição, e-mail, senha. Botão `btn-primary` teal. Footer LGPD.

### Prioridade 3 — Dashboards (aplicar stat cards animados + disc tags âmbar)

- `(student)/student/page.tsx` — stat cards + disc tags âmbar nas barras de dimensão + painel IA com bg sidebar
- `(teacher)/teacher/page.tsx` — mesma estrutura
- `(coordinator)/coordinator/page.tsx` — heatmap + stat cards
- `(admin)/admin/page.tsx` — stat cards + lista de serviços

---

## 5. Migração do globals.css

**O que muda:**
1. Remover fonte Geist → Plus Jakarta Sans via `next/font`
2. Substituir tokens `--background` (branco puro) por `#fafaf9`
3. Substituir `--primary` (azul escuro HSL) pelo mapeamento teal
4. Adicionar tokens `--amber-*` e `--teal-*` como custom properties
5. Manter variáveis HSL de compatibilidade para classes Tailwind existentes

**O que NÃO muda:** estrutura de rotas, lógica de negócio, chamadas de API, estado Zustand.

---

## 6. Fora do escopo desta sprint

- Dark mode (tokens OKLCH facilitam — próxima sprint)
- Animações de transição entre rotas
- Storybook / testes visuais
- Mobile dedicated views além do responsivo atual
- i18n

---

## 7. Critérios de conclusão

- [ ] `globals.css` atualizado com novos tokens
- [ ] `tailwind.config.ts` com cores teal/amber/sidebar
- [ ] Plus Jakarta Sans carregado via `next/font`
- [ ] `Sidebar` refatorada com navy + teal badge + amber avatar
- [ ] `TopBar` refatorada com novos tokens
- [ ] Componentes `Button`, `Badge`, `Input`, `Card`, `Stat`, `Modal` criados em `components/ui/`
- [ ] Login com split layout (hero navy + formulário)
- [ ] Dashboards com stat cards animados e disc tags amber
- [ ] Nenhuma regressão em funcionalidade (formulários, APIs, guards)
- [ ] `pnpm lint` e `pnpm typecheck` passando
