# Email Notifications Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Disparar e-mails transacionais automaticamente quando um ciclo de avaliação é aberto e quando um plano de IA é gerado.

**Architecture:** Injeção direta de `MailService` em `CyclesService` e `PlansService`. Falhas de SMTP são capturadas por destinatário via `Promise.allSettled` (lote) e `.catch()` (individual), nunca propagando para a resposta HTTP.

**Tech Stack:** NestJS, nodemailer (já instalado), ConfigService (APP_URL via env)

---

## Mapa de arquivos

| Arquivo | Ação | O que muda |
|---|---|---|
| `apps/api/src/common/mail/mail.service.ts` | Modificar | +2 métodos: `sendEvaluationOpen`, `sendPlanReady` |
| `apps/api/src/modules/evaluations/evaluations.module.ts` | Modificar | Importa `MailModule` |
| `apps/api/src/modules/evaluations/cycles.service.ts` | Modificar | Injeta `MailService`; novo método privado `emailInstitution()` chamado em `open()` |
| `apps/api/src/modules/ai/ai.module.ts` | Modificar | Importa `MailModule` |
| `apps/api/src/modules/ai/plans.service.ts` | Modificar | Injeta `MailService`; seleciona `email` do usuário; chama `sendPlanReady()` pós-geração |
| `apps/api/test/evaluations.e2e-spec.ts` | Modificar | Mock de `MailService` para evitar SMTP em testes |
| `apps/api/test/ai.e2e-spec.ts` | Modificar | Mock de `MailService` para evitar SMTP em testes |

---

## Task 1: Adicionar `sendEvaluationOpen` e `sendPlanReady` ao MailService

**Files:**
- Modify: `apps/api/src/common/mail/mail.service.ts`

- [ ] **Step 1: Abrir o arquivo atual para referência**

Ler `apps/api/src/common/mail/mail.service.ts` e confirmar que a estrutura corresponde ao esperado (transporter criado no constructor, `sendPasswordReset` já implementado).

- [ ] **Step 2: Adicionar os dois novos métodos**

Adicionar após `sendPasswordReset`, ainda dentro da classe `MailService`:

```typescript
  async sendEvaluationOpen(to: string, fullName: string, cycleTitle: string) {
    const from = this.config.get('SMTP_FROM', 'GOSF <noreply@gosf.app>');
    const appUrl = this.config.get('APP_URL', 'http://localhost:3002');

    try {
      const info = await this.transporter.sendMail({
        from,
        to,
        subject: 'Novo ciclo de avaliação aberto — GOSF',
        html: `
          <div style="font-family:sans-serif;max-width:480px;margin:0 auto;padding:32px 16px">
            <h2 style="color:#111">Olá, ${fullName}</h2>
            <p style="color:#444;line-height:1.6">
              Um novo ciclo de avaliação foi aberto: <strong>${cycleTitle}</strong>.
              Acesse o GOSF para registrar suas avaliações.
            </p>
            <a href="${appUrl}"
               style="display:inline-block;margin:24px 0;padding:12px 28px;background:#4f46e5;color:#fff;text-decoration:none;border-radius:8px;font-weight:600">
              Acessar GOSF
            </a>
            <hr style="border:none;border-top:1px solid #eee;margin:24px 0"/>
            <p style="color:#bbb;font-size:12px">GOSF — Plataforma de Inteligência Educacional</p>
          </div>
        `,
      });
      this.logger.log(`Cycle email sent to ${to} [messageId=${info.messageId}]`);
      const previewUrl = nodemailer.getTestMessageUrl(info);
      if (previewUrl) this.logger.log(`Preview: ${previewUrl}`);
    } catch (err) {
      this.logger.error(`Failed to send cycle email to ${to}`, err);
      throw err;
    }
  }

  async sendPlanReady(to: string, fullName: string, type: 'student' | 'teacher') {
    const from = this.config.get('SMTP_FROM', 'GOSF <noreply@gosf.app>');
    const appUrl = this.config.get('APP_URL', 'http://localhost:3002');
    const planPath = type === 'student' ? '/student/plan' : '/teacher/development';
    const planLabel = type === 'student' ? 'plano de estudo' : 'plano de desenvolvimento';

    try {
      const info = await this.transporter.sendMail({
        from,
        to,
        subject: 'Seu plano está pronto — GOSF',
        html: `
          <div style="font-family:sans-serif;max-width:480px;margin:0 auto;padding:32px 16px">
            <h2 style="color:#111">Olá, ${fullName}</h2>
            <p style="color:#444;line-height:1.6">
              Seu ${planLabel} personalizado foi gerado pela IA do GOSF.
              Acesse para visualizar suas recomendações.
            </p>
            <a href="${appUrl}${planPath}"
               style="display:inline-block;margin:24px 0;padding:12px 28px;background:#4f46e5;color:#fff;text-decoration:none;border-radius:8px;font-weight:600">
              Ver meu plano
            </a>
            <hr style="border:none;border-top:1px solid #eee;margin:24px 0"/>
            <p style="color:#bbb;font-size:12px">GOSF — Plataforma de Inteligência Educacional</p>
          </div>
        `,
      });
      this.logger.log(`Plan email sent to ${to} [messageId=${info.messageId}]`);
      const previewUrl = nodemailer.getTestMessageUrl(info);
      if (previewUrl) this.logger.log(`Preview: ${previewUrl}`);
    } catch (err) {
      this.logger.error(`Failed to send plan email to ${to}`, err);
      throw err;
    }
  }
```

