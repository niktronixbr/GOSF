"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { analyticsApi, FeedbackEntry } from "@/lib/api/analytics";
import { MessageSquare, User, ChevronDown, ChevronUp } from "lucide-react";

function scoreColor(score: number) {
  if (score >= 70) return "text-green-600";
  if (score >= 50) return "text-yellow-600";
  return "text-destructive";
}

function FeedbackCard({ entry }: { entry: FeedbackEntry }) {
  const [expanded, setExpanded] = useState(false);
  const hasDetails = entry.dimensions.length > 0;

  return (
    <div className="rounded-xl border border-border bg-card shadow-sm overflow-hidden">
      <div className="p-5">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-3 min-w-0">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-muted">
              <User size={14} className="text-muted-foreground" />
            </div>
            <div className="min-w-0">
              <p className="text-sm font-medium text-foreground truncate">{entry.teacherName}</p>
              <p className="text-xs text-muted-foreground">{entry.cycleTitle}</p>
            </div>
          </div>
          <time className="text-xs text-muted-foreground shrink-0">
            {new Date(entry.submittedAt).toLocaleDateString("pt-BR", {
              day: "2-digit",
              month: "short",
              year: "numeric",
            })}
          </time>
        </div>

        {entry.comment ? (
          <blockquote className="mt-4 rounded-lg bg-muted/50 border-l-2 border-primary/40 pl-4 pr-3 py-3 text-sm text-foreground leading-relaxed italic">
            "{entry.comment}"
          </blockquote>
        ) : (
          <p className="mt-4 text-sm text-muted-foreground italic">Sem comentário nesta avaliação.</p>
        )}

        {hasDetails && (
          <button
            onClick={() => setExpanded((v) => !v)}
            className="mt-3 flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors"
          >
            {expanded ? <ChevronUp size={13} /> : <ChevronDown size={13} />}
            {expanded ? "Ocultar" : "Ver"} scores por dimensão
          </button>
        )}
      </div>

      {expanded && hasDetails && (
        <div className="border-t border-border px-5 py-3 bg-muted/30">
          <div className="grid grid-cols-2 gap-x-6 gap-y-1 sm:grid-cols-3">
            {entry.dimensions.map((d) => (
              <div key={d.dimension} className="flex justify-between text-xs py-0.5">
                <span className="text-muted-foreground capitalize">{d.dimension.replace(/_/g, " ")}</span>
                <span className={`font-semibold ${scoreColor(d.score)}`}>{d.score}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function groupByCycle(feedbacks: FeedbackEntry[]) {
  const map = new Map<string, { cycleTitle: string; entries: FeedbackEntry[] }>();
  for (const f of feedbacks) {
    if (!map.has(f.cycleId)) {
      map.set(f.cycleId, { cycleTitle: f.cycleTitle, entries: [] });
    }
    map.get(f.cycleId)!.entries.push(f);
  }
  return Array.from(map.values());
}

export default function StudentFeedbackPage() {
  const [groupBy, setGroupBy] = useState<"cycle" | "all">("cycle");

  const { data: feedbacks, isLoading } = useQuery({
    queryKey: ["student-feedbacks"],
    queryFn: () => analyticsApi.studentFeedbacks(),
  });

  if (isLoading) {
    return (
      <div className="space-y-4 animate-pulse">
        <div className="h-8 w-48 rounded-lg bg-muted" />
        {[...Array(3)].map((_, i) => (
          <div key={i} className="h-32 rounded-xl bg-muted" />
        ))}
      </div>
    );
  }

  const hasComments = feedbacks?.some((f) => f.comment);
  const total = feedbacks?.length ?? 0;
  const withComment = feedbacks?.filter((f) => f.comment).length ?? 0;
  const cycles = groupByCycle(feedbacks ?? []);

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Feedbacks recebidos</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Avaliações e comentários dos seus professores
          </p>
        </div>
        {total > 0 && (
          <div className="flex gap-2">
            <button
              onClick={() => setGroupBy("cycle")}
              className={`rounded-lg px-3 py-1.5 text-xs font-medium transition-colors ${
                groupBy === "cycle"
                  ? "bg-primary text-primary-foreground"
                  : "bg-muted text-muted-foreground hover:text-foreground"
              }`}
            >
              Por ciclo
            </button>
            <button
              onClick={() => setGroupBy("all")}
              className={`rounded-lg px-3 py-1.5 text-xs font-medium transition-colors ${
                groupBy === "all"
                  ? "bg-primary text-primary-foreground"
                  : "bg-muted text-muted-foreground hover:text-foreground"
              }`}
            >
              Todos
            </button>
          </div>
        )}
      </div>

      {total > 0 && (
        <div className="grid gap-4 sm:grid-cols-3">
          <div className="rounded-xl border border-border bg-card p-5 shadow-sm">
            <p className="text-sm text-muted-foreground">Avaliações recebidas</p>
            <p className="mt-1 text-3xl font-bold text-foreground">{total}</p>
          </div>
          <div className="rounded-xl border border-border bg-card p-5 shadow-sm">
            <p className="text-sm text-muted-foreground">Com comentário</p>
            <p className="mt-1 text-3xl font-bold text-foreground">{withComment}</p>
          </div>
          <div className="rounded-xl border border-border bg-card p-5 shadow-sm">
            <p className="text-sm text-muted-foreground">Ciclos avaliados</p>
            <p className="mt-1 text-3xl font-bold text-foreground">{cycles.length}</p>
          </div>
        </div>
      )}

      {total === 0 && (
        <div className="rounded-xl border border-border bg-card p-10 text-center space-y-3">
          <MessageSquare size={32} className="mx-auto text-muted-foreground" />
          <p className="font-medium text-foreground">Nenhum feedback recebido ainda.</p>
          <p className="text-sm text-muted-foreground">
            Os feedbacks aparecerão aqui após seus professores concluírem as avaliações.
          </p>
        </div>
      )}

      {groupBy === "cycle" && cycles.map((group) => (
        <section key={group.cycleTitle} className="space-y-3">
          <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
            {group.cycleTitle}
            <span className="ml-2 font-normal normal-case">
              · {group.entries.length} avaliação{group.entries.length !== 1 ? "ões" : ""}
            </span>
          </h2>
          {group.entries.map((entry) => (
            <FeedbackCard key={entry.id} entry={entry} />
          ))}
        </section>
      ))}

      {groupBy === "all" && (feedbacks ?? []).map((entry) => (
        <FeedbackCard key={entry.id} entry={entry} />
      ))}
    </div>
  );
}
