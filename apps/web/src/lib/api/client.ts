import { getValidAccessToken } from "@/lib/auth/session";

const API_URL = "/api/v1";

let handling402 = false;

export class ApiError extends Error {
  constructor(
    public status: number,
    message: string
  ) {
    super(message);
    this.name = "ApiError";
  }
}

async function handle402() {
  if (handling402) return;
  handling402 = true;

  try {
    const { useAuthStore } = await import("@/store/auth.store");
    const role = useAuthStore.getState().user?.role;

    if (role === "ADMIN") {
      window.location.href = "/admin/billing";
    } else if (role === "COORDINATOR") {
      window.location.href = "/coordinator/settings";
    } else {
      alert("A assinatura da sua escola está suspensa. Contate o coordenador.");
      handling402 = false;
    }
  } catch {
    window.location.href = "/admin/billing";
  }
}

async function request<T>(
  path: string,
  options: RequestInit & { skipAuth?: boolean } = {}
): Promise<T> {
  const { skipAuth, ...init } = options;

  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...(init.headers as Record<string, string>),
  };

  if (!skipAuth) {
    const token = await getValidAccessToken();
    if (token) headers["Authorization"] = `Bearer ${token}`;
  }

  const res = await fetch(`${API_URL}${path}`, { ...init, headers });

  if (!res.ok) {
    if (res.status === 402) {
      handle402();
      throw new ApiError(402, "Assinatura suspensa ou cancelada.");
    }
    const error = await res.json().catch(() => ({ message: "Request failed" }));
    throw new ApiError(res.status, error.message ?? "Request failed");
  }

  if (res.status === 204) return undefined as T;
  return res.json();
}

export const api = {
  get: <T>(path: string) => request<T>(path),
  post: <T>(path: string, body: unknown, skipAuth = false) =>
    request<T>(path, {
      method: "POST",
      body: JSON.stringify(body),
      skipAuth,
    }),
  patch: <T>(path: string, body: unknown) =>
    request<T>(path, { method: "PATCH", body: JSON.stringify(body) }),
  put: <T>(path: string, body: unknown) =>
    request<T>(path, { method: "PUT", body: JSON.stringify(body) }),
  delete: <T>(path: string) => request<T>(path, { method: "DELETE" }),
};
