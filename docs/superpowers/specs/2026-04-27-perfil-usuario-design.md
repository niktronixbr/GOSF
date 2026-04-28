# Perfil do Usuário — Design Spec

**Data:** 2026-04-27

---

## Objetivo

Permitir que qualquer usuário autenticado edite seu nome e foto de perfil (via URL externa), e troque sua senha, através de uma página `/settings/profile`.

---

## Contexto

O backend já possui todos os endpoints necessários:
- `GET /api/v1/users/me` — retorna dados do usuário logado
- `PATCH /api/v1/users/me` — atualiza `fullName` e/ou `avatarUrl` (aceita URL externa)
- `PATCH /api/v1/users/me/password` — troca senha (recebe `currentPassword` + `newPassword`); retorna 204

O `settings/layout.tsx` já existe com Sidebar + TopBar. A página `/settings/privacy` já usa esse layout.

---

## Arquitetura

### Arquivos a criar

| Arquivo | Responsabilidade |
|---|---|
| `apps/web/src/app/settings/profile/page.tsx` | Página com dois blocos: dados pessoais e alterar senha |
| `apps/api/test/users.e2e-spec.ts` | Testes e2e para PATCH /users/me e PATCH /users/me/password |

### Arquivos a modificar

| Arquivo | Mudança |
|---|---|
| `apps/web/src/app/settings/layout.tsx` | Adicionar sub-nav "Perfil / Privacidade" acima do `{children}` |
| `apps/web/src/lib/api/users.ts` | Adicionar `getMe()`, `updateProfile()`, `changePassword()` |

---

## UI — `/settings/profile`

### Sub-navegação no settings layout

Adicionar barra horizontal simples acima do conteúdo das páginas de settings:

```
[Perfil]  [Privacidade]
```

Links com estilo ativo baseado no pathname atual (`usePathname`).

### Bloco 1 — Dados pessoais

- Preview circular da foto:
  - Se `avatarUrl` for uma URL válida e não vazia: renderiza `<img src={avatarUrl} />`
  - Caso contrário: círculo com iniciais do nome (primeiras letras de cada palavra)
- Campo: `Nome completo` (fullName) — mínimo 2 caracteres
- Campo: `URL da foto` — texto livre; placeholder `https://...`
- Botão "Salvar alterações":
  - Desabilitado enquanto os valores são iguais ao carregado do servidor
  - Mostra feedback inline de sucesso ("Perfil atualizado") ou erro

### Bloco 2 — Alterar senha

- Campo: `Senha atual`
- Campo: `Nova senha`
- Campo: `Confirmar nova senha`
- Validação frontend: nova senha e confirmação devem coincidir antes de enviar
- Botão "Alterar senha":
  - Sucesso: 204, limpa os campos, mostra "Senha alterada com sucesso"
  - 401: mostra "Senha atual incorreta" abaixo do campo `Senha atual`
  - 400: mostra mensagem de validação inline

### Tratamento de erros

| Código HTTP | Mensagem exibida |
|---|---|
| 400 | Mensagem do campo problemático (ex: "avatarUrl must be a URL address") |
| 401 | "Senha atual incorreta" |
| 5xx | "Erro inesperado. Tente novamente." |

---

## API Client — `lib/api/users.ts`

Adicionar três funções ao arquivo existente:

```ts
getMe(): Promise<User>
// GET /users/me

updateProfile(dto: { fullName?: string; avatarUrl?: string }): Promise<User>
// PATCH /users/me

changePassword(dto: { currentPassword: string; newPassword: string }): Promise<void>
// PATCH /users/me/password — espera 204
```

---

## Testes e2e — `apps/api/test/users.e2e-spec.ts`

| Teste | Expectativa |
|---|---|
| `GET /users/me` autenticado | 200, retorna id/email/fullName/role |
| `GET /users/me` sem token | 401 |
| `PATCH /users/me` com fullName válido | 200, retorna fullName atualizado |
| `PATCH /users/me` com avatarUrl inválida (não-URL) | 400 |
| `PATCH /users/me/password` com senha correta | 204 |
| `PATCH /users/me/password` com senha atual errada | 401 |
| `PATCH /users/me/password` com nova senha muito curta | 400 |

Usar `loginAs()` do helper `create-app.ts` para autenticação nos testes.

---

## O que está fora do escopo

- Upload de arquivo (S3/R2) — postergar para quando storage estiver configurado em produção
- Notificações por e-mail de mudança de perfil
- Foto de perfil gerada automaticamente (Gravatar, etc.)
- Exclusão de conta
