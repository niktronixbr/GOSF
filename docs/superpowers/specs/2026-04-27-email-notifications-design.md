# Notificações por E-mail Automáticas — Design Spec

**Data:** 2026-04-27

---

## Objetivo

Disparar e-mails transacionais automaticamente nos dois eventos de maior impacto do MVP:

1. **Ciclo de avaliação abre** → todos os usuários ativos da instituição recebem e-mail
2. **Plano de IA gerado** → o usuário dono do plano (aluno ou professor) recebe e-mail

---

## Contexto

O `MailService` já existe em `common/mail/mail.service.ts` com `sendPasswordReset()` funcionando via nodemailer (Ethereal em dev, SMTP real em prod). Os dois serviços-alvo já disparam notificações in-app:

- `CyclesService.open()` → `notifyInstitution()` → `NotificationsService.create()` para todos da instituição
- `PlansService.generateStudentPlan/Teacher()` → `NotificationsService.create()` individual

O `MailModule` exporta `MailService` e está pronto para ser importado por qualquer módulo.

---

## Decisões de design

| Decisão | Escolha | Razão |
|---|---|---|
| Padrão de integração | Injeção direta de `MailService` | Menor mudança; segue padrão existente de injetar `NotificationsService` diretamente |
| Falha de envio | Fire-and-forget por destinatário (`Promise.allSettled`) | E-mail é efeito colateral; falha de SMTP não deve bloquear a operação de negócio |
| Destinatários ao abrir ciclo | Todos os usuários ativos da instituição | Espelha o comportamento das notificações in-app |
| Novos testes e2e | Não adicionados | MailService é mockável via `createTestApp`; validação via log de preview (Ethereal) |

---

## Arquitetura

### Arquivos modificados

| Arquivo | Mudança |
|---|---|
| `apps/api/src/common/mail/mail.service.ts` | +2 métodos: `sendEvaluationOpen`, `sendPlanReady` |
| `apps/api/src/modules/evaluations/evaluations.module.ts` | Importa `MailModule` |
| `apps/api/src/modules/evaluations/cycles.service.ts` | Injeta `MailService`; novo método privado `emailInstitution()` chamado em `open()` |
| `apps/api/src/modules/ai/ai.module.ts` | Importa `MailModule` |
| `apps/api/src/modules/ai/plans.service.ts` | Injeta `MailService`; chama `sendPlanReady()` após geração bem-sucedida |

---

## MailService — novos métodos

### `sendEvaluationOpen(to, fullName, cycleTitle)`

- **Subject:** `Novo ciclo de avaliação aberto — GOSF`
- **Body:** Informa que um novo ciclo (`cycleTitle`) foi aberto e convida o usuário a acessar o GOSF
- **CTA:** botão "Acessar GOSF" → `APP_URL`
- **Visual:** mesmo template inline HTML do `sendPasswordReset` (sem frameworks externos)

### `sendPlanReady(to, fullName, type: 'student' | 'teacher')`

- **Subject:** `Seu plano está pronto — GOSF`
- **Body:** Informa que o plano personalizado foi gerado pela IA
- **CTA:** botão "Ver meu plano"
  - `student` → `APP_URL/student/plan`
  - `teacher` → `APP_URL/teacher/development`
- **Falha logada individualmente**, nunca propaga para o caller

---

## CyclesService — `open()`

`notifyInstitution()` permanece inalterado (responsável pelas notificações in-app).

Adiciona chamada separada apenas no bloco `if (!wasOpen)`:

```ts
if (!wasOpen) {
  await this.notifyInstitution(institutionId, NotificationType.EVALUATION_OPEN, ...);
  await this.emailInstitution(institutionId, cycle.title);  // novo
}
```

### `emailInstitution(institutionId, cycleTitle)` — privado

```ts
private async emailInstitution(institutionId: string, cycleTitle: string) {
  const users = await this.db.user.findMany({
    where: { institutionId, status: 'ACTIVE' },
    select: { email: true, fullName: true },
  });
  const results = await Promise.allSettled(
    users.map(u => this.mail.sendEvaluationOpen(u.email, u.fullName, cycleTitle))
  );
  results.forEach((r, i) => {
    if (r.status === 'rejected')
      this.logger.error(`Email cycle failed: ${users[i].email}`, r.reason);
  });
}
```

---

## PlansService — `generateStudentPlan` / `generateTeacherPlan`

O `include` já traz `user.fullName`; adicionar `email: true` ao select.

Após `notifications.create()` existente (dentro do bloco `try`, após update para `READY`):

```ts
// student
await this.mail.sendPlanReady(student.user.email, student.user.fullName, 'student')
  .catch(err => this.logger.error(`Email plan failed: ${student.user.email}`, err));

// teacher
await this.mail.sendPlanReady(teacher.user.email, teacher.user.fullName, 'teacher')
  .catch(err => this.logger.error(`Email plan failed: ${teacher.user.email}`, err));
```

---

## Fora do escopo

- Preferências de e-mail por usuário (opt-out)
- E-mail ao fechar ciclo
- E-mail ao atingir meta
- Templates responsivos / multi-part (text + html)
- Fila de envio (Bull/Redis) para retry automático