- [ ] **Step 3: Verificar que o arquivo compila**

```bash
export PATH="/c/Program Files/nodejs:$PATH" && pnpm --filter api typecheck
```

Esperado: sem erros de tipo.

- [ ] **Step 4: Commit**

```bash
git add apps/api/src/common/mail/mail.service.ts
git commit -m "feat(mail): adiciona sendEvaluationOpen e sendPlanReady"
```

---

## Task 2: Integrar MailService ao CyclesService

**Files:**
- Modify: `apps/api/src/modules/evaluations/evaluations.module.ts`
- Modify: `apps/api/src/modules/evaluations/cycles.service.ts`

- [ ] **Step 1: Importar MailModule em EvaluationsModule**

Substituir o conteúdo de `apps/api/src/modules/evaluations/evaluations.module.ts`:

```typescript
import { Module } from "@nestjs/common";
import { EvaluationsController } from "./evaluations.controller";
import { CyclesService } from "./cycles.service";
import { FormsService } from "./forms.service";
import { SubmissionsService } from "./submissions.service";
import { TargetsService } from "./targets.service";
import { NotificationsModule } from "../notifications/notifications.module";
import { AnalyticsModule } from "../analytics/analytics.module";
import { MailModule } from "../../common/mail/mail.module";

@Module({
  imports: [NotificationsModule, AnalyticsModule, MailModule],
  controllers: [EvaluationsController],
  providers: [CyclesService, FormsService, SubmissionsService, TargetsService],
  exports: [CyclesService, FormsService, SubmissionsService, TargetsService],
})
export class EvaluationsModule {}
```

- [ ] **Step 2: Injetar MailService e adicionar emailInstitution() em CyclesService**

No arquivo `apps/api/src/modules/evaluations/cycles.service.ts`:

**2a.** Adicionar o import no topo (após os imports existentes):

```typescript
import { MailService } from "../../common/mail/mail.service";
```

**2b.** Adicionar `MailService` ao constructor (após `AnalyticsService`):

```typescript
  constructor(
    private db: DatabaseService,
    private notifications: NotificationsService,
    private analytics: AnalyticsService,
    private mail: MailService,
  ) {}
```

**2c.** No método `open()`, adicionar a chamada de email após `notifyInstitution`. O bloco `if (!wasOpen)` deve ficar:

```typescript
    if (!wasOpen) {
      await this.notifyInstitution(
        institutionId,
        NotificationType.EVALUATION_OPEN,
        `Ciclo aberto: ${cycle.title}`,
        "Um novo ciclo de avaliação está disponível. Acesse para registrar suas avaliações.",
      );
      await this.emailInstitution(institutionId, cycle.title);
    }
```

**2d.** Adicionar o método privado `emailInstitution` após o método `notifyInstitution` existente:

```typescript
  private async emailInstitution(institutionId: string, cycleTitle: string) {
    const users = await this.db.user.findMany({
      where: { institutionId, status: "ACTIVE" },
      select: { email: true, fullName: true },
    });
    const results = await Promise.allSettled(
      users.map((u) => this.mail.sendEvaluationOpen(u.email, u.fullName, cycleTitle)),
    );
    results.forEach((r, i) => {
      if (r.status === "rejected")
        this.logger.error(`Email cycle failed for ${users[i].email}`, r.reason);
    });
  }
```

