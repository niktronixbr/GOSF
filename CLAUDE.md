# GOSF — Instruções para o Claude Code

## Commit e push obrigatórios

Após cada implementação de feature, correção ou qualquer alteração relevante no código:

1. Fazer `git add` nos arquivos modificados/criados
2. Criar um commit com mensagem descritiva em português (estilo: `feat:`, `fix:`, `chore:`)
3. Fazer `git push origin main`

Não encerrar a tarefa sem commitar e fazer push. Confirmar o push ao final da resposta.

## Stack

- Frontend: Next.js 15 + React 19 + TypeScript + Tailwind + shadcn/ui (porta 3002)
- Backend: NestJS + Prisma + PostgreSQL (porta 3001)
- DB: PostgreSQL Docker porta 5434
- Redis Docker porta 6379

## Padrões de código

- Sem comentários desnecessários
- Sem abstrações prematuras
- Client components apenas quando necessário (use client)
- Validação com Zod nas fronteiras de entrada
- Sempre responder em Português do Brasil
