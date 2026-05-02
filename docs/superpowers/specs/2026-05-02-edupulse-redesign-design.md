# GOSF — Redesign EduPulse

**Data:** 2026-05-02
**Status:** Aprovado (aguardando revisão final do usuário)
**Substitui:** redesign navy/teal/amber merged em 2026-05-02 (`31b5512`)

## 1. Objetivo

Substituir completamente o sistema visual atual do GOSF por um novo design ("EduPulse") com paleta marrom acadêmico + azul, tipografia Lexend, suporte a dark/light mode com toggle do usuário, e estética tactile/gamificada distintiva. A motivação é se diferenciar visualmente de outros SaaS B2B educacionais, projetando uma identidade própria mais arrojada e moderna.

## 2. Escopo

**Inclui:**
- Sistema de design completo (tokens, tipografia, espaçamento, formas, elevação)
- Suporte simultâneo a dark e light mode com toggle do usuário (preferência persistida)
- Refatoração de todos os ~30 páginas/views da aplicação web
- Refatoração de componentes base (Button, Badge→Chip) e criação de componentes novos (Card, StatCard, InsightCard, Input, ProgressBar, Avatar, ThemeToggle)
- Adoção de Radix Primitives para componentes a11y-críticos (Dialog, DropdownMenu, Popover, Tooltip)
- Repensar information architecture dos dashboards (`/student`, `/teacher`, `/coordinator`, `/admin`) no estilo EduPulse

**Não inclui:**
- Mudanças na API/backend
- Novas features funcionais (ex: search global, achievements/gamificação real, community)
- Mudança de stack (continua Next.js + Tailwind, sem shadcn/ui)
- Internacionalização (mantém pt-BR)

## 3. Abordagem

**Phased em waves**, sem feature flag. Cada wave é uma branch + worktree mergeable independentemente para `main`. Aceita-se inconsistência visual temporária entre waves porque ainda não há instituições beta com usuários reais ativos.

## 4. Sistema de design

### 4.1 Cores — Light mode

Tokens derivados do `DESIGN.md` original (gerado no Stitch). Esta tabela é a fonte da verdade canônica para implementação.

| Token | Valor | Uso |
|-------|-------|-----|
| `--primary` | `#703e0e` | Marrom acadêmico — branding, navegação ativa, ações principais |
| `--on-primary` | `#ffffff` | Texto sobre primário |
| `--secondary` | `#0061a5` | Azul acadêmico — links, ações secundárias, charts comparativos |
| `--background` | `#f8f9ff` | Canvas geral |
| `--surface` | `#ffffff` | Cards |
| `--surface-container` | `#e5eeff` | Containers leves (filtros, headers de seção) |
| `--on-surface` | `#0d1c2e` | Texto principal |
| `--on-surface-variant` | `#52443a` | Texto secundário |
| `--outline` | `#847469` | Borders |
| `--outline-variant` | `#d7c3b6` | Borders sutis |
| `--error` | `#ba1a1a` | Erros |
| `--error-container` | `#ffdad6` | Bg de erro suave |

Acentos: âmbar (`#ffb866` - tertiary-fixed-dim) para warnings/destaques visuais (ex: cards de alerta, chips de status `warning`); verde derivado para sucesso/progresso positivo (ex: chip `success`, ProgressBar de notas alta).

### 4.2 Cores — Dark mode

Derivado dos tokens `inverse-*` do DESIGN.md e do screenshot dark mode.

| Token | Valor | Uso |
|-------|-------|-----|
| `--primary` | `#ffb77f` | inverse-primary — marrom claro para contraste |
| `--background` | `#0d1c2e` | Navy escuro |
| `--surface` | `#223144` | Cards (mais claro que background) |
| `--surface-container` | `#2c3a4d` | Containers internos |
| `--on-surface` | `#eaf1ff` | Texto principal |
| `--on-surface-variant` | `#aab4c2` | Texto secundário |
| `--outline` | `#52617a` | Borders |
| `--outline-variant` | `#3a4759` | Borders sutis |

