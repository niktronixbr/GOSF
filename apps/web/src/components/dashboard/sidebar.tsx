"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  Home,
  BookOpen,
  BookMarked,
  BarChart2,
  MessageSquare,
  Target,
  Users,
  Settings,
  LogOut,
  ShieldCheck,
  GitCompare,
  FileClock,
} from "lucide-react";
import { clsx } from "clsx";
import { useAuthStore } from "@/store/auth.store";

type NavItem = { href: string; label: string; icon: React.ElementType };

const studentNav: NavItem[] = [
  { href: "/student", label: "Início", icon: Home },
  { href: "/student/progress", label: "Meu progresso", icon: BarChart2 },
  { href: "/student/plan", label: "Plano de estudo", icon: BookOpen },
  { href: "/student/feedback", label: "Feedbacks", icon: MessageSquare },
  { href: "/student/goals", label: "Metas", icon: Target },
];

const teacherNav: NavItem[] = [
  { href: "/teacher", label: "Início", icon: Home },
  { href: "/teacher/classes", label: "Minhas turmas", icon: Users },
  { href: "/teacher/evaluations", label: "Avaliações", icon: MessageSquare },
  { href: "/teacher/development", label: "Meu desenvolvimento", icon: Target },
  { href: "/teacher/insights", label: "Insights", icon: BarChart2 },
];

const coordinatorNav: NavItem[] = [
  { href: "/coordinator", label: "Visão geral", icon: Home },
  { href: "/coordinator/classes", label: "Turmas", icon: BookOpen },
  { href: "/coordinator/subjects", label: "Disciplinas", icon: BookMarked },
  { href: "/coordinator/teachers", label: "Professores", icon: Users },
  { href: "/coordinator/cycles", label: "Ciclos de avaliação", icon: Target },
  { href: "/coordinator/benchmarking", label: "Benchmarking", icon: GitCompare },
  { href: "/coordinator/reports", label: "Relatórios", icon: BarChart2 },
  { href: "/coordinator/settings", label: "Configurações", icon: Settings },
];

const adminNav: NavItem[] = [
  { href: "/admin", label: "Usuários", icon: ShieldCheck },
  { href: "/admin/metrics", label: "Métricas", icon: BarChart2 },
  { href: "/admin/privacy", label: "Solicitações LGPD", icon: ShieldCheck },
  { href: "/admin/audit", label: "Auditoria", icon: FileClock },
  ...coordinatorNav,
];

const navByRole: Record<string, NavItem[]> = {
  STUDENT: studentNav,
  TEACHER: teacherNav,
  COORDINATOR: coordinatorNav,
  ADMIN: adminNav,
};

export function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const { user, logout } = useAuthStore();
  const items = navByRole[user?.role ?? "STUDENT"] ?? studentNav;

  async function handleLogout() {
    await logout();
    router.push("/login");
  }

  const initials = user?.fullName
    ? user.fullName.split(" ").slice(0, 2).map((n) => n[0]).join("").toUpperCase()
    : "?";

  return (
    <aside className="flex h-full w-60 flex-col bg-sidebar shrink-0">
      {/* Logo */}
      <div className="flex h-16 items-center gap-3 px-5">
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-teal">
          <span className="text-sm font-bold text-white">G</span>
        </div>
        <span className="text-base font-bold tracking-tight text-white">GOSF</span>
      </div>

      {/* Nav */}
      <nav className="flex-1 overflow-y-auto px-3 py-2 space-y-0.5">
        {items.map(({ href, label, icon: Icon }) => {
          const active = pathname === href;
          return (
            <Link
              key={href}
              href={href}
              className={clsx(
                "flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-colors",
                active
                  ? "bg-white/10 font-semibold text-white"
                  : "font-medium text-white/55 hover:bg-white/[0.06] hover:text-white/80"
              )}
            >
              <Icon size={17} />
              {label}
            </Link>
          );
        })}
      </nav>

      {/* Footer */}
      <div className="border-t border-white/10 p-3 space-y-0.5">
        <Link
          href="/settings/privacy"
          className="flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium text-white/55 hover:bg-white/[0.06] hover:text-white/80 transition-colors"
        >
          <Settings size={17} />
          Privacidade
        </Link>

        {user && (
          <div className="flex items-center gap-3 px-3 py-2 mt-1">
            <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-amber-soft text-xs font-semibold text-amber-fg">
              {initials}
            </span>
            <div className="min-w-0">
              <p className="text-sm font-medium text-white truncate">{user.fullName}</p>
              <p className="text-[10px] text-white/40 truncate">{user.email}</p>
            </div>
          </div>
        )}

        <button
          onClick={handleLogout}
          className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium text-white/55 hover:bg-white/[0.06] hover:text-white/80 transition-colors"
        >
          <LogOut size={17} />
          Sair
        </button>
      </div>
    </aside>
  );
}
