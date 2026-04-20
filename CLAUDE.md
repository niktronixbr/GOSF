# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commit e push obrigatórios

Após cada implementação de feature, correção ou qualquer alteração relevante no código:

1. Fazer `git add` nos arquivos modificados/criados
2. Criar um commit com mensagem descritiva em português (estilo: `feat:`, `fix:`, `chore:`)
3. Fazer `git push origin main`

Não encerrar a tarefa sem commitar e fazer push. Confirmar o push ao final da resposta.

## Stack

- Frontend: Next.js 15 + React 19 + TypeScript + Tailwind (porta 3002) — **sem shadcn/ui**
- Backend: NestJS (Fastify) + Prisma + PostgreSQL (porta 3001)
- DB: PostgreSQL Docker porta 5434
- Redis Docker porta 6379
- Monorepo: pnpm workspaces + Turbo

## Comandos

```bash
# Desenvolvimento (raiz — sobe tudo via Turbo)
pnpm dev

# Apenas frontend ou backend
pnpm --filter web dev
pnpm --filter api dev

# Build
pnpm build

# Lint / typecheck
pnpm lint
pnpm typecheck

# Testes (backend)
pnpm --filter api test          # unitários
pnpm --filter api test:e2e      # e2e

# Banco de dados
pnpm db:generate   # gera o Prisma Client
pnpm db:migrate    # aplica migrations
pnpm db:push       # sync schema sem migration
pnpm db:studio     # Prisma Studio
pnpm db:seed       # popula dados iniciais

# Docker
pnpm docker:up
pnpm docker:down
```

## Notas de ambiente

- `node` pode não estar no PATH do terminal bash; usar `export PATH="/c/Program Files/nodejs:$PATH"` antes de `npx` se necessário
- Migrations Prisma: `export PATH="/c/Program Files/nodejs:$PATH" && npx prisma migrate dev --name <nome>` rodado na raiz do monorepo

## Arquitetura

### Estrutura do monorepo

```
apps/
  web/    — Next.js 15 (App Router)
  api/    — NestJS
packages/
  database/  — Prisma schema + client compartilhado
  shared/    — tipos e utilitários comuns
```

### Frontend (`apps/web/src`)

**Roteamento por papel** via App Router:
- `/(auth)` — login, forgot-password, reset-password
- `/(student)/student/*` — aluno: avaliações, metas, progresso, feedback, plano
- `/(teacher)/teacher/*` — professor: avaliações, desenvolvimento, turmas, insights
- `/(coordinator)/coordinator/*` — coordenador: ciclos, professores, turmas, relatórios, configurações
- `/(admin)/admin` — gestão de usuários

**Layout padrão** (student/teacher/coordinator/admin):
```tsx
<div className="flex h-screen overflow-hidden">
  <Sidebar />
  <div className="flex flex-1 flex-col overflow-hidden">
    <TopBar />
    <main className="flex-1 overflow-y-auto p-6 bg-muted/20">{children}</main>
  </div>
</div>
```

**Camadas principais:**
- `lib/api/client.ts` — cliente HTTP base (Bearer token, auto-refresh, classe `ApiError`)
- `lib/api/` — wrappers por domínio: analytics, evaluations, coordinator, goals, notifications, admin
- `lib/auth/` — gerenciamento de sessão e tokens JWT
- `store/` — estado global com Zustand (auth)
- `features/` — componentes de feature (login-form, evaluation-form…)
- `components/dashboard/` — sidebar, top-bar, notifications-bell

**Regra:** `"use client"` somente quando necessário.

### Backend (`apps/api/src`)

Módulos NestJS implementados:
- `auth` — JWT + Passport (access 15 min / refresh 7 dias) + forgot/reset password via e-mail
- `users` — CRUD completo (create cria perfil Student/Teacher automaticamente)
- `institutions` — multi-tenancy por `institutionId`
- `classes` — ClassGroup, Subject, Enrollment, ClassAssignment
- `evaluations` — ciclos (DRAFT→OPEN→CLOSED→ARCHIVED), formulários, submissões
- `analytics` — ScoreAggregate por dimensão/ciclo
- `ai` — planos gerados pelo Claude (Anthropic SDK)
- `goals` — StudentGoal CRUD
- `notifications` — CRUD de notificações in-app (findAll, countUnread, markRead, markAllRead, create)
- `privacy` — stub LGPD
- `audit` — stub AuditLog

Infraestrutura comum:
- `common/guards/` — JwtAuthGuard, RolesGuard
- `common/decorators/` — @CurrentUser, @Roles
- `common/filters/`
- `common/mail/` — MailService (nodemailer SMTP; vars: SMTP_HOST/PORT/SECURE/USER/PASS/FROM, APP_URL)

### Modelo de dados (Prisma)

Entidades principais:
- `User` (roles: STUDENT/TEACHER/COORDINATOR/ADMIN) → pertence a `Institution`
- `Student` / `Teacher` — relação 1:1 com User
- `ClassGroup`, `Subject`, `Enrollment`, `ClassAssignment`
- `EvaluationCycle`, `EvaluationForm`, `EvaluationQuestion`
- `TeacherEvaluation` (aluno avalia professor) / `StudentEvaluation` (professor avalia aluno)
- `ScoreAggregate` — analytics computados
- `StudentPlan` / `TeacherDevelopmentPlan` — JSON gerados por IA
- `Notification` — notificações in-app por usuário
- `RefreshToken`, `PasswordResetToken` — auth tokens
- `ConsentRecord`, `DataRequest`, `AuditLog`

## Padrões de código

- **Sem shadcn/ui** — HTML nativo + Tailwind puro. Ver `apps/web/src/app/(student)/student/goals/page.tsx` como referência
- Sem comentários desnecessários
- Sem abstrações prematuras
- `"use client"` apenas quando necessário
- Validação com Zod nas fronteiras de entrada (frontend) e class-validator nos DTOs (backend)
- Sempre responder em Português do Brasil