Implementação via classe `.dark` aplicada no `<html>` antes do React hidratar (lê cookie no server). Toggle salva em localStorage + cookie para sobreviver SSR sem FOUC.

### 4.3 Tipografia

Família única: **Lexend** (Google Fonts via `next/font`).

| Estilo | Tamanho | Peso | Line height |
|--------|---------|------|-------------|
| headline-xl | 40px | 700 | 1.2 |
| headline-lg | 32px | 600 | 1.3 |
| headline-md | 24px | 600 | 1.4 |
| body-lg | 18px | 400 | 1.6 |
| body-md | 16px | 400 | 1.5 |
| label-md | 14px | 500 | 1.2 (letter-spacing 0.02em) |
| label-sm | 12px | 600 | 1.2 (letter-spacing 0.04em) |

### 4.4 Formas (radius)

- Inputs/Buttons: 8px
- Cards/Modais: 16px
- Chips/Badges: full pill (9999px)
- Sem cantos quadrados em lugar nenhum

### 4.5 Espaçamento

- Base: 4px
- Escala: xs(8) / sm(16) / md(24) / lg(32) / xl(48)
- Padding interno padrão de cards: 24px
- Gutter de grid: 24px
- Max-width do main content: 1280px

### 4.6 Elevação

- Level 0 (background): cor sólida sem shadow
- Level 1 (cards): 1px border (`outline-variant`) + shadow `0 8px 16px rgba(0,0,0,0.02)`
- Level 2 (modais/popovers): shadow `0 16px 32px rgba(0,0,0,0.06)` + backdrop blur
- InsightCards e elementos de destaque: podem usar bg de cor de container (primary-container, tertiary-container) em vez de surface puro, sem shadow extra

## 5. Componentes

### 5.1 Refatorados (existentes)

**Button**
- Variantes: `primary` (marrom + 2px border-shadow inferior tactile) / `secondary` (azul outline) / `ghost` / `danger`
- Sizes: `sm` (h-8 px-3 text-sm) / `md` (h-10 px-4) / `lg` (h-12 px-6 text-lg)
- Estado: focus ring visível, disabled com opacity 0.5

**Badge → renomeado para Chip**
- Sempre pill-shaped
- Variantes: `success` / `warning` / `danger` / `info` / `neutral`
- Cores: bg soft (container token) + texto crua escura

### 5.2 Novos

**Card** — base para tudo (white bg, 1px border outline-variant, shadow level 1, 16px radius, 24px padding)

**StatCard** — variante de Card pra dashboards: ícone + label-sm uppercase + valor headline-md + indicador de trend

**InsightCard** — card destaque (cor primary container ou tertiary container) com:
- Header: label-sm uppercase + ícone
- Título headline-md
- Body body-md
- Sub-cards internos opcionais
- CTA primário no rodapé

**Input** — bg `surface-container` sem border default. No focus: bg surface + 2px border primary. Placeholder cor muted

**ProgressBar** — 12px altura, fully rounded, track soft, fill em secondary (azul) ou success (verde) por contexto

**Avatar** — círculo, foto se houver, fallback iniciais sobre fundo derivado do hash do nome (mantém estável)

**ThemeToggle** — botão sol/lua, salva em localStorage + cookie

### 5.3 Wrappers Radix Primitives

- `Dialog` (modais com focus trap e ESC handling)
- `DropdownMenu` (menus de contexto, navegação)
- `Popover` (filtros, info adicional)
- `Tooltip` (ajuda contextual em ícones)

Os wrappers aplicam o estilo EduPulse mantendo a a11y do Radix.

## 6. Layout e navegação

### 6.1 Estrutura geral

```
[Sidebar 256px] [Main]
                  [TopBar 64px sticky]
                  [Conteúdo, max-width 1280px, padding 24px]
```

