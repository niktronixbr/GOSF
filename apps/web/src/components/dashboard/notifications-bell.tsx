"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { Bell, Check, CheckCheck, X } from "lucide-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { notificationsApi, type Notification } from "@/lib/api/notifications";
import { getValidAccessToken } from "@/lib/auth/session";
import { formatDistanceToNow } from "date-fns";
import { ptBR } from "date-fns/locale";
import { SkeletonTableRow } from "@/components/ui/skeleton";
import { EmptyState } from "@/components/ui/empty-state";

const API_URL =
  process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3001/api/v1";

const typeLabels: Record<string, string> = {
  EVALUATION_OPEN: "Avaliação aberta",
  EVALUATION_REMINDER: "Lembrete",
  PLAN_READY: "Plano pronto",
  FEEDBACK_RECEIVED: "Feedback recebido",
  SYSTEM: "Sistema",
};

function useNotificationStream(onNotification: (n: Notification) => void) {
  const cbRef = useRef(onNotification);
  useEffect(() => {
    cbRef.current = onNotification;
  });

  useEffect(() => {
    let active = true;
    let abort: AbortController | null = null;

    async function connect() {
      if (!active) return;
      abort = new AbortController();
      try {
        const token = await getValidAccessToken();
        if (!token || !active) return;

        const res = await fetch(`${API_URL}/notifications/stream`, {
          headers: { Authorization: `Bearer ${token}` },
          signal: abort.signal,
        });

        if (!res.ok || !res.body) throw new Error("stream failed");

        const reader = res.body.getReader();
        const decoder = new TextDecoder();
        let buffer = "";

        while (active) {
          const { done, value } = await reader.read();
          if (done) break;
          buffer += decoder.decode(value, { stream: true });
          const lines = buffer.split("\n");
          buffer = lines.pop() ?? "";
          for (const line of lines) {
            if (line.startsWith("data: ")) {
              try {
                cbRef.current(JSON.parse(line.slice(6)) as Notification);
              } catch {}
            }
          }
        }
      } catch {
        // reconecta após 5s se ainda ativo
      }
      if (active) setTimeout(connect, 5_000);
    }

    connect();
    return () => {
      active = false;
      abort?.abort();
    };
  }, []);
}

export function NotificationsBell() {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const qc = useQueryClient();

  const handleNotification = useCallback(() => {
    qc.invalidateQueries({ queryKey: ["notifications-unread"] });
    qc.invalidateQueries({ queryKey: ["notifications"] });
  }, [qc]);

  useNotificationStream(handleNotification);

  const { data: unreadData } = useQuery({
    queryKey: ["notifications-unread"],
    queryFn: notificationsApi.countUnread,
    refetchInterval: 60_000,
  });

  const { data: notifications, isLoading } = useQuery({
    queryKey: ["notifications"],
    queryFn: notificationsApi.list,
    enabled: open,
  });

  const markRead = useMutation({
    mutationFn: (id: string) => notificationsApi.markRead(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["notifications"] });
      qc.invalidateQueries({ queryKey: ["notifications-unread"] });
    },
  });

  const markAllRead = useMutation({
    mutationFn: notificationsApi.markAllRead,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["notifications"] });
      qc.invalidateQueries({ queryKey: ["notifications-unread"] });
    },
  });

  useEffect(() => {
    function onClickOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", onClickOutside);
    return () => document.removeEventListener("mousedown", onClickOutside);
  }, []);

  const unread = unreadData?.count ?? 0;

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen((o) => !o)}
        className="relative flex h-9 w-9 items-center justify-center rounded-lg text-muted-foreground hover:bg-surface-container hover:text-foreground transition-colors"
        aria-label="Notificações"
      >
        <Bell size={20} />
        {unread > 0 && (
          <span className="absolute right-1 top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-primary px-1 text-[10px] font-bold text-on-primary leading-none">
            {unread > 99 ? "99+" : unread}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 top-11 z-50 w-80 rounded-xl border border-outline-variant bg-surface shadow-lg">
          <div className="flex items-center justify-between border-b border-outline-variant px-4 py-3">
            <h3 className="text-sm font-semibold">Notificações</h3>
            <div className="flex items-center gap-2">
              {unread > 0 && (
                <button
                  onClick={() => markAllRead.mutate()}
                  disabled={markAllRead.isPending}
                  className="flex items-center gap-1 rounded-md px-2 py-1 text-xs text-muted-foreground hover:bg-surface-container transition-colors disabled:opacity-50"
                  title="Marcar todas como lidas"
                >
                  <CheckCheck size={13} />
                  Todas lidas
                </button>
              )}
              <button
                onClick={() => setOpen(false)}
                className="flex h-6 w-6 items-center justify-center rounded-md text-muted-foreground hover:bg-surface-container transition-colors"
              >
                <X size={14} />
              </button>
            </div>
          </div>

          <div className="max-h-[420px] overflow-y-auto">
            {isLoading && (
              <div className="py-2">
                <SkeletonTableRow />
                <SkeletonTableRow />
                <SkeletonTableRow />
              </div>
            )}

            {!isLoading && (!notifications || notifications.length === 0) && (
              <EmptyState title="Sem notificações" description="Você está em dia!" />
            )}

            {notifications?.map((n: Notification) => (
              <NotificationItem
                key={n.id}
                notification={n}
                onMarkRead={() => markRead.mutate(n.id)}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function NotificationItem({
  notification: n,
  onMarkRead,
}: {
  notification: Notification;
  onMarkRead: () => void;
}) {
  const isUnread = !n.readAt;

  return (
    <div
      className={`flex gap-3 border-b border-outline-variant/60 px-4 py-3 last:border-b-0 ${
        isUnread ? "bg-primary/5" : ""
      }`}
    >
      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <span className="inline-block rounded-full bg-surface-container px-2 py-0.5 text-[10px] font-medium text-muted-foreground mb-1">
              {typeLabels[n.type] ?? n.type}
            </span>
            <p className={`text-sm ${isUnread ? "font-semibold" : "font-medium"} truncate`}>
              {n.title}
            </p>
            <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">{n.body}</p>
          </div>
          {isUnread && (
            <button
              onClick={onMarkRead}
              className="shrink-0 flex h-6 w-6 items-center justify-center rounded-md text-muted-foreground hover:bg-surface-container hover:text-primary transition-colors mt-0.5"
              title="Marcar como lida"
            >
              <Check size={13} />
            </button>
          )}
        </div>
        <p className="mt-1 text-[11px] text-muted-foreground/70">
          {formatDistanceToNow(new Date(n.createdAt), { addSuffix: true, locale: ptBR })}
        </p>
      </div>
    </div>
  );
}
