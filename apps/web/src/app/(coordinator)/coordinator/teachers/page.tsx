"use client";

import { useState, useRef } from "react";
import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { evaluationsApi } from "@/lib/api/evaluations";
import { coordinatorApi, TeacherWithScores } from "@/lib/api/coordinator";
import { BarChart2, User, ChevronRight, Search } from "lucide-react";
import { PaginationControls } from "@/components/ui/pagination-controls";
import { Chip } from "@/components/ui/chip";
import { Card } from "@/components/ui/card";
import { scoreVariant } from "@/lib/score-color";

const LIMIT = 20;

type PlanChipVariant = "success" | "warning" | "info" | "danger" | "neutral";

function planVariant(status: string | null): PlanChipVariant {
  if (!status) return "neutral";
  const map: Record<string, PlanChipVariant> = {
    READY: "success",
    GENERATING: "info",
    FAILED: "danger",
  };
  return map[status] ?? "neutral";
}

function planLabel(status: string | null): string {
  if (!status) return "—";
  const map: Record<string, string> = {
    READY: "Pronto",
    GENERATING: "Gerando",
    FAILED: "Falhou",
  };
  return map[status] ?? status;
}

function TeacherRow({ teacher }: { teacher: TeacherWithScores }) {
  return (
    <Link
      href={`/coordinator/teachers/${teacher.id}`}
      className="flex items-center gap-4 py-3 border-b border-border last:border-0 hover:bg-muted/30 transition-colors -mx-5 px-5"
    >
      <div className="h-9 w-9 rounded-full bg-muted flex items-center justify-center shrink-0">
        <User size={16} className="text-muted-foreground" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-foreground truncate">{teacher.fullName}</p>
        <p className="text-xs text-muted-foreground truncate">
          {teacher.department ?? teacher.email}
        </p>
      </div>
      <div className="text-right space-y-1 shrink-0">
        <div className="flex items-center justify-end gap-1">
          <BarChart2 size={12} className="text-muted-foreground" />
          {teacher.avgScore === null ? (
            <span className="text-xs text-muted-foreground">Sem dados</span>
          ) : (
            <Chip variant={scoreVariant(teacher.avgScore)}>{teacher.avgScore.toFixed(0)}</Chip>
          )}
        </div>
        {teacher.planStatus === null ? (
          <span className="text-xs text-muted-foreground">—</span>
        ) : (
          <Chip variant={planVariant(teacher.planStatus)}>{planLabel(teacher.planStatus)}</Chip>
        )}
      </div>
      <ChevronRight size={16} className="text-muted-foreground shrink-0" />
    </Link>
  );
}

export default function CoordinatorTeachersPage() {
  const [searchInput, setSearchInput] = useState("");
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  function handleSearchChange(value: string) {
    setSearchInput(value);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      setSearch(value);
      setPage(1);
    }, 350);
  }

  const { data: cycle } = useQuery({
    queryKey: ["active-cycle"],
    queryFn: () => evaluationsApi.getActiveCycle(),
  });

  const { data, isLoading } = useQuery({
    queryKey: ["coordinator-teachers", cycle?.id, page, search],
    queryFn: () =>
      coordinatorApi.getTeachers({
        cycleId: cycle?.id,
        page,
        limit: LIMIT,
        search: search || undefined,
      }),
    placeholderData: (prev) => prev,
  });

  const teachers = data?.data ?? [];
  const total = data?.total ?? 0;
  const totalPages = data?.totalPages ?? 1;

  const withScores = teachers.filter((t) => t.avgScore !== null).length;
  const atRisk = teachers.filter((t) => t.avgScore !== null && t.avgScore < 50).length;
  const avgGlobal =
    withScores > 0
      ? (
          teachers
            .filter((t) => t.avgScore !== null)
            .reduce((a, t) => a + t.avgScore!, 0) / withScores
        ).toFixed(1)
      : null;

  return (
    <div className="space-y-6 max-w-2xl">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Professores</h1>
        <p className="text-sm text-muted-foreground mt-1">
          {cycle ? `Ciclo: ${cycle.title}` : "Sem ciclo ativo — exibindo todos os professores."}
        </p>
      </div>

      <div className="grid grid-cols-3 gap-4">
        <Card className="p-4">
          <p className="text-xs text-muted-foreground">Total</p>
          <p className="mt-1 text-2xl font-bold text-foreground">{isLoading ? "—" : total}</p>
        </Card>
        <Card className="p-4">
          <p className="text-xs text-muted-foreground">Média geral</p>
          <p className="mt-1 text-2xl font-bold text-foreground">
            {isLoading ? "—" : avgGlobal ?? "—"}
          </p>
        </Card>
        <Card className="p-4">
          <p className="text-xs text-muted-foreground">Em risco</p>
          <p className="mt-1 text-2xl font-bold text-destructive">{isLoading ? "—" : atRisk}</p>
        </Card>
      </div>

      {/* Search */}
      <div className="relative">
        <Search
          size={14}
          className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground"
        />
        <input
          value={searchInput}
          onChange={(e) => handleSearchChange(e.target.value)}
          placeholder="Buscar professor por nome ou e-mail..."
          className="w-full rounded-lg border border-border bg-background py-2 pl-9 pr-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
        />
      </div>

      <Card noPadding className="px-5">
        {isLoading ? (
          <div className="space-y-3 animate-pulse py-4">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="h-12 rounded-lg bg-muted" />
            ))}
          </div>
        ) : teachers.length === 0 ? (
          <p className="text-sm text-muted-foreground py-8 text-center">
            {search ? "Nenhum professor encontrado para a busca." : "Nenhum professor cadastrado."}
          </p>
        ) : (
          teachers.map((t) => <TeacherRow key={t.id} teacher={t} />)
        )}
      </Card>

      <PaginationControls
        page={page}
        totalPages={totalPages}
        total={total}
        limit={LIMIT}
        onPage={setPage}
      />
    </div>
  );
}
