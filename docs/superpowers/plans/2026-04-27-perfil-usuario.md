# Perfil do Usuário — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Permitir que qualquer usuário autenticado edite nome e foto de perfil (via URL externa) e troque a senha através de `/settings/profile`.

**Architecture:** Backend já tem todos os endpoints (`GET/PATCH /users/me`, `PATCH /users/me/password`) e `lib/api/users.ts` já exporta `usersApi.getMe()`, `usersApi.updateProfile()` e `usersApi.changePassword()`. O trabalho é: (1) testes e2e do módulo users, (2) sub-nav no settings layout, (3) página `/settings/profile`.

**Tech Stack:** NestJS + Prisma (backend), Next.js 15 App Router + React Query + Tailwind + Sonner (frontend), Jest via `app.inject` (e2e)

---

## Mapa de arquivos

| Arquivo | Ação | Responsabilidade |
|---|---|---|
| `apps/api/test/users.e2e-spec.ts` | Criar | e2e: GET /users/me, PATCH /users/me, PATCH /users/me/password |
| `apps/web/src/app/settings/layout.tsx` | Modificar | Adicionar sub-nav "Perfil / Privacidade" |
| `apps/web/src/app/settings/profile/page.tsx` | Criar | Formulário de dados pessoais + troca de senha |

`apps/web/src/lib/api/users.ts` **não precisa de alteração** — já tem as 3 funções necessárias.

---

### Task 1: e2e do módulo users

**Files:**
- Create: `apps/api/test/users.e2e-spec.ts`

**Context:**
- Endpoints já implementados no backend:
  - `GET /api/v1/users/me` → 200 com `{ id, email, fullName, role, status, avatarUrl, lastLoginAt, createdAt }`
  - `PATCH /api/v1/users/me` → UpdateProfileDto: `fullName` (`@IsOptional @IsString @MinLength(2)`) e `avatarUrl` (`@IsOptional @IsUrl()`); retorna 200 com usuário atualizado
  - `PATCH /api/v1/users/me/password` → ChangePasswordDto: `currentPassword` (string) e `newPassword` (`@MinLength(6)`); retorna 204; lança 401 se senha errada; lança 400 se nova senha igual à atual
- Helpers em `apps/api/test/helpers/create-app.ts`: `createTestApp()`, `closeTestApp(app)`, `loginAs(app, role)` (retorna `{ accessToken, refreshToken }`)
- Credenciais seed: `aluno@escolademo.com` / `Admin@1234`
- O teste de troca de senha bem-sucedida deve restaurar a senha original logo após, para não quebrar outros testes que usam `loginAs("student")`

- [ ] **Step 1: Criar o arquivo de testes**

