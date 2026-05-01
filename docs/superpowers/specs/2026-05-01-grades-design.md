# Módulo de Notas — Design

## Objetivo

Adicionar ao GOSF um fluxo completo de lançamento e visualização de notas acadêmicas (0–10, múltiplas avaliações com peso), com gráficos de médias e integração automática com o plano de estudo gerado pela IA.

## Arquitetura

Módulo NestJS `grades` standalone. Média ponderada calculada na camada de serviço (sem tabela materializada). Ao salvar nota, o `GradesService` dispara `AiService.generateStudentPlan()` de forma assíncrona para regenerar o plano do aluno.

**Tech Stack:** NestJS + Prisma + PostgreSQL (backend) · Next.js 15 App Router + TanStack Query (frontend) · Claude Sonnet 4.6 (IA)

---

## Modelo de Dados

```prisma
model Grade {
  id        String   @id @default(cuid())
  studentId String
  subjectId String
  cycleId   String
  teacherId String
  title     String   // "Prova 1", "Trabalho Final"
  weight    Float    // 0.0–1.0
  value     Float    // 0.0–10.0
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  student Student         @relation(fields: [studentId], references: [id])
  subject Subject         @relation(fields: [subjectId], references: [id])
  cycle   EvaluationCycle @relation(fields: [cycleId], references: [id])
  teacher Teacher         @relation(fields: [teacherId], references: [id])

  @@unique([studentId, subjectId, cycleId, title])
  @@index([studentId, cycleId])
  @@index([teacherId, cycleId])
}
```

**Média ponderada:** `Σ(value × weight) / Σ(weight)` — normaliza pelos pesos existentes, permitindo lançamento parcial (ex: só Prova 1 lançada ainda).

---

## API

Módulo `grades` com controller, service e DTOs próprios.

| Método | Rota | Role | Descrição |
|--------|------|------|-----------|
| `POST` | `/grades` | TEACHER | Upsert de avaliação por `studentId+subjectId+cycleId+title` |
| `DELETE` | `/grades/:id` | TEACHER | Remove avaliação |
| `GET` | `/grades/students` | TEACHER | Alunos das turmas do professor com notas do ciclo ativo, agrupados por turma/disciplina |
| `GET` | `/grades/my` | STUDENT | Notas do aluno autenticado no ciclo ativo, agrupadas por disciplina com média ponderada |
| `GET` | `/grades/overview` | COORDINATOR | Médias por turma/disciplina + lista de combinações abaixo de 6.0 |

**DTO de criação:**
```typescript
class CreateGradeDto {
  studentId: string;   // student.id
  subjectId: string;
  cycleId: string;
  title: string;       // min 2 chars
  weight: number;      // 0.01–1.0
  value: number;       // 0–10
}
```

**Trigger assíncrono:** após upsert bem-sucedido, `GradesService` chama `AiService.generateStudentPlan(studentId, cycleId)` sem await. Erros de geração são logados mas não propagados para o caller.

---

## Frontend

### Professor — `/teacher/grades`

Nova entrada no menu lateral do professor (entre "Avaliações" e "Desenvolvimento").

**Fluxo:**
1. Página lista turmas do professor com cards expansíveis.
2. Card de turma mostra: nome da turma, disciplina, contagem de alunos, média da turma.
3. Alunos em risco (média < 6.0) destacados em vermelho.
4. Clique em um aluno abre modal/drawer com formulário de lançamento:
   - Lista das avaliações já lançadas (título, peso, nota, botão de exclusão)
   - Formulário para nova avaliação: Título · Peso (%) · Nota (0–10) · botão Salvar
   - Média ponderada atualizada em tempo real na UI

### Aluno — `/student/plan`

A página do plano de estudos ganha uma seção no topo **antes** do plano da IA:

