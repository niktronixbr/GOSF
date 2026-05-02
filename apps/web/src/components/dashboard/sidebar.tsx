"use client";

import { useEffect } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  Home, BookOpen, BookMarked, BarChart2, BarChart3, MessageSquare,
  Target, Users, Settings, LogOut, ShieldCheck, GitCompare, FileClock,
  GraduationCap, X,
} from "lucide-react";
import { cn } from "@/lib/cn";
import { useAuthStore } from "@/store/auth.store";
import { useSidebarStore } from "@/store/sidebar.store";
import type { SessionUser } from "@/lib/auth/session";
import { ThemeToggle } from "@/components/ui/ThemeToggle";

type NavItem = { href: string; label: string; icon: React.ElementType };

const studentNav: NavItem[] = [
  { href: "/student", label: "Início", icon: Home },
  { href: "/student/progress", label: "Meu progresso", icon: BarChart2 },
  { href: "/student/plan", label: "Plano de estudo", icon: BookOpen },
  { href: "/student/evaluations", label: "Avaliações", icon: MessageSquare },
  { href: "/student/feedback", label: "Feedbacks", icon: MessageSquare },
  { href: "/student/goals", label: "Metas", icon: Target },
];

const teacherNav: NavItem[] = [
  { href: "/teacher", label: "Início", icon: Home },
  { href: "/teacher/classes", label: "Minhas turmas", icon: Users },
  { href: "/teacher/evaluations", label: "Avaliações", icon: MessageSquare },
  { href: "/teacher/grades", label: "Notas", icon: BarChart3 },
  { href: "/teacher/development", label: "Meu desenvolvimento", icon: Target },
  { href: "/teacher/insights", label: "Insights", icon: BarChart2 },
];

const coordinatorNav: NavItem[] = [
  { href: "/coordinator", label: "Visão geral", icon: Home },
  { href: "/coordinator/classes", label: "Turmas", icon: BookOpen },
  { href: "/coordinator/subjects", label: "Disciplinas", icon: BookMarked },
  { href: "/coordinator/teachers", label: "Professores", icon: Users },
  { href: "/coordinator/cycles", label: "Ciclos", icon: Target },
  { href: "/coordinator/benchmarking", label: "Benchmarking", icon: GitCompare },
  { href: "/coordinator/reports", label: "Relatórios", icon: BarChart2 },
  { href: "/coordinator/settings", label: "Configurações", icon: Settings },
];

const adminNav: NavItem[] = [
  { href: "/admin", label: "Usuários", icon: Users },
  { href: "/admin/metrics", label: "Métricas", icon: BarChart2 },
  { href: "/admin/privacy", label: "Privacidade", icon: ShieldCheck },
  { href: "/admin/audit", label: "Auditoria", icon: FileClock },
];

const navByRole: Record<SessionUser["role"], NavItem[]> = {
  STUDENT: studentNav,
  TEACHER: teacherNav,
  COORDINATOR: coordinatorNav,
  ADMIN: adminNav,
};

function SidebarContent({ onClose }: { onClose?: () => void }) {
  const pathname = usePathname();
  const router = useRouter();
  const user = useAuthStore((s) => s.user);
  const logout = useAuthStore((s) => s.logout);

  if (!user) return null;

  const items = navByRole[user.role];

  async function handleLogout() {
    await logout();
    router.push("/login");
  }

  return (
    <>
      {/* Logo card */}
      <div className="p-6 flex items-start gap-2">
        <div className="flex items-start gap-3 rounded-2xl bg-surface-container p-3 flex-1">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary text-primary-foreground">
            <GraduationCap size={18} />
          </div>
          <div>
            <p className="text-sm font-bold text-foreground">GOSF</p>
            <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground leading-tight">
              Inteligência<br />acadêmica
            </p>
          </div>
        </div>
        {onClose && (
          <button
            type="button"
            onClick={onClose}
            className="flex h-9 w-9 items-center justify-center rounded-lg text-muted-foreground hover:bg-surface-container transition-colors shrink-0"
            aria-label="Fechar menu"
          >
            <X size={18} />
          </button>
        )}
      </div>

      {/* Nav items */}
      <nav className="flex-1 overflow-y-auto px-3 space-y-1">
        {items.map((item) => {
          const active = pathname === item.href || pathname.startsWith(item.href + "/");
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={onClose}
              className={cn(
                "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors relative",
                active
                  ? "bg-primary-container text-on-primary-container"
                  : "text-muted-foreground hover:bg-surface-container hover:text-foreground",
              )}
            >
              {active && (
                <span className="absolute left-0 top-1/2 h-6 w-1 -translate-y-1/2 rounded-r-full bg-primary" />
              )}
              <Icon size={18} />
              {item.label}
            </Link>
          );
        })}
      </nav>

      {/* Footer */}
      <div className="p-3 space-y-2 border-t border-outline-variant">
        {user.role === "COORDINATOR" && (
          <div className="rounded-xl bg-surface-container p-3 space-y-2">
            <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              Plano
            </p>
            <p className="text-sm font-medium text-foreground">Veja seu plano atual</p>
            <Link
              href="/coordinator/settings"
              onClick={onClose}
              className="block rounded-lg bg-primary px-3 py-1.5 text-center text-xs font-semibold text-primary-foreground hover:bg-primary/90 transition-colors"
            >
              Gerenciar
            </Link>
          </div>
        )}
        <div className="flex items-center justify-between">
          <ThemeToggle />
          <button
            type="button"
            onClick={handleLogout}
            className="flex h-9 items-center gap-2 rounded-lg px-3 text-sm font-medium text-muted-foreground hover:bg-surface-container hover:text-foreground transition-colors"
          >
            <LogOut size={16} />
            Sair
          </button>
        </div>
      </div>
    </>
  );
}

export function Sidebar() {
  const { mobileOpen, closeMobile } = useSidebarStore();

  useEffect(() => {
    if (!mobileOpen) return;
    const original = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") closeMobile(); };
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = original;
      window.removeEventListener("keydown", onKey);
    };
  }, [mobileOpen, closeMobile]);

  return (
    <>
      {/* Desktop sidebar */}
      <aside className="hidden lg:flex h-screen w-64 flex-col border-r border-outline-variant bg-surface">
        <SidebarContent />
      </aside>

      {/* Mobile drawer overlay */}
      {mobileOpen && (
        <div className="lg:hidden fixed inset-0 z-50 flex">
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-black/50"
            onClick={closeMobile}
            aria-hidden="true"
          />
          {/* Drawer panel */}
          <aside
            className="relative flex h-full w-72 flex-col border-r border-outline-variant bg-surface z-10"
            role="dialog"
            aria-modal="true"
            aria-label="Menu principal"
          >
            <SidebarContent onClose={closeMobile} />
          </aside>
        </div>
      )}
    </>
  );
}