### 6.2 Sidebar

- Logo card no topo: 56px square com bg primary + ícone branco + nome "GOSF" em headline-md + tagline "INTELIGÊNCIA ACADÊMICA" em label-sm muted
- Items de nav: ícone + label, hover suave (bg surface-container), active state com bg primary-container + texto on-primary-container + barra lateral primary
- Footer: card de "Upgrade Plan" SOMENTE para role COORDINATOR (referencia plano atual + CTA)
- ThemeToggle no rodapé (acima do logout)

### 6.3 TopBar

- Esquerda: welcome message ("Olá, {primeiroNome}" + linha secundária dinâmica)
- Direita: ícone notificações (com badge contador) + avatar (dropdown com Profile/Settings/Logout)
- Sem search global por ora (não há feature de busca no backend)
- Sem trophy/achievements por ora (não há feature de gamificação)
- Reserva visual de espaço para ambos serem adicionados depois

### 6.4 Navegação por papel — mantém role-based

- **STUDENT**: Início, Plano de estudo, Avaliações, Feedbacks, Metas, Meu progresso
- **TEACHER**: Início, Minhas turmas, Avaliações, Notas, Meu desenvolvimento, Insights
- **COORDINATOR**: Visão geral, Turmas, Disciplinas, Professores, Ciclos, Notas (overview), Benchmarking, Relatórios, Configurações
- **ADMIN**: Usuários, Métricas, Privacidade, Auditoria

### 6.5 Responsive

- Desktop ≥1024px: layout completo
- Tablet 768–1023px: sidebar vira drawer (hamburger no topbar)
- Mobile <768px: sidebar drawer + topbar reduzido + cards stack vertical

## 7. Page templates

### 7.1 Auth (login, register, forgot, reset, pricing)

Split layout. Hero side com bg primary-dark + logo + headline + stats. Form side com bg surface, inputs novos, botão primário marrom.

### 7.2 Dashboard

Hero greeting + StatCards horizontais + InsightCard + grid de visualizações (charts, listas, comparativos).

### 7.3 Lista

Header + filtros em chips + search input + tabela (desktop) / card grid (mobile) + paginação + empty state.

### 7.4 Detalhe/Formulário

Header sticky com breadcrumb + nome da entidade + ações + body em tabs ou cards seccionados + bottom action bar fixa em formulários longos.

### 7.5 Settings

Sidebar interna ou tabs (Perfil/Privacidade/Notificações/Plano-pra-coordenador) + cards por seção + auto-save com toast.

## 8. Páginas específicas — dashboards principais

### 8.1 `/student`

```
[Hero: "Bem-vinda, Maria. Ciclo X aberto até DD/MM"]
[StatCards: Score Geral | Tarefas concluídas | Engajamento | Posição na turma]
[InsightCard "DESTAQUES DA SEMANA" — IA gera 3 sub-cards baseado no plano]
[Grid 2-col]
  [Mapa de Habilidades — radar chart por dimensão de avaliação]
  [Comparativo de Turma — bars eu vs média da turma]
[Evolução de Notas — line chart full-width das notas ao longo do ciclo]
```

`/student/plan` continua existindo separada para o plano IA detalhado.

### 8.2 `/teacher`

```
[Hero: "Olá, Prof. {nome}" + CTA primary "Avaliar comportamento dos alunos"]
[Grid 2-col]
  [Coluna esq: 2 StatCards] [Total alunos | Engajamento médio]
  [Coluna dir: Class Performance — bar chart por dia da semana]
[Grid 2-col]
  [Recent Evaluations — lista das últimas notas/avaliações lançadas]
  [InsightCard "AI INSIGHTS" — resumo do plano de desenvolvimento + CTA]
```

### 8.3 `/coordinator`

