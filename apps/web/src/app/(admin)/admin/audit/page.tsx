"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { FileClock, Search, User as UserIcon, Globe } from "lucide-react";
import { auditApi, type AuditFilters } from "@/lib/api/audit";

function methodTone(method: string): string {
  if (method.startsWith("POST")) return "bg-green-100 text-green-700";
  if (method.startsWith("PATCH") || method.startsWith("PUT")) return "bg-blue-100 text-blue-700";
  if (method.startsWith("DELETE")) return "bg-red-100 text-red-700";
  if (method === "LOGIN") return "bg-emerald-100 text-emerald-700";
  if (method === "LOGOUT") return "bg-gray-200 text-gray-700";
  return "bg-muted text-muted-foreground";
}

export default function AuditPage() {
  const [filters, setFilters] = useState<AuditFilters>({});
  const [draft, setDraft] = useState<AuditFilters>({});

  const { data: logs, isLoading } = useQuery({
    queryKey: ["audit-logs", filters],
    queryFn: () => auditApi.list(filters),
  });

  const apply = () => setFilters(draft);
  const clear = () => {
    setDraft({});
    setFilters({});
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <FileClock className="text-primary" />
        <div>
          <h1 className="text-2xl font-bold text-foreground">Auditoria</h1>
          <p className="text-sm text-muted-foreground">
            Registro de ações sensíveis na instituição (LGPD).
          </p>
        </div>
      </div>

      {/* Filtros */}
      <div className="rounded-xl border border-border bg-card p-4 grid grid-cols-1 md:grid-cols-5 gap-3">
        <input
          type="text"
          placeholder="Ação (ex: LOGIN, POST)"
          value={draft.action ?? ""}
          onChange={(e) => setDraft({ ...draft, action: e.target.value })}
          className="rounded-lg border border-border bg-background px-3 py-2 text-sm"
        />
        <input
          type="text"
          placeholder="Recurso (ex: users)"
          value={draft.resourceType ?? ""}
          onChange={(e) => setDraft({ ...draft, resourceType: e.target.value })}
          className="rounded-lg border border-border bg-background px-3 py-2 text-sm"
        />
        <input
          type="date"
          value={draft.from ?? ""}
          onChange={(e) => setDraft({ ...draft, from: e.target.value })}
          className="rounded-lg border border-border bg-background px-3 py-2 text-sm"
        />
        <input
          type="date"
          value={draft.to ?? ""}
          onChange={(e) => setDraft({ ...draft, to: e.target.value })}
          className="rounded-lg border border-border bg-background px-3 py-2 text-sm"
        />
        <div className="flex gap-2">
          <button
            onClick={apply}
            className="flex items-center justify-center gap-1 flex-1 rounded-lg bg-primary px-3 py-2 text-sm font-semibold text-primary-foreground hover:opacity-90"
          >
            <Search size={14} /> Filtrar
          </button>
          <button
            onClick={clear}
            className="rounded-lg border border-border px-3 py-2 text-sm text-muted-foreground hover:bg-muted"
          >
            Limpar
          </button>
        </div>
      </div>

      {/* Tabela */}
      <div className="rounded-xl border border-border bg-card overflow-hidden">
        {isLoading ? (
          <p className="p-8 text-center text-sm text-muted-foreground">Carregando…</p>
        ) : !logs || logs.length === 0 ? (
          <p className="p-8 text-center text-sm text-muted-foreground">
            Nenhum registro encontrado.
          </p>
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-muted/40 text-xs uppercase tracking-wider text-muted-foreground">
              <tr>
                <th className="px-4 py-3 text-left font-medium">Quando</th>
                <th className="px-4 py-3 text-left font-medium">Ação</th>
                <th className="px-4 py-3 text-left font-medium">Recurso</th>
                <th className="px-4 py-3 text-left font-medium">Usuário</th>
                <th className="px-4 py-3 text-left font-medium">IP</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {logs.map((log) => (
                <tr key={log.id} className="hover:bg-muted/30">
                  <td className="px-4 py-3 whitespace-nowrap text-muted-foreground">
                    {new Date(log.createdAt).toLocaleString("pt-BR")}
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={`rounded-full px-2 py-0.5 text-xs font-medium ${methodTone(log.action.split(" ")[0])}`}
                    >
                      {log.action}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-foreground">
                    {log.resourceType}
                    {log.resourceId && (
                      <span className="ml-1 text-xs text-muted-foreground">#{log.resourceId.slice(0, 8)}</span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">
                    {log.actorUserId ? (
                      <span className="flex items-center gap-1">
                        <UserIcon size={12} /> {log.actorUserId.slice(0, 8)}
                      </span>
                    ) : (
                      <span className="text-muted-foreground/60">—</span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">
                    {log.ipAddress ? (
                      <span className="flex items-center gap-1">
                        <Globe size={12} /> {log.ipAddress}
                      </span>
                    ) : (
                      <span className="text-muted-foreground/60">—</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
