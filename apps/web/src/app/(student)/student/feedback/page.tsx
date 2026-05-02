"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { analyticsApi, FeedbackEntry } from "@/lib/api/analytics";
import { MessageSquare, ChevronDown, ChevronUp } from "lucide-react";
import { scoreVariant } from "@/lib/score-color";
import { Chip } from "@/components/ui/chip";
import { SkeletonTable } from "@/components/ui/skeleton";
import { EmptyState } from "@/components/ui/empty-state";

function FeedbackCard({ entry }: { entry: FeedbackEntry }) {
  const [expanded, setExpanded] = useState(false);
  const hasDetails = entry.dimensions.length > 0;

  return (
    <div className="rounded-2xl border border-outline-variant bg-surface overflow-hidden">
      <div className="p-5">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="text-sm font-semibold text-foreground">{entry.cycleTitle}</p>
            <p className="text-xs text-muted-foreground mt-0.5">Avaliação anônima</p>
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
          <blockquote className="mt-4 rounded-lg bg-surface-container border-l-2 border-primary/40 pl-4 pr-3 py-3 text-sm text-foreground leading-relaxed italic">
            &ldquo;{entry.comment}&rdquo;
          </blockquote>
        ) : (
          <p className="mt-4 text-sm text-muted-foreground italic">Sem comentário nesta avaliação.</p>
        )}

        {hasDetails && (
          <button
            type="button"
            onClick={() => setExpanded((v) => !v)}
            className="mt-3 flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors"
          >
            {expanded ? <ChevronUp size={13} /> : <ChevronDown size={13} />}
            {expanded ? "Ocultar" : "Ver"} scores por dimensão
          </button>
        )}
      </div>

      {expanded && hasDetails && (
        <div className="border-t border-outline-variant px-5 py-3 bg-surface-container/50">
          <div className="grid grid-cols-2 gap-x-6 gap-y-2 sm:grid-cols-3">
            {entry.dimensions.map((d) => (
              <div key={d.dimension} className="flex items-center justify-between text-xs py-0.5 gap-2">
                <span className="text-muted-foreground capitalize">{d.dimension.replace(/_/g, " ")}</span>
                <Chip variant={scoreVariant(d.score)} className="text-[10px] px-2 py-0.5">{d.score}</Chip>
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

  if (isLoading) return <SkeletonTable rows={4} />;

  const total = feedbacks?.length ?? 0;
  const withComment = feedbacks?.filter((f) => f.comment).length ?? 0;
  const cycles = groupByCycle(feedbacks ?? []);

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Feedbacks recebidos</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Avaliações anônimas dos seus professores
          </p>
        </div>
        {total > 0 && (
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => setGroupBy("cycle")}
              className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
                groupBy === "cycle"
                  ? "bg-primary text-on-primary"
                  : "text-muted-foreground hover:bg-surface-container"
              }`}
            >
              Por ciclo
            </button>
            <button
              type="button"
              onClick={() => setGroupBy("all")}
              className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
                groupBy === "all"
                  ? "bg-primary text-on-primary"
                  : "text-muted-foreground hover:bg-surface-container"
              }`}
            >
              Todos
            </button>
          </div>
        )}
      </div>

      {total > 0 && (
        <div className="grid gap-4 sm:grid-cols-3">
          <div className="rounded-2xl border border-outline-variant bg-surface p-5">
            <p className="text-sm text-muted-foreground">Avaliações recebidas</p>
            <p className="mt-1 text-3xl font-bold text-foreground">{total}</p>
          </div>
          <div className="rounded-2xl border border-outline-variant bg-surface p-5">
            <p className="text-sm text-muted-foreground">Com comentário</p>
            <p className="mt-1 text-3xl font-bold text-foreground">{withComment}</p>
          </div>
          <div className="rounded-2xl border border-outline-variant bg-surface p-5">
            <p className="text-sm text-muted-foreground">Ciclos avaliados</p>
            <p className="mt-1 text-3xl font-bold text-foreground">{cycles.length}</p>
          </div>
        </div>
      )}

      {total === 0 && (
        <EmptyState
          title="Nenhum feedback recebido ainda"
          description="Os feedbacks aparecerão aqui após seus professores concluírem as avaliações."
        />
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
