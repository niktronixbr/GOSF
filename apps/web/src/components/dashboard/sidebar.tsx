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

  return (
    <aside className="flex h-full w-60 flex-col border-r border-border bg-card shrink-0">
      <div className="flex h-16 items-center px-6 border-b border-border">
        <span className="text-xl font-bold tracking-tight">GOSF</span>
      </div>

      <nav className="flex-1 overflow-y-auto p-4 space-y-1">
        {items.map(({ href, label, icon: Icon }) => (
          <Link
            key={href}
            href={href}
            className={clsx(
              "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
              pathname === href
                ? "bg-primary text-primary-foreground"
                : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
            )}
          >
            <Icon size={18} />
            {label}
          </Link>
        ))}
      </nav>

      <div className="border-t border-border p-4 space-y-1">
        {user && (
          <div className="px-3 py-2 mb-2">
            <p className="text-sm font-medium text-foreground truncate">{user.fullName}</p>
            <p className="text-xs text-muted-foreground truncate">{user.email}</p>
          </div>
        )}
        <Link
          href="/settings/privacy"
          className="flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium text-muted-foreground hover:bg-accent hover:text-accent-foreground transition-colors"
        >
          <Settings size={18} />
          Privacidade
        </Link>
        <button
          onClick={handleLogout}
          className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium text-muted-foreground hover:bg-destructive/10 hover:text-destructive transition-colors"
        >
          <LogOut size={18} />
          Sair
        </button>
      </div>
    </aside>
  );
}
