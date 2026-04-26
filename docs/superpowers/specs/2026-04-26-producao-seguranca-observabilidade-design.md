# Design: Pronto para Produção — Segurança + Observabilidade

**Data:** 2026-04-26
**Status:** Aprovado
**Escopo:** API NestJS (`apps/api`)

---

## Contexto

O pipeline CI/CD via GitHub Actions + GHCR está configurado. O próximo passo é tornar a API segura e observável antes do primeiro deploy em produção. Este spec cobre três capacidades independentes que serão implementadas juntas.

---

## 1. Rate Limiting

**Biblioteca:** `@nestjs/throttler`

### Configuração

Dois limitadores nomeados registrados globalmente no `AppModule`:

| Throttler | Limite | Janela | Aplicado em |
|---|---|---|---|
| `default` | 200 req | 60s | Todas as rotas (guard global) |
| `auth` | 5 req | 60s | Endpoints de autenticação sensíveis |

### Endpoints com throttler `auth`

- `POST /api/v1/auth/login`
- `POST /api/v1/auth/forgot-password`
- `POST /api/v1/auth/reset-password`

### Exceções

- `GET /api/v1/health` — `@SkipThrottle()` para não bloquear health checks do Docker/Nginx

### Comportamento

- Excedido o limite → `429 Too Many Requests` (automático pelo guard)
- Estado dos contadores em memória do processo (sem Redis por enquanto)
- Identificação por IP do cliente

### Arquivos a modificar

- `apps/api/src/app.module.ts` — registrar `ThrottlerModule` e `ThrottlerGuard` global
- `apps/api/src/modules/auth/auth.controller.ts` — adicionar `@Throttle({ auth: ... })` nos três endpoints

---

## 2. Health Check

**Biblioteca:** `@nestjs/terminus`

### Endpoint

```
GET /api/v1/health
```

Público — sem autenticação, sem rate limiting (`@SkipThrottle()`).

### Resposta de sucesso (200)

```json
{
  "status": "ok",
  "info": {},
  "details": {}
}
```

### Resposta de falha (503)

```json
{
  "status": "error",
  "error": { "app": { "status": "down" } }
}
```

### Implementação

- Novo módulo `HealthModule` com `HealthController`
- Usa `TerminusModule` com ping HTTP para si mesmo (indicador simples)
- Registrado no `AppModule`

### Arquivos a criar

- `apps/api/src/modules/health/health.module.ts`
- `apps/api/src/modules/health/health.controller.ts`

### Evolução futura (fora deste escopo)

Quando necessário, adicionar `PrismaHealthIndicator` e `RedisHealthIndicator` ao `HealthController` sem reescrever nada — terminus é extensível por design.

---

## 3. Logs Estruturados

**Bibliotecas:** `nestjs-pino`, `pino-http`, `pino-pretty` (dev)

### Formato por ambiente

| Ambiente | Formato | Ferramenta |
|---|---|---|
| `production` | JSON puro (uma linha por evento) | `pino` |
| `development` | Pretty-print colorido | `pino-pretty` |

### Exemplo produção

```json
{"level":"info","time":1714123456789,"pid":1,"req":{"method":"POST","url":"/api/v1/auth/login"},"res":{"statusCode":200},"responseTime":42,"msg":"request completed"}
```

### Configuração

- Nível controlado pela variável `LOG_LEVEL` (default: `info` em prod, `debug` em dev)
- Transporte automático via `nestjs-pino` — sem alteração nas chamadas existentes de `this.logger`

### Redação de campos sensíveis

Os seguintes campos são **sempre removidos dos logs**, independente de onde apareçam:

- `password`
- `authorization`
- `token`
- `refreshToken`

### O que é logado por requisição (automático)

- Método HTTP, URL, status code, tempo de resposta em ms
- `userId` e `role` quando o usuário está autenticado (via request context do NestJS)

### Arquivos a modificar

- `apps/api/src/app.module.ts` — substituir logger padrão por `LoggerModule` do nestjs-pino
- `apps/api/src/main.ts` — usar `Logger` do nestjs-pino no bootstrap

---

## Dependências a instalar

```bash
pnpm --filter api add @nestjs/throttler @nestjs/terminus nestjs-pino pino-http
pnpm --filter api add -D pino-pretty
```

---

## Ordem de implementação

1. Instalar dependências
2. Rate limiting — `ThrottlerModule` no `AppModule` + decorators no `auth.controller.ts`
3. Health check — criar `HealthModule` e registrar no `AppModule`
4. Logs — configurar `LoggerModule` no `AppModule` e atualizar `main.ts`
5. Testes manuais (curl) para validar os três pontos
6. Commit + push

---

## Critérios de aceitação

- [ ] `POST /api/v1/auth/login` com 6+ requisições em 60s retorna `429`
- [ ] `GET /api/v1/health` retorna `{ "status": "ok" }` sem autenticação
- [ ] Logs em produção são JSON válido (verificável com `docker logs gosf_prod_api | jq .`)
- [ ] Campos `password` e `authorization` não aparecem em nenhum log
- [ ] Nenhuma rota existente quebrou
