"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  ShieldCheck,
  Download,
  FileText,
  Check,
  X as XIcon,
  Clock,
  AlertCircle,
  Send,
} from "lucide-react";
import {
  privacyApi,
  type DataRequestType,
  type DataRequestStatus,
} from "@/lib/api/privacy";

const REQUEST_TYPE_LABELS: Record<DataRequestType, string> = {
  ACCESS: "Acesso aos dados",
  CORRECTION: "Correção de dados",
  DELETION: "Exclusão de dados",
  PORTABILITY: "Portabilidade de dados",
  OPPOSITION: "Oposição ao tratamento",
};

const REQUEST_TYPE_DESCRIPTIONS: Record<DataRequestType, string> = {
  ACCESS: "Solicitar acesso completo aos dados armazenados sobre você.",
  CORRECTION: "Solicitar correção de dados pessoais incorretos ou incompletos.",
  DELETION: "Solicitar a exclusão dos seus dados pessoais (direito ao esquecimento).",
  PORTABILITY: "Receber seus dados em formato estruturado para transferência.",
  OPPOSITION: "Opor-se ao tratamento dos seus dados pessoais.",
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

function formatDate(iso: string) {
  return new Date(iso).toLocaleString("pt-BR");
}

function downloadJson(data: unknown, filename: string) {
  const blob = new Blob([JSON.stringify(data, null, 2)], {
    type: "application/json",
  });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

export default function PrivacyPage() {
  const qc = useQueryClient();
  const [selectedType, setSelectedType] = useState<DataRequestType>("ACCESS");
  const [details, setDetails] = useState("");

  const { data: consents = [], isLoading: loadingConsents } = useQuery({
    queryKey: ["my-consents"],
    queryFn: privacyApi.getMyConsents,
  });

  const { data: requests = [], isLoading: loadingRequests } = useQuery({
    queryKey: ["my-data-requests"],
    queryFn: privacyApi.getMyDataRequests,
  });

  const exportMut = useMutation({
    mutationFn: privacyApi.exportMyData,
    onSuccess: (data) => {
      const timestamp = new Date().toISOString().split("T")[0];
      downloadJson(data, `gosf-meus-dados-${timestamp}.json`);
      toast.success("Exportação concluída");
    },
    onError: () => toast.error("Erro ao exportar dados"),
  });

  const createRequestMut = useMutation({
    mutationFn: privacyApi.createDataRequest,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["my-data-requests"] });
      toast.success("Solicitação enviada");
      setDetails("");
    },
    onError: () => toast.error("Erro ao enviar solicitação"),
  });

  function handleSubmitRequest(e: React.FormEvent) {
    e.preventDefault();
    createRequestMut.mutate({
      type: selectedType,
      details: details.trim() || undefined,
    });
  }

  return (
    <div className="space-y-6 max-w-4xl">
      <div className="flex items-center gap-3">
        <ShieldCheck className="text-primary" />
        <div>
          <h1 className="text-2xl font-bold text-foreground">Privacidade e LGPD</h1>
          <p className="text-sm text-muted-foreground">
            Gerencie seus dados pessoais conforme a Lei Geral de Proteção de Dados.
          </p>
        </div>
      </div>

      <section className="rounded-xl border border-border bg-card p-5">
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div>
            <div className="flex items-center gap-2">
              <Download size={18} className="text-primary" />
              <h2 className="font-semibold text-foreground">Exportar meus dados</h2>
            </div>
            <p className="text-sm text-muted-foreground mt-1 max-w-xl">
              Baixe um arquivo JSON com todos os seus dados pessoais armazenados na
              plataforma: perfil, avaliações, planos, metas, consentimentos e notificações.
            </p>
          </div>
          <button
            onClick={() => exportMut.mutate()}
            disabled={exportMut.isPending}
            className="flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground hover:opacity-90 disabled:opacity-50"
          >
            <Download size={14} />
            {exportMut.isPending ? "Gerando..." : "Baixar JSON"}
          </button>
        </div>
      </section>

      <section className="rounded-xl border border-border bg-card p-5">
        <div className="flex items-center gap-2 mb-4">
          <Send size={18} className="text-primary" />
          <h2 className="font-semibold text-foreground">Nova solicitação LGPD</h2>
        </div>

        <form onSubmit={handleSubmitRequest} className="space-y-4">
          <div>
            <label className="text-sm font-medium text-foreground mb-2 block">
              Tipo de solicitação
            </label>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
              {(Object.keys(REQUEST_TYPE_LABELS) as DataRequestType[]).map((type) => (
                <label
                  key={type}
                  className={`cursor-pointer rounded-lg border p-3 text-sm transition-colors ${
                    selectedType === type
                      ? "border-primary bg-primary/5"
                      : "border-border hover:bg-muted/40"
                  }`}
                >
                  <input
                    type="radio"
                    name="request-type"
                    value={type}
                    checked={selectedType === type}
                    onChange={() => setSelectedType(type)}
                    className="sr-only"
                  />
                  <p className="font-medium text-foreground">
                    {REQUEST_TYPE_LABELS[type]}
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    {REQUEST_TYPE_DESCRIPTIONS[type]}
                  </p>
                </label>
              ))}
            </div>
          </div>

          <div>
            <label className="text-sm font-medium text-foreground mb-2 block">
              Detalhes (opcional)
            </label>
            <textarea
              value={details}
              onChange={(e) => setDetails(e.target.value)}
              rows={3}
              maxLength={1000}
              placeholder="Descreva sua solicitação..."
              className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary resize-none"
            />
          </div>

          <button
            type="submit"
            disabled={createRequestMut.isPending}
            className="flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground hover:opacity-90 disabled:opacity-50"
          >
            <Send size={14} />
            {createRequestMut.isPending ? "Enviando..." : "Enviar solicitação"}
          </button>
        </form>
      </section>

      <section className="rounded-xl border border-border bg-card p-5">
        <div className="flex items-center gap-2 mb-4">
          <FileText size={18} className="text-primary" />
          <h2 className="font-semibold text-foreground">Minhas solicitações</h2>
        </div>

        {loadingRequests ? (
          <p className="text-sm text-muted-foreground">Carregando...</p>
        ) : requests.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            Você ainda não fez nenhuma solicitação.
          </p>
        ) : (
          <div className="space-y-2">
            {requests.map((req) => (
              <div
                key={req.id}
                className="rounded-lg border border-border p-3 flex items-start justify-between gap-3 flex-wrap"
              >
                <div className="min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className="font-medium text-sm text-foreground">
                      {REQUEST_TYPE_LABELS[req.type]}
                    </p>
                    <span
                      className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium ${STATUS_TONE[req.status]}`}
                    >
                      {STATUS_ICON[req.status]}
                      {STATUS_LABELS[req.status]}
                    </span>
                  </div>
                  {req.details && (
                    <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                      {req.details}
                    </p>
                  )}
                  <p className="text-xs text-muted-foreground mt-1">
                    Enviada em {formatDate(req.createdAt)}
                    {req.resolvedAt && ` · Resolvida em ${formatDate(req.resolvedAt)}`}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      <section className="rounded-xl border border-border bg-card p-5">
        <div className="flex items-center gap-2 mb-4">
          <Check size={18} className="text-primary" />
          <h2 className="font-semibold text-foreground">Meus consentimentos</h2>
        </div>

        {loadingConsents ? (
          <p className="text-sm text-muted-foreground">Carregando...</p>
        ) : consents.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            Nenhum consentimento registrado ainda.
          </p>
        ) : (
          <div className="space-y-2">
            {consents.map((c) => (
              <div
                key={c.id}
                className="rounded-lg border border-border p-3 flex items-start justify-between gap-3 flex-wrap"
              >
                <div className="min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className="font-medium text-sm text-foreground">{c.purpose}</p>
                    <span className="text-xs text-muted-foreground">v{c.version}</span>
                    <span
                      className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium ${
                        c.accepted
                          ? "bg-green-100 text-green-700"
                          : "bg-red-100 text-red-700"
                      }`}
                    >
                      {c.accepted ? <Check size={12} /> : <XIcon size={12} />}
                      {c.accepted ? "Aceito" : "Recusado"}
                    </span>
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">
                    Registrado em {formatDate(c.recordedAt)}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
