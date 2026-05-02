"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  ShieldCheck,
  Clock,
  AlertCircle,
  Check,
  X as XIcon,
  Play,
  Mail,
  User as UserIcon,
} from "lucide-react";
import {
  privacyApi,
  type DataRequestStatus,
  type DataRequestType,
  type DataRequestWithUser,
} from "@/lib/api/privacy";
import { Chip } from "@/components/ui/chip";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

const TYPE_LABELS: Record<DataRequestType, string> = {
  ACCESS: "Acesso",
  CORRECTION: "Correção",
  DELETION: "Exclusão",
  PORTABILITY: "Portabilidade",
  OPPOSITION: "Oposição",
};

const STATUS_LABELS: Record<DataRequestStatus, string> = {
  PENDING: "Pendente",
  IN_PROGRESS: "Em análise",
  COMPLETED: "Concluída",
  REJECTED: "Recusada",
};

function privacyStatusVariant(
  status: DataRequestStatus,
): "warning" | "info" | "success" | "danger" | "neutral" {
  if (status === "PENDING") return "warning";
  if (status === "IN_PROGRESS") return "info";
  if (status === "COMPLETED") return "success";
  if (status === "REJECTED") return "danger";
  return "neutral";
}

const STATUS_ICON: Record<DataRequestStatus, React.ReactNode> = {
  PENDING: <Clock size={12} />,
  IN_PROGRESS: <AlertCircle size={12} />,
  COMPLETED: <Check size={12} />,
  REJECTED: <XIcon size={12} />,
};

const ALL_STATUSES: DataRequestStatus[] = [
  "PENDING",
  "IN_PROGRESS",
  "COMPLETED",
  "REJECTED",
];

function formatDate(iso: string) {
  return new Date(iso).toLocaleString("pt-BR");
}

function RequestActions({
  request,
  onUpdate,
  disabled,
}: {
  request: DataRequestWithUser;
  onUpdate: (status: DataRequestStatus) => void;
  disabled: boolean;
}) {
  const isFinal =
    request.status === "COMPLETED" || request.status === "REJECTED";
  if (isFinal) {
    return (
      <span className="text-xs text-muted-foreground">
        Finalizada em {request.resolvedAt ? formatDate(request.resolvedAt) : "—"}
      </span>
    );
  }

  return (
    <div className="flex gap-2 flex-wrap">
      {request.status === "PENDING" && (
        <Button
          onClick={() => onUpdate("IN_PROGRESS")}
          disabled={disabled}
          variant="ghost"
          size="sm"
          className="gap-1"
        >
          <Play size={11} /> Iniciar análise
        </Button>
      )}
      <Button
        onClick={() => onUpdate("COMPLETED")}
        disabled={disabled}
        variant="primary"
        size="sm"
        className="gap-1"
      >
        <Check size={11} /> Concluir
      </Button>
      <Button
        onClick={() => onUpdate("REJECTED")}
        disabled={disabled}
        variant="danger"
        size="sm"
        className="gap-1"
      >
        <XIcon size={11} /> Recusar
      </Button>
    </div>
  );
}

export default function AdminPrivacyPage() {
  const qc = useQueryClient();
  const [statusFilter, setStatusFilter] = useState<DataRequestStatus | "ALL">(
    "ALL",
  );

  const { data: requests = [], isLoading } = useQuery({
    queryKey: ["admin-data-requests", statusFilter],
    queryFn: () =>
      privacyApi.listDataRequests(
        statusFilter === "ALL" ? undefined : statusFilter,
      ),
  });

  const updateMut = useMutation({
    mutationFn: ({ id, status }: { id: string; status: DataRequestStatus }) =>
      privacyApi.updateDataRequestStatus(id, status),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin-data-requests"] });
      toast.success("Status atualizado");
    },
    onError: () => toast.error("Erro ao atualizar status"),
  });

  const counts = ALL_STATUSES.reduce<Record<DataRequestStatus, number>>(
    (acc, s) => {
      acc[s] = requests.filter((r) => r.status === s).length;
      return acc;
    },
    { PENDING: 0, IN_PROGRESS: 0, COMPLETED: 0, REJECTED: 0 },
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <ShieldCheck className="text-primary" />
        <div>
          <h1 className="text-2xl font-bold text-foreground">
            Solicitações LGPD
          </h1>
          <p className="text-sm text-muted-foreground">
            Gerencie pedidos de acesso, correção, exclusão e portabilidade.
          </p>
        </div>
      </div>

      <div className="flex items-center gap-2 flex-wrap">
        <button
          onClick={() => setStatusFilter("ALL")}
          className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
            statusFilter === "ALL"
              ? "bg-primary text-on-primary"
              : "text-muted-foreground hover:bg-surface-container"
          }`}
        >
          Todas
        </button>
        {ALL_STATUSES.map((s) => (
          <button
            key={s}
            onClick={() => setStatusFilter(s)}
            className={`flex items-center gap-1 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
              statusFilter === s
                ? "bg-primary text-on-primary"
                : "text-muted-foreground hover:bg-surface-container"
            }`}
          >
            {STATUS_ICON[s]}
            {STATUS_LABELS[s]}
            {statusFilter === "ALL" && counts[s] > 0 && (
              <span className="ml-1 rounded-full bg-background/20 px-1.5 text-[10px]">
                {counts[s]}
              </span>
            )}
          </button>
        ))}
      </div>

      <Card noPadding>
        {isLoading ? (
          <p className="p-8 text-center text-sm text-muted-foreground">
            Carregando…
          </p>
        ) : requests.length === 0 ? (
          <p className="p-8 text-center text-sm text-muted-foreground">
            Nenhuma solicitação encontrada.
          </p>
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-muted/40 text-xs uppercase tracking-wider text-muted-foreground">
              <tr>
                <th className="px-4 py-3 text-left font-medium">Quando</th>
                <th className="px-4 py-3 text-left font-medium">Solicitante</th>
                <th className="px-4 py-3 text-left font-medium">Tipo</th>
                <th className="px-4 py-3 text-left font-medium">Detalhes</th>
                <th className="px-4 py-3 text-left font-medium">Status</th>
                <th className="px-4 py-3 text-left font-medium">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {requests.map((req) => (
                <tr key={req.id} className="hover:bg-muted/30 align-top">
                  <td className="px-4 py-3 whitespace-nowrap text-muted-foreground">
                    {formatDate(req.createdAt)}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-1 text-foreground">
                      <UserIcon size={12} className="text-muted-foreground" />
                      {req.user.fullName}
                    </div>
                    <div className="flex items-center gap-1 text-xs text-muted-foreground mt-0.5">
                      <Mail size={11} /> {req.user.email}
                    </div>
                  </td>
                  <td className="px-4 py-3 text-foreground whitespace-nowrap">
                    {TYPE_LABELS[req.type]}
                  </td>
                  <td className="px-4 py-3 text-muted-foreground max-w-sm">
                    {req.details ? (
                      <span className="line-clamp-3">{req.details}</span>
                    ) : (
                      <span className="text-muted-foreground/60">—</span>
                    )}
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap">
                    <Chip variant={privacyStatusVariant(req.status)}>
                      {STATUS_ICON[req.status]}
                      {STATUS_LABELS[req.status]}
                    </Chip>
                  </td>
                  <td className="px-4 py-3">
                    <RequestActions
                      request={req}
                      disabled={updateMut.isPending}
                      onUpdate={(status) =>
                        updateMut.mutate({ id: req.id, status })
                      }
                    />
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