```typescript
// apps/api/test/users.e2e-spec.ts
import { NestFastifyApplication } from "@nestjs/platform-fastify";
import { createTestApp, closeTestApp, loginAs } from "./helpers/create-app";

describe("Users (e2e)", () => {
  let app: NestFastifyApplication;
  let token: string;

  beforeAll(async () => {
    app = await createTestApp();
    const auth = await loginAs(app, "student");
    token = auth.accessToken;
  });

  afterAll(async () => {
    await closeTestApp(app);
  });

  describe("GET /api/v1/users/me", () => {
    it("retorna 200 com dados do usuário autenticado", async () => {
      const res = await app.inject({
        method: "GET",
        url: "/api/v1/users/me",
        headers: { authorization: `Bearer ${token}` },
      });
      expect(res.statusCode).toBe(200);
      const body = res.json();
      expect(body).toMatchObject({ email: "aluno@escolademo.com", role: "STUDENT" });
      expect(body.id).toBeDefined();
      expect(body.fullName).toBeDefined();
    });

    it("retorna 401 sem token", async () => {
      const res = await app.inject({ method: "GET", url: "/api/v1/users/me" });
      expect(res.statusCode).toBe(401);
    });
  });

  describe("PATCH /api/v1/users/me", () => {
    it("atualiza fullName com sucesso (200)", async () => {
      const res = await app.inject({
        method: "PATCH",
        url: "/api/v1/users/me",
        headers: { authorization: `Bearer ${token}` },
        payload: { fullName: "Aluno Atualizado" },
      });
      expect(res.statusCode).toBe(200);
      expect(res.json().fullName).toBe("Aluno Atualizado");
    });

    it("atualiza avatarUrl com URL válida (200)", async () => {
      const res = await app.inject({
        method: "PATCH",
        url: "/api/v1/users/me",
        headers: { authorization: `Bearer ${token}` },
        payload: { avatarUrl: "https://example.com/avatar.png" },
      });
      expect(res.statusCode).toBe(200);
      expect(res.json().avatarUrl).toBe("https://example.com/avatar.png");
    });

    it("retorna 400 com avatarUrl inválida (não é URL)", async () => {
      const res = await app.inject({
        method: "PATCH",
        url: "/api/v1/users/me",
        headers: { authorization: `Bearer ${token}` },
        payload: { avatarUrl: "nao-e-uma-url" },
      });
      expect(res.statusCode).toBe(400);
    });
  });

  describe("PATCH /api/v1/users/me/password", () => {
    it("retorna 401 com senha atual errada", async () => {
      const res = await app.inject({
        method: "PATCH",
        url: "/api/v1/users/me/password",
        headers: { authorization: `Bearer ${token}` },
        payload: { currentPassword: "SenhaErrada123", newPassword: "NovaSenha@1" },
      });
      expect(res.statusCode).toBe(401);
    });

    it("retorna 400 com nova senha muito curta (menos de 6 chars)", async () => {
      const res = await app.inject({
        method: "PATCH",
        url: "/api/v1/users/me/password",
        headers: { authorization: `Bearer ${token}` },
        payload: { currentPassword: "Admin@1234", newPassword: "123" },
      });
      expect(res.statusCode).toBe(400);
    });

    it("troca senha com sucesso (204) e restaura senha original", async () => {
      const res = await app.inject({
        method: "PATCH",
        url: "/api/v1/users/me/password",
        headers: { authorization: `Bearer ${token}` },
        payload: { currentPassword: "Admin@1234", newPassword: "Admin@5678_tmp" },
      });
      expect(res.statusCode).toBe(204);

      // Restaura a senha original para não quebrar outros testes
      const restore = await app.inject({
        method: "PATCH",
        url: "/api/v1/users/me/password",
        headers: { authorization: `Bearer ${token}` },
        payload: { currentPassword: "Admin@5678_tmp", newPassword: "Admin@1234" },
      });
      expect(restore.statusCode).toBe(204);
    });
  });
});
```

- [ ] **Step 2: Rodar os testes**

```bash
cd apps/api && export PATH="/c/Program Files/nodejs:$PATH" && npx jest --testPathPattern="users.e2e-spec" --config jest-e2e.json --runInBand
```

Expected: `Tests: 7 passed, 7 total` (os endpoints já existem, todos devem passar de imediato).

- [ ] **Step 3: Commit e push**

```bash
git add apps/api/test/users.e2e-spec.ts
git commit -m "test(users): e2e para GET /users/me, PATCH /users/me e PATCH /users/me/password"
git push origin main
```

---

### Task 2: Sub-nav no settings layout

**Files:**
- Modify: `apps/web/src/app/settings/layout.tsx`

**Context:** O arquivo atual (14 linhas) renderiza `<Sidebar />`, `<TopBar />` e `<main>{children}</main>` sem `"use client"`. Adicionar barra de sub-navegação horizontal entre `<TopBar />` e `<main>`, com links "Perfil" (`/settings/profile`) e "Privacidade" (`/settings/privacy`). O link ativo tem `border-primary text-primary`; os inativos têm `border-transparent text-muted-foreground`. Precisa de `"use client"` para usar `usePathname`.

- [ ] **Step 1: Reescrever o layout**

Substituir todo o conteúdo de `apps/web/src/app/settings/layout.tsx` por:

