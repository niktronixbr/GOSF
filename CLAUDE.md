# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commit e push obrigatórios

Após cada implementação de feature, correção ou qualquer alteração relevante no código:

1. Fazer `git add` nos arquivos modificados/criados
2. Criar um commit com mensagem descritiva em português (estilo: `feat:`, `fix:`, `chore:`)
3. Fazer `git push origin main`

Não encerrar a tarefa sem commitar e fazer push. Confirmar o push ao final da resposta.

## Stack

- Frontend: Next.js 15 + React 19 + TypeScript + Tailwind + shadcn/ui (porta 3002)
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
- `/(auth)` — login
- `/(student)/student/*` — aluno: avaliações, metas, progresso, feedback, plano
- `/(teacher)/teacher/*` — professor: avaliações, desenvolvimento, turmas, insights
- `/(coordinator)/coordinator/*` — coordenador: ciclos, professores, turmas, relatórios, configurações

**Camadas principais:**
- `lib/api/client.ts` — cliente HTTP base (Bearer token de cookie, auto-refresh, classe `ApiError`)
- `lib/api/` — wrappers por domínio (evaluations, analytics, coordinator)
- `lib/auth/` — gerenciamento de sessão e tokens JWT
- `store/` — estado global com Zustand (auth)
- `features/` — componentes de feature (login-form, evaluation-form…)
- `components/` — UI reutilizável (sidebar, providers)

**Regra:** `"use client"` somente quando necessário.

### Backend (`apps/api/src`)

Módulos NestJS:
- `auth` — JWT + Passport (access 15 min / refresh 7 dias)
- `users` / `institutions` — multi-tenancy por `institutionId`
- `classes` — ClassGroup, Subject, Enrollment, ClassAssignment
- `evaluations` — ciclos (DRAFT→OPEN→CLOSED→ARCHIVED), formulários, submissões, targets
- `analytics` — ScoreAggregate por dimensão/ciclo
- `ai` — planos gerados pelo Claude (Anthropic SDK)
- `notifications` — Bull queue + Redis
- `privacy` — LGPD (ConsentRecord, DataRequest)
- `audit` — AuditLog por instituição

Infraestrutura comum: `common/guards/` (JwtAuthGuard, RolesGuard), `common/decorators/` (@CurrentUser, @Roles), `common/filters/`.

### Modelo de dados (Prisma)

Entidades principais:
- `User` (roles: STUDENT/TEACHER/COORDINATOR/ADMIN) → pertence a `Institution`
- `Student` / `Teacher` — relação 1:1 com User
- `ClassGroup`, `Subject`, `Enrollment`, `ClassAssignment`
- `EvaluationCycle`, `EvaluationForm`, `EvaluationQuestion`
- `TeacherEvaluation` (aluno avalia professor) / `StudentEvaluation` (professor avalia aluno)
- `ScoreAggregate` — analytics computados
- `StudentPlan` / `TeacherDevelopmentPlan` — JSON gerados por IA
- `Notification`, `ConsentRecord`, `DataRequest`, `AuditLog`

## Padrões de código

- Sem comentários desnecessários
- Sem abstrações prematuras
- `"use client"` apenas quando necessário
- Validação com Zod nas fronteiras de entrada (frontend) e class-validator nos DTOs (backend)
- Sempre responder em Português do Brasil
