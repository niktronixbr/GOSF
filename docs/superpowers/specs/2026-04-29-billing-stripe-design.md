# Billing com Stripe — Design Spec

**Data:** 2026-04-29  
**Status:** Aprovado  
**Escopo:** Backend + Frontend completo (Stripe Checkout + Customer Portal)

---

## 1. Contexto

O GOSF é uma plataforma SaaS B2B para gestão de avaliações educacionais. Instituições se cadastram com `status = TRIAL`. O billing transforma o trial em assinatura paga e controla o acesso à plataforma por `Institution.status`.

---

## 2. Planos e Preços

| Plano | Limite | Mensal | Anual (≈20% desc.) |
|---|---|---|---|
| **Starter** | até 50 usuários | R$ 97/mês | R$ 77/mês (R$ 924/ano) |
| **Escola** | até 300 usuários | R$ 297/mês | R$ 237/mês (R$ 2.844/ano) |
| **Enterprise** | ilimitado | R$ 797/mês | R$ 637/mês (R$ 7.644/ano) |

- Trial: 14 dias, sem cartão, funcionalidades completas do Starter
- Enterprise: botão "Falar com vendas" (mailto), sem checkout automático
- Toggle mensal/anual na página de preços

---

## 3. Modelo de Dados

### Alterações em `Institution` (migration Prisma)

```prisma
model Institution {
  // campos existentes mantidos
  stripeCustomerId     String?   @unique
  stripeSubscriptionId String?   @unique
  stripePriceId        String?
  planName             String?   // "starter" | "escola" | "enterprise"
  billingInterval      String?   // "month" | "year"
  trialEndsAt          DateTime?
  currentPeriodEnd     DateTime?
}
```

### `Institution.status` (reaproveitado — sem alteração no enum)

| Valor | Significado |
|---|---|
| `TRIAL` | Período gratuito de 14 dias |
| `ACTIVE` | Assinatura paga e ativa |
| `SUSPENDED` | Pagamento falhou (`past_due`) |
| `INACTIVE` | Assinatura cancelada |

---

## 4. Arquitetura Backend

### Módulo `billing` (`apps/api/src/modules/billing/`)

```
billing/
  billing.module.ts
  billing.service.ts        — lógica de negócio
  billing.controller.ts     — endpoints REST autenticados
  stripe.service.ts         — wrapper Stripe SDK
  webhooks.controller.ts    — POST /webhooks/stripe (sem JWT)
  dto/
    create-checkout.dto.ts  — { planName, interval }
```

### Endpoints

| Método | Rota | Auth | Descrição |
|---|---|---|---|
| `GET` | `/billing/status` | JWT | Retorna plano, status, data de renovação |
| `POST` | `/billing/checkout` | JWT (COORDINATOR/ADMIN) | Cria Checkout Session → retorna `{ url }` |
| `POST` | `/billing/portal` | JWT (COORDINATOR/ADMIN) | Cria Portal Session → retorna `{ url }` |
| `POST` | `/webhooks/stripe` | Stripe-Signature | Processa eventos Stripe |

### Webhooks tratados

| Evento Stripe | Ação no DB |
|---|---|
| `checkout.session.completed` | `status = ACTIVE`, salva `stripeSubscriptionId`, `stripePriceId`, `planName`, `billingInterval`, `currentPeriodEnd` |
| `invoice.payment_succeeded` | Atualiza `currentPeriodEnd` |
| `invoice.payment_failed` | `status = SUSPENDED` |
| `customer.subscription.deleted` | `status = INACTIVE`, limpa campos Stripe |

### Segurança dos webhooks

- Validação via `stripe.webhooks.constructEvent(rawBody, sig, secret)`
- Endpoint sem `JwtAuthGuard` — protegido pela assinatura Stripe
- Body recebido como Buffer (raw) — configurar `rawBody: true` no Fastify/NestJS
- Retorna `400` para assinatura inválida, `200` para eventos não tratados (idempotência)

### Isolamento de instituição