```tsx
"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Sidebar } from "@/components/dashboard/sidebar";
import { TopBar } from "@/components/dashboard/top-bar";

const NAV_ITEMS = [
  { href: "/settings/profile", label: "Perfil" },
  { href: "/settings/privacy", label: "Privacidade" },
];

export default function SettingsLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  return (
    <div className="flex h-screen overflow-hidden">
      <Sidebar />
      <div className="flex flex-1 flex-col overflow-hidden">
        <TopBar />
        <div className="border-b border-border px-6">
          <nav className="flex gap-1">
            {NAV_ITEMS.map(({ href, label }) => (
              <Link
                key={href}
                href={href}
                className={`px-3 py-3 text-sm font-medium border-b-2 -mb-px transition-colors ${
                  pathname === href
                    ? "border-primary text-primary"
                    : "border-transparent text-muted-foreground hover:text-foreground"
                }`}
              >
                {label}
              </Link>
            ))}
          </nav>
        </div>
        <main className="flex-1 overflow-y-auto p-6 bg-muted/20">{children}</main>
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Verificar TypeScript**

```bash
cd apps/web && export PATH="/c/Program Files/nodejs:$PATH" && npx tsc --noEmit 2>&1 | head -20
```

Expected: sem erros.

- [ ] **Step 3: Commit e push**

```bash
git add apps/web/src/app/settings/layout.tsx
git commit -m "feat(settings): sub-navegação Perfil / Privacidade no layout"
git push origin main
```

---

### Task 3: Página `/settings/profile`

**Files:**
- Create: `apps/web/src/app/settings/profile/page.tsx`

**Context:**
- `usersApi` está em `apps/web/src/lib/api/users.ts`:
  ```ts
  usersApi.getMe()                                    // GET /users/me → UserProfile
  usersApi.updateProfile({ fullName?, avatarUrl? })   // PATCH /users/me → UserProfile
  usersApi.changePassword(currentPassword, newPassword) // PATCH /users/me/password → void (204)
  ```
  Onde `UserProfile = { id, email, fullName, avatarUrl: string | null, role }`.
- Seguir padrão de `apps/web/src/app/settings/privacy/page.tsx`: `"use client"`, `useQuery`/`useMutation` do `@tanstack/react-query`, `toast` do `sonner`, seções `rounded-xl border border-border bg-card p-5`.
- Preview de avatar: se `avatarUrl` começar com `"http"`, renderizar `<img>`; caso contrário, exibir iniciais (primeiras letras de cada palavra do fullName em fundo `bg-primary/10`).
- Botão "Salvar alterações": desabilitado se `fullName === data.fullName && avatarUrl === (data.avatarUrl ?? "")`.
- Erro da API no `updateProfile` — `err.response.message` pode ser string ou array de strings (class-validator retorna array); usar `Array.isArray(msg) ? msg[0] : msg`.
- Troca de senha: validar `newPassword === confirmPassword` no frontend antes de chamar a API. Se API retornar 401 → "Senha atual incorreta"; se 400 → mensagem da API.
- A `changePassword` lança erro com `status` ou `response.statusCode` no objeto de erro do client HTTP (`ApiError`). Verificar `err?.status ?? err?.response?.statusCode` para detectar 401.

- [ ] **Step 1: Criar a página**

```tsx
// apps/web/src/app/settings/profile/page.tsx
"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { UserCircle, KeyRound } from "lucide-react";
import { usersApi } from "@/lib/api/users";

function getInitials(name: string): string {
  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0].toUpperCase())
    .join("");
}

function AvatarPreview({ avatarUrl, fullName }: { avatarUrl: string; fullName: string }) {
  if (avatarUrl.startsWith("http")) {
    return (
      <img
        src={avatarUrl}
        alt={fullName}
        className="h-20 w-20 rounded-full object-cover border border-border"
      />
    );
  }
  return (
    <div className="h-20 w-20 rounded-full bg-primary/10 flex items-center justify-center border border-border">
      <span className="text-xl font-bold text-primary">
        {fullName ? getInitials(fullName) : "?"}
      </span>
    </div>
  );
}

