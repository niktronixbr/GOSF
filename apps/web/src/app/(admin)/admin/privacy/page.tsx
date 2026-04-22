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

const STATUS_TONE: Record<DataRequestStatus, string> = {
  PENDING: "bg-yellow-100 text-yellow-700",
  IN_PROGRESS: "bg-blue-100 text-blue-700",
  COMPLETED: "bg-green-100 text-green-700",
  REJECTED: "bg-red-100 text-red-700",
};

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
        <button
          onClick={() => onUpdate("IN_PROGRESS")}
          disabled={disabled}
          className="flex items-center gap-1 rounded-md border border-blue-200 bg-blue-50 px-2 py-1 text-xs font-medium text-blue-700 hover:bg-blue-100 disabled:opacity-50"
        >
          <Play size={11} /> Iniciar análise
        </button>
      )}
      <button
        onClick={() => onUpdate("COMPLETED")}
        disabled={disabled}
        className="flex items-center gap-1 rounded-md border border-green-200 bg-green-50 px-2 py-1 text-xs font-medium text-green-700 hover:bg-green-100 disabled:opacity-50"
      >
        <Check size={11} /> Concluir
      </button>
      <button
        onClick={() => onUpdate("REJECTED")}
        disabled={disabled}
        className="flex items-center gap-1 rounded-md border border-red-200 bg-red-50 px-2 py-1 text-xs font-medium text-red-700 hover:bg-red-100 disabled:opacity-50"
      >
        <XIcon size={11} /> Recusar
      </button>
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
          className={`rounded-full px-3 py-1 text-xs font-medium border ${
            statusFilter === "ALL"
              ? "bg-primary text-primary-foreground border-primary"
              : "border-border bg-card hover:bg-muted/40"
          }`}
        >
          Todas
        </button>
        {ALL_STATUSES.map((s) => (
          <button
            key={s}
            onClick={() => setStatusFilter(s)}
            className={`flex items-center gap-1 rounded-full px-3 py-1 text-xs font-medium border ${
              statusFilter === s
                ? "bg-primary text-primary-foreground border-primary"
                : "border-border bg-card hover:bg-muted/40"
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

      <div className="rounded-xl border border-border bg-card overflow-hidden">
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
                    <span
                      className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium ${STATUS_TONE[req.status]}`}
                    >
                      {STATUS_ICON[req.status]}
                      {STATUS_LABELS[req.status]}
                    </span>
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
      </div>
    </div>
  );
}