- [ ] **Step 3: Verificar que o arquivo compila**

```bash
export PATH="/c/Program Files/nodejs:$PATH" && pnpm --filter api typecheck
```

Esperado: sem erros de tipo.

- [ ] **Step 4: Commit**

```bash
git add apps/api/src/modules/evaluations/evaluations.module.ts apps/api/src/modules/evaluations/cycles.service.ts
git commit -m "feat(evaluations): envia e-mail ao abrir ciclo de avaliação"
```

---

## Task 3: Integrar MailService ao PlansService

**Files:**
- Modify: `apps/api/src/modules/ai/ai.module.ts`
- Modify: `apps/api/src/modules/ai/plans.service.ts`

- [ ] **Step 1: Importar MailModule em AiModule**

Substituir o conteúdo de `apps/api/src/modules/ai/ai.module.ts`:

```typescript
import { Module } from "@nestjs/common";
import { AiController } from "./ai.controller";
import { PlansService } from "./plans.service";
import { AiProviderService } from "./ai-provider.service";
import { NotificationsModule } from "../notifications/notifications.module";
import { MailModule } from "../../common/mail/mail.module";

@Module({
  imports: [NotificationsModule, MailModule],
  controllers: [AiController],
  providers: [PlansService, AiProviderService],
  exports: [PlansService, AiProviderService],
})
export class AiModule {}
```

- [ ] **Step 2: Injetar MailService em PlansService**

No arquivo `apps/api/src/modules/ai/plans.service.ts`:

**2a.** Adicionar import no topo:

```typescript
import { MailService } from "../../common/mail/mail.service";
```

**2b.** Adicionar `MailService` ao constructor:

```typescript
  constructor(
    private db: DatabaseService,
    private ai: AiProviderService,
    private notifications: NotificationsService,
    private mail: MailService,
  ) {}
```

- [ ] **Step 3: Adicionar email ao select de student e atualizar generateStudentPlan**

Em `generateStudentPlan`, alterar o `findUnique` para incluir `email` no select:

```typescript
    const student = await this.db.student.findUnique({
      where: { userId: studentUserId },
      include: { user: { select: { fullName: true, email: true } } },
    });
```

Após o bloco `await this.notifications.create(...)` (dentro do bloco `try`, após o update para `READY`), adicionar:

```typescript
      await this.mail
        .sendPlanReady(student.user.email, student.user.fullName, 'student')
        .catch((err) => this.logger.error(`Email plan failed for ${student.user.email}`, err));
```

O bloco `try` completo de `generateStudentPlan` deve ficar:

```typescript
    try {
      const output = await this.ai.generateJson(
        STUDENT_PLAN_SYSTEM,
        `Dados do aluno para geração do plano:\n\`\`\`json\n${JSON.stringify(snapshot, null, 2)}\n\`\`\``
      );

      const ready = await this.db.studentPlan.update({
        where: { id: plan.id },
        data: {
          aiOutputJson: output as any,
          status: PlanStatus.READY,
          generatedAt: new Date(),
        },
      });
      await this.notifications.create(
        studentUserId,
        NotificationType.PLAN_READY,
        "Seu plano de estudo está pronto",
        "A IA gerou seu plano personalizado. Acesse Plano de Estudo para visualizar.",
      );
      await this.mail
        .sendPlanReady(student.user.email, student.user.fullName, 'student')
        .catch((err) => this.logger.error(`Email plan failed for ${student.user.email}`, err));
      return ready;
    } catch (err) {
      this.logger.error("Failed to generate student plan", err);
      await this.db.studentPlan.update({
        where: { id: plan.id },
        data: { status: PlanStatus.FAILED },
      });
      throw err;
    }
```

- [ ] **Step 4: Adicionar email ao select de teacher e atualizar generateTeacherPlan**

Em `generateTeacherPlan`, alterar o `findUnique`:

```typescript
    const teacher = await this.db.teacher.findUnique({
      where: { userId: teacherUserId },
      include: { user: { select: { fullName: true, email: true } } },
    });