- `institutionId` sempre extraído do JWT — nunca aceito como parâmetro da requisição
- Coordinator só acessa billing da própria instituição

---

## 5. Frontend

### Nova rota: `/pricing`

- Server Component puro (sem `"use client"`)
- 3 cards de planos com toggle mensal/anual (Client Component mínimo para o toggle)
- Badge "Mais popular" no plano Escola
- Botão "Assinar" → se não autenticado: redireciona para `/register?plan=escola&interval=month` (parâmetros preservados); se autenticado: `POST /billing/checkout` → `router.push(url)` para Stripe Checkout
- Botão "Falar com vendas" no Enterprise → `mailto:contato@gosf.com.br`
- Link adicionado no nav da landing page (`/`)

### Aba "Assinatura" em `/coordinator/settings`

- Card com: nome do plano, intervalo, data de renovação, status badge
- Status badges: `Em trial` (amarelo) / `Ativo` (verde) / `Suspenso` (vermelho) / `Cancelado` (cinza)
- Botão "Gerenciar assinatura" → `POST /billing/portal` → redireciona para Stripe Portal
- Banner de aviso fixo no topo se `status === SUSPENDED`

### Fluxo via `/register` (usuário não autenticado clica em "Assinar")

- `/pricing` passa `?plan=escola&interval=month` para `/register`
- `/register` exibe o plano selecionado como contexto ("Você está assinando o plano Escola")
- Após registro + auto-login, detecta os query params e chama `POST /billing/checkout` automaticamente
- Redireciona para Stripe Checkout

### Fluxo pós-checkout

- Stripe redireciona para `/coordinator?billing=success`
- Banner verde de boas-vindas aparece por 4 segundos e some

### Fluxo pós-cancelamento/gerenciamento

- Stripe redireciona para `/coordinator/settings?tab=assinatura`

---

## 6. Variáveis de Ambiente

### Backend (`apps/api/.env`)

```env
STRIPE_SECRET_KEY=sk_live_...
STRIPE_WEBHOOK_SECRET=whsec_...
STRIPE_PRICE_STARTER_MONTH=price_...
STRIPE_PRICE_STARTER_YEAR=price_...
STRIPE_PRICE_ESCOLA_MONTH=price_...
STRIPE_PRICE_ESCOLA_YEAR=price_...
STRIPE_PRICE_ENTERPRISE_MONTH=price_...
STRIPE_PRICE_ENTERPRISE_YEAR=price_...
```

### Frontend (`apps/web/.env`)

```env
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_live_...
```

---

## 7. Trial de 14 Dias

- `trialEndsAt = createdAt + 14 dias` setado em `InstitutionsService.register()` (migration adiciona campo)
- Nenhum cartão exigido durante o registro
- Após `trialEndsAt`, um job futuro (fora deste escopo) pode mudar `status = INACTIVE`
- Por ora: o frontend exibe o prazo restante na aba Assinatura; sem bloqueio automático

---

## 8. Testes e2e

Arquivo: `apps/api/test/billing.e2e-spec.ts`

Casos cobertos:
- `GET /billing/status` retorna plano e status corretos
- `POST /billing/checkout` retorna `{ url }` para coordinator autenticado
- `POST /billing/checkout` retorna 403 para role STUDENT/TEACHER
- `POST /billing/portal` retorna `{ url }` para coordinator autenticado
- `POST /webhooks/stripe` com evento `checkout.session.completed` válido → ativa institution
- `POST /webhooks/stripe` com assinatura inválida → retorna 400
- `POST /webhooks/stripe` com evento `invoice.payment_failed` → status SUSPENDED

Stripe SDK mockado via `jest.mock('stripe')` nos testes e2e.

---

## 9. O que está fora do escopo

- Bloqueio automático de acesso ao expirar o trial (job agendado — feature futura)
- Limite de usuários por plano (enforcement — feature futura)
- NF-e / nota fiscal (futuro, pode usar integração com Omie ou similar)
- Redesign geral da UI (feature separada, planejada após billing)
- Plano Enterprise com checkout automático (self-service via "falar com vendas" por ora)