export default function ProfilePage() {
  const qc = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ["me"],
    queryFn: usersApi.getMe,
  });

  const [fullName, setFullName] = useState("");
  const [avatarUrl, setAvatarUrl] = useState("");
  const [initialized, setInitialized] = useState(false);

  if (data && !initialized) {
    setFullName(data.fullName ?? "");
    setAvatarUrl(data.avatarUrl ?? "");
    setInitialized(true);
  }

  const profileDirty =
    fullName !== (data?.fullName ?? "") ||
    avatarUrl !== (data?.avatarUrl ?? "");

  const updateMut = useMutation({
    mutationFn: () =>
      usersApi.updateProfile({
        ...(fullName !== data?.fullName && { fullName }),
        ...(avatarUrl !== (data?.avatarUrl ?? "") && { avatarUrl: avatarUrl || undefined }),
      }),
    onSuccess: (updated) => {
      qc.setQueryData(["me"], updated);
      toast.success("Perfil atualizado");
    },
    onError: (err: any) => {
      const msg = err?.response?.message ?? "Erro ao salvar";
      toast.error(Array.isArray(msg) ? msg[0] : msg);
    },
  });

  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [passwordError, setPasswordError] = useState("");

  const passwordMut = useMutation({
    mutationFn: () => usersApi.changePassword(currentPassword, newPassword),
    onSuccess: () => {
      toast.success("Senha alterada com sucesso");
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
      setPasswordError("");
    },
    onError: (err: any) => {
      const status = err?.status ?? err?.response?.statusCode;
      if (status === 401) {
        setPasswordError("Senha atual incorreta");
      } else {
        const msg = err?.response?.message ?? "Erro ao alterar senha";
        setPasswordError(Array.isArray(msg) ? msg[0] : msg);
      }
    },
  });

  function handlePasswordSubmit(e: React.FormEvent) {
    e.preventDefault();
    setPasswordError("");
    if (newPassword !== confirmPassword) {
      setPasswordError("As senhas não coincidem");
      return;
    }
    passwordMut.mutate();
  }

  if (isLoading) {
    return (
      <div className="max-w-2xl">
        <p className="text-sm text-muted-foreground">Carregando...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-2xl">
      <div className="flex items-center gap-3">
        <UserCircle className="text-primary" />
        <div>
          <h1 className="text-2xl font-bold text-foreground">Meu perfil</h1>
          <p className="text-sm text-muted-foreground">
            Atualize seu nome e foto de perfil.
          </p>
        </div>
      </div>

      <section className="rounded-xl border border-border bg-card p-5 space-y-4">
        <h2 className="font-semibold text-foreground">Dados pessoais</h2>

        <div className="flex items-center gap-4">
          <AvatarPreview avatarUrl={avatarUrl} fullName={fullName} />
          <p className="text-xs text-muted-foreground">
            Cole a URL de uma foto para atualizar o avatar.
          </p>
        </div>

        <div className="space-y-3">
          <div>
            <label className="text-sm font-medium text-foreground mb-1 block">
              Nome completo
            </label>
            <input
              type="text"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
            />
          </div>

          <div>
            <label className="text-sm font-medium text-foreground mb-1 block">
              URL da foto de perfil
            </label>
            <input
              type="url"
              value={avatarUrl}
              onChange={(e) => setAvatarUrl(e.target.value)}
              placeholder="https://..."
              className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
            />
          </div>
        </div>

        <button
          onClick={() => updateMut.mutate()}
          disabled={!profileDirty || updateMut.isPending}
          className="rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground hover:opacity-90 disabled:opacity-50"
        >
          {updateMut.isPending ? "Salvando..." : "Salvar alterações"}
        </button>
      </section>

      <section className="rounded-xl border border-border bg-card p-5 space-y-4">
        <div className="flex items-center gap-2">
          <KeyRound size={18} className="text-primary" />
          <h2 className="font-semibold text-foreground">Alterar senha</h2>
        </div>

        <form onSubmit={handlePasswordSubmit} className="space-y-3">
          <div>
            <label className="text-sm font-medium text-foreground mb-1 block">
              Senha atual
            </label>
            <input
              type="password"
              value={currentPassword}
              onChange={(e) => {
                setCurrentPassword(e.target.value);
                setPasswordError("");
              }}
              required
              className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
            />
          </div>

          <div>
            <label className="text-sm font-medium text-foreground mb-1 block">
              Nova senha
            </label>
            <input
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              required
              minLength={6}
              className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
            />
          </div>

          <div>
            <label className="text-sm font-medium text-foreground mb-1 block">
              Confirmar nova senha
            </label>
            <input
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
              className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
            />
          </div>

          {passwordError && (
            <p className="text-sm text-red-600">{passwordError}</p>
          )}

          <button
            type="submit"
            disabled={passwordMut.isPending}
            className="rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground hover:opacity-90 disabled:opacity-50"
          >
            {passwordMut.isPending ? "Alterando..." : "Alterar senha"}
          </button>
        </form>
      </section>
    </div>
  );
}
```

- [ ] **Step 2: Verificar TypeScript**

```bash
cd apps/web && export PATH="/c/Program Files/nodejs:$PATH" && npx tsc --noEmit 2>&1 | head -20
```

Expected: sem erros relacionados ao arquivo novo. Se houver erros, corrigi-los antes de continuar.

- [ ] **Step 3: Commit e push**

```bash
git add apps/web/src/app/settings/profile/page.tsx
git commit -m "feat(settings): página de edição de perfil e troca de senha"
git push origin main
```

---

### Task 4: Verificação final

**Files:** nenhum arquivo novo

- [ ] **Step 1: Rodar toda a suite e2e**

```bash
cd apps/api && export PATH="/c/Program Files/nodejs:$PATH" && npx jest --config jest-e2e.json --runInBand 2>&1 | tail -20
```

Expected: todos os testes passando. As 4 falhas pré-existentes em `audit.e2e-spec.ts` (HTTP 429) são conhecidas e não relacionadas a este trabalho — ignorar.

- [ ] **Step 2: Confirmar push**

Verificar que os 3 commits das tasks anteriores estão no remoto:

```bash
git log --oneline origin/main | head -5
```

Expected: os 3 commits aparecem no topo (`test(users)`, `feat(settings): sub-nav`, `feat(settings): página de perfil`).
