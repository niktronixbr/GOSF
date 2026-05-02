# CLAUDE.md

Guia para Claude Code neste repositório.

## Contexto on-demand

Para arquitetura e convenções de código, invoque as skills:
- **`gosf-architecture`** — módulos backend, rotas frontend, modelo de dados Prisma
- **`gosf-conventions`** — UI sem shadcn, layout padrão, validação, padrões de módulo NestJS, cliente API

## Commit e push obrigatórios

Após cada implementação de feature, correção ou alteração relevante:

1. `git add` nos arquivos modificados/criados
2. Commit com mensagem em português (`feat:`, `fix:`, `chore:`, `docs:`)
3. `git push origin main`

Não encerrar a tarefa sem commitar e fazer push.

## Stack (1-liner)

Next.js 15 + React 19 + TS + Tailwind (web :3002, sem shadcn) · NestJS Fastify + Prisma + PostgreSQL (api :3001) · Postgres :5434 + Redis :6379 (Docker) · Monorepo pnpm + Turbo.

## Comandos

```bash
# Dev (raiz — Turbo)
pnpm dev

# Apenas um app
pnpm --filter web dev
pnpm --filter api dev

# Build
pnpm build

# Lint / typecheck
pnpm lint
pnpm typecheck

# Testes (backend)
pnpm --filter api test          # unit
pnpm --filter api test:e2e      # e2e

# Banco
pnpm db:generate   # Prisma Client
pnpm db:migrate    # migrations
pnpm db:push       # sync sem migration
pnpm db:studio     # Prisma Studio
pnpm db:seed       # dados iniciais

# Docker
pnpm docker:up
pnpm docker:down
```

## Notas de ambiente

- `node` pode não estar no PATH do bash; usar `export PATH="/c/Program Files/nodejs:$PATH"` antes de `npx`
- Migrations Prisma: `export PATH="/c/Program Files/nodejs:$PATH" && npx prisma migrate dev --name <nome>` na raiz do monorepo
- `pnpm dev` via Turbo pode falhar com "cannot find binary path" — usar `pnpm --filter api dev` e `pnpm --filter web dev` separadamente
- No PowerShell, scripts `.ps1` estão bloqueados; use `cmd /c "node_modules\.bin\<bin>.CMD <args>"` para rodar binários do node_modules

## Idioma

Sempre responder em **Português do Brasil**.