```

O bloco `try` completo de `generateTeacherPlan` deve ficar:

```typescript
    try {
      const output = await this.ai.generateJson(
        TEACHER_PLAN_SYSTEM,
        `Dados do professor para geração do plano:\n\`\`\`json\n${JSON.stringify(snapshot, null, 2)}\n\`\`\``
      );

      const ready = await this.db.teacherDevelopmentPlan.update({
        where: { id: plan.id },
        data: {
          aiOutputJson: output as any,
          status: PlanStatus.READY,
          generatedAt: new Date(),
        },
      });
      await this.notifications.create(
        teacherUserId,
        NotificationType.PLAN_READY,
        "Seu plano de desenvolvimento está pronto",
        "A IA gerou seu plano de desenvolvimento profissional. Acesse Desenvolvimento para visualizar.",
      );
      await this.mail
        .sendPlanReady(teacher.user.email, teacher.user.fullName, 'teacher')
        .catch((err) => this.logger.error(`Email plan failed for ${teacher.user.email}`, err));
      return ready;
    } catch (err) {
      this.logger.error("Failed to generate teacher plan", err);
      await this.db.teacherDevelopmentPlan.update({
        where: { id: plan.id },
        data: { status: PlanStatus.FAILED },
      });
      throw err;
    }
```

- [ ] **Step 5: Verificar que o arquivo compila**

```bash
export PATH="/c/Program Files/nodejs:$PATH" && pnpm --filter api typecheck
```

Esperado: sem erros de tipo.

- [ ] **Step 6: Commit**

```bash
git add apps/api/src/modules/ai/ai.module.ts apps/api/src/modules/ai/plans.service.ts
git commit -m "feat(ai): envia e-mail ao usuário quando plano de IA é gerado"
```

---

## Task 4: Mockar MailService nos testes e2e

**Files:**
- Modify: `apps/api/test/evaluations.e2e-spec.ts`
- Modify: `apps/api/test/ai.e2e-spec.ts`

Sem o mock, os testes tentam conexão SMTP real ao exercer `cycles.open()` e `ai.generate*()`, podendo causar timeouts. O mock evita isso sem afetar o comportamento sob teste.

- [ ] **Step 1: Criar mock inline de MailService em evaluations.e2e-spec.ts**

Adicionar o import de `MailService` e definir o mock antes do `describe`:

```typescript
import { MailService } from "../src/common/mail/mail.service";

const mockMailService = {
  sendPasswordReset: jest.fn().mockResolvedValue(undefined),
  sendEvaluationOpen: jest.fn().mockResolvedValue(undefined),
  sendPlanReady: jest.fn().mockResolvedValue(undefined),
};
```

No `beforeAll`, passar o override ao `createTestApp`:

```typescript
  beforeAll(async () => {
    app = await createTestApp([{ token: MailService, value: mockMailService }]);
    // ... resto igual
  });
```

- [ ] **Step 2: Criar mock inline de MailService em ai.e2e-spec.ts**

Adicionar o import de `MailService` junto aos imports existentes:

```typescript
import { MailService } from "../src/common/mail/mail.service";
```

Definir o mock antes do `describe`:

```typescript
const mockMailService = {
  sendPasswordReset: jest.fn().mockResolvedValue(undefined),
  sendEvaluationOpen: jest.fn().mockResolvedValue(undefined),
  sendPlanReady: jest.fn().mockResolvedValue(undefined),
};
```

No `beforeAll`, adicionar o override ao array existente de `createTestApp`:

```typescript
    app = await createTestApp([
      { token: AiProviderService, value: mockAi },
      { token: MailService, value: mockMailService },
    ]);
```

- [ ] **Step 3: Commit**

```bash
git add apps/api/test/evaluations.e2e-spec.ts apps/api/test/ai.e2e-spec.ts
git commit -m "test(e2e): mocka MailService em evaluations e ai para evitar SMTP em testes"
```

---

## Task 5: Rodar suite completa e verificar

**Files:** nenhum

- [ ] **Step 1: Rodar todos os testes e2e**

```bash
export PATH="/c/Program Files/nodejs:$PATH" && pnpm --filter api test:e2e 2>&1 | tail -30
```

Esperado: 170 testes passando (os mesmos de antes). As 4 falhas em `audit.e2e-spec.ts` são pré-existentes (HTTP 429) e não relacionadas a esta feature.

- [ ] **Step 2: Se algum teste falhar por causa do MailService**

Checar qual spec falhou. Se for um spec que ainda não tem o mock (ex: `auth.e2e-spec.ts` aciona `sendPasswordReset` mas já funcionava antes — não precisa de mock). Adicionar mock apenas ao spec afetado usando o mesmo padrão do Task 4.

- [ ] **Step 3: Push**

```bash
git push origin main
```

Esperado: push aceito, CI verde.