- Título "Minhas notas — Ciclo X"
- Gráfico de barras horizontais: uma barra por disciplina, cor por faixa (vermelho < 6, amarelo 6–7.9, verde ≥ 8)
- Cada barra mostra a média ponderada e, ao expandir, lista as avaliações individuais com peso e valor
- Se nenhuma nota foi lançada ainda: placeholder "Notas ainda não disponíveis para este ciclo"
- O plano da IA abaixo menciona as disciplinas fracas identificadas nas notas

### Coordenador — Dashboard `/coordinator`

Card de alerta adicionado ao dashboard quando houver turmas/disciplinas com média < 6.0:

```
⚠ 2 turmas abaixo da média em Português
3ºA · média 4.8  |  2ºB · média 5.1  →  Ver relatório
```

Sem alerta quando todas as médias ≥ 6.0.

### Coordenador — `/coordinator/reports`

Nova aba "Notas" na página de relatórios existente:

- Gráfico de barras por turma/disciplina com média
- Tabela de ranking: aluno · disciplina · média · status (Em Risco / Regular / Bom)
- Filtro por turma e por disciplina
- Ordenação por média (crescente para identificar alunos em risco)

---

## Integração com IA

### Snapshot atualizado (`StudentPlanInput`)

```typescript
interface StudentPlanInput {
  studentName: string;
  cycleId: string;
  scores: { dimension: string; score: number }[];   // avaliações qualitativas (formulários)
  comments: string[];
  totalEvaluations: number;
  grades: {                                          // NOVO
    subject: string;
    assessments: { title: string; weight: number; value: number }[];
    weightedAverage: number;
  }[];
}
```

Se não houver notas lançadas, `grades` é array vazio — o plano é gerado só com os scores qualitativos (comportamento atual).

### Atualização no prompt (`STUDENT_PLAN_SYSTEM`)

Instrução adicional inserida no system prompt:

> "Quando o campo `grades` contiver dados, identifique as disciplinas com `weightedAverage` abaixo de 6.0 como prioridade urgente no `seven_day_plan`. Disciplinas acima de 8.0 são pontos fortes acadêmicos e devem aparecer em `strengths`. Integre o diagnóstico acadêmico com o diagnóstico comportamental dos `scores` para um plano coerente."

---

## Regras de Negócio

- Um professor só pode lançar notas de alunos das turmas onde tem `ClassAssignment` ativo
- O ciclo precisa existir (qualquer status — professor pode lançar notas em ciclos DRAFT ou OPEN)
- `weight` não precisa somar 1.0 — a média é normalizada pelos pesos existentes
- `@@unique([studentId, subjectId, cycleId, title])` — título duplicado na mesma combinação faz upsert, não cria nova linha
- Exclusão de nota: apenas o professor que criou pode deletar (`teacherId` verificado no service)

---

## Arquivos a Criar/Modificar

**Backend:**
- `packages/database/prisma/schema.prisma` — adicionar model `Grade`
- `apps/api/src/modules/grades/grades.module.ts` — novo
- `apps/api/src/modules/grades/grades.controller.ts` — novo
- `apps/api/src/modules/grades/grades.service.ts` — novo
- `apps/api/src/modules/grades/dto/create-grade.dto.ts` — novo
- `apps/api/src/app.module.ts` — importar `GradesModule`
- `apps/api/src/modules/ai/ai.service.ts` — atualizar `buildStudentSnapshot()` para incluir grades
- `apps/api/src/modules/ai/prompts.ts` — atualizar `STUDENT_PLAN_SYSTEM`

**Frontend:**
- `apps/web/src/lib/api/grades.ts` — novo (cliente HTTP para o módulo grades)
- `apps/web/src/app/(teacher)/teacher/grades/page.tsx` — novo
- `apps/web/src/components/dashboard/sidebar.tsx` — adicionar item "Notas" no menu do professor
- `apps/web/src/app/(student)/student/plan/page.tsx` — adicionar seção de notas no topo
- `apps/web/src/app/(coordinator)/coordinator/page.tsx` — adicionar card de alerta
- `apps/web/src/app/(coordinator)/coordinator/reports/page.tsx` — adicionar aba "Notas"
