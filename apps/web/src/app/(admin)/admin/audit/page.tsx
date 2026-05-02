"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { FileClock, Search, User as UserIcon, Globe } from "lucide-react";
import { auditApi, type AuditFilters } from "@/lib/api/audit";
import { Chip } from "@/components/ui/chip";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { SkeletonTable } from "@/components/ui/skeleton";
import { EmptyState } from "@/components/ui/empty-state";

function methodVariant(method: string): "info" | "success" | "warning" | "danger" | "neutral" {
  if (method === "GET") return "info";
  if (method === "POST") return "success";
  if (method === "PUT" || method === "PATCH") return "warning";
  if (method === "DELETE") return "danger";
  return "neutral";
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
      <Card>
        <div className="grid grid-cols-1 md:grid-cols-5 gap-3">
          <input
            type="text"
            placeholder="Ação (ex: LOGIN, POST)"
            value={draft.action ?? ""}
            onChange={(e) => setDraft({ ...draft, action: e.target.value })}
            className="rounded-lg border border-outline-variant bg-input px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
          />
          <input
            type="text"
            placeholder="Recurso (ex: users)"
            value={draft.resourceType ?? ""}
            onChange={(e) => setDraft({ ...draft, resourceType: e.target.value })}
            className="rounded-lg border border-outline-variant bg-input px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
          />
          <input
            type="date"
            value={draft.from ?? ""}
            onChange={(e) => setDraft({ ...draft, from: e.target.value })}
            className="rounded-lg border border-outline-variant bg-input px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
          />
          <input
            type="date"
            value={draft.to ?? ""}
            onChange={(e) => setDraft({ ...draft, to: e.target.value })}
            className="rounded-lg border border-outline-variant bg-input px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
          />
          <div className="flex gap-2">
            <Button onClick={apply} size="sm" variant="primary" className="flex-1 gap-1">
              <Search size={14} /> Filtrar
            </Button>
            <Button onClick={clear} size="sm" variant="ghost">
              Limpar
            </Button>
          </div>
        </div>
      </Card>

      {/* Tabela */}
      <Card noPadding>
        {isLoading ? (
          <SkeletonTable rows={4} />
        ) : !logs || logs.length === 0 ? (
          <EmptyState title="Nenhum registro de auditoria" description="As ações dos usuários aparecerão aqui." />
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
                    <Chip variant={methodVariant(log.action.split(" ")[0])}>
                      {log.action}
                    </Chip>
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
      </Card>
    </div>
  );
}