Mantém estrutura atual (já é bom dashboard) com restyle:
- Hero institucional + cycle status banner
- KPI grid (6 cards) — restyle
- Card de alerta de notas em risco — restyle âmbar
- Score médio por dimensão — bar chart restyled
- InsightCard novo: ações recomendadas pra coordenação (opcional, pequeno)

### 8.4 `/admin`

Restyle simples sem mudança de IA.

## 9. Plano de waves

### Wave 1 — Foundation (1,5–2 dias)
Branch: `feat/edupulse-foundation`

Indivisível: instalar Lexend, substituir tokens, ThemeProvider + toggle, refatorar Button + Badge→Chip, criar componentes novos (Card, StatCard, InsightCard, Input, ProgressBar, Avatar, ThemeToggle), adicionar Radix Primitives, restyle Sidebar + TopBar, restyle páginas auth (login, register, forgot-password, reset-password, pricing).

Critério de merge: typecheck + lint OK, todas as páginas auth funcionam visualmente nos 2 modos, toggle não causa flash branco.

### Wave 2 — Dashboards (1 dia)
Branch: `feat/edupulse-dashboards`

`/student` (refeito), `/teacher` (refeito), `/coordinator` (restyle), `/admin` (restyle). Wire dos charts (recharts) lê cor via CSS vars para suportar dark mode.

### Wave 3 — Lists, Forms, Settings (1–1,5 dias)
Branch: `feat/edupulse-lists-forms`

Aplica padrões nas restantes ~20+ páginas. Estratégia: começar pelos templates (1 lista, 1 detalhe, 1 form) e replicar.

### Wave 4 — Polish (0,5 dia)
Branch: `feat/edupulse-polish`

Empty states com SVG inline, loading skeletons, error boundaries styled, toaster restyled, notifications dropdown, validação visual final em ambos os modos.

### Total estimado: 4–5 dias

## 10. Riscos técnicos e mitigações

| Risco | Impacto | Mitigação |
|-------|---------|-----------|
| FOUC de tema no SSR | Flash branco/escuro no carregamento | Cookie de tema lido no `layout.tsx` server-side, classe `.dark` aplicada no `<html>` antes do React hidratar |
| Layout shift do Lexend | Pula visual no carregamento | Usar `next/font/google` com display swap |
| Recharts sem dark mode nativo | Charts ficam ilegíveis no dark | Wrapper que lê tokens CSS via `getComputedStyle` ou passa cores como prop |
| Sentry instrumentation conflita com ThemeProvider | Não suspeito de conflito mas vale testar | Validar em Wave 1 antes de avançar |
| Browsers antigos sem `oklch()` | Cores quebradas em Safari < 15 | Usar valores HEX/RGB conforme DESIGN.md (não OKLCH como o redesign anterior) |

## 11. Critérios de sucesso

- Todas as ~30 páginas funcionam visualmente em light e dark mode
- Toggle persiste preferência entre sessões
- Typecheck + lint + testes passam em todas as 4 waves
- Lighthouse a11y ≥ 95 nas páginas principais
- Sem FOUC perceptível no carregamento
- Feedback subjetivo: visual coerente com a referência do EduPulse, mas com identidade GOSF (sem parecer cópia)

## 12. Decisões registradas

- **Sem shadcn/ui**: identidade visual única > velocidade de implementação. Risco de a11y mitigado com Radix Primitives nos componentes críticos.
- **Toggle dark/light pelo usuário**: ambos modos primeiros-cidadãos, default light por compatibilidade com expectativa de SaaS B2B.
- **Mantém role-based nav**: não simplificar para "Dashboard/Lessons/Evaluations/Analytics/Community" do mockup — GOSF tem complexidade legítima por papel.
- **Sem search global e sem achievements/trophy nesta release**: features ainda não existem no backend; reserva espaço visual no topbar mas não implementa.
- **Phased em waves, sem feature flag**: aceita inconsistência temporária; produto ainda sem usuários reais ativos.
