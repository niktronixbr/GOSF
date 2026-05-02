"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  Home, BookOpen, BookMarked, BarChart2, BarChart3, MessageSquare,
  Target, Users, Settings, LogOut, ShieldCheck, GitCompare, FileClock,
} from "lucide-react";
import { cn } from "@/lib/cn";
import { useAuthStore } from "@/store/auth.store";
import type { SessionUser } from "@/lib/auth/session";

type NavItem = { href: string; label: string; icon: React.ElementType; badge?: number };

const studentNav: NavItem[] = [
  { href: "/student",          label: "Início",        icon: Home },
  { href: "/student/progress", label: "Meu progresso", icon: BarChart2 },
  { href: "/student/plan",     label: "Plano de estudo", icon: BookOpen },
  { href: "/student/evaluations", label: "Avaliações", icon: MessageSquare },
  { href: "/student/feedback", label: "Feedbacks",     icon: MessageSquare },
  { href: "/student/goals",    label: "Metas",         icon: Target },
];

const teacherNav: NavItem[] = [
  { href: "/teacher",              label: "Início",            icon: Home },
  { href: "/teacher/classes",      label: "Minhas turmas",     icon: Users },
  { href: "/teacher/evaluations",  label: "Avaliações",        icon: MessageSquare },
  { href: "/teacher/grades",       label: "Notas",             icon: BarChart3 },
  { href: "/teacher/development",  label: "Meu desenvolvimento", icon: Target },
  { href: "/teacher/insights",     label: "Insights",          icon: BarChart2 },
];

const coordinatorNav: NavItem[] = [
  { href: "/coordinator",              label: "Visão geral",       icon: Home },
  { href: "/coordinator/classes",      label: "Turmas",            icon: BookOpen },
  { href: "/coordinator/subjects",     label: "Disciplinas",       icon: BookMarked },
  { href: "/coordinator/teachers",     label: "Professores",       icon: Users },
  { href: "/coordinator/cycles",       label: "Ciclos",            icon: Target },
  { href: "/coordinator/benchmarking", label: "Benchmarking",      icon: GitCompare },
  { href: "/coordinator/reports",      label: "Relatórios",        icon: BarChart2 },
  { href: "/coordinator/settings",     label: "Configurações",     icon: Settings },
];

const adminNav: NavItem[] = [
  { href: "/admin",         label: "Usuários",   icon: ShieldCheck },
  { href: "/admin/metrics", label: "Métricas",   icon: BarChart2 },
  { href: "/admin/privacy", label: "LGPD",       icon: ShieldCheck },
  { href: "/admin/audit",   label: "Auditoria",  icon: FileClock },
  ...coordinatorNav,
];

const navByRole: Record<string, NavItem[]> = {
  STUDENT:     studentNav,
  TEACHER:     teacherNav,
  COORDINATOR: coordinatorNav,
  ADMIN:       adminNav,
};

const roleLabel: Record<string, string> = {
  STUDENT:     "Aluno",
  TEACHER:     "Professor",
  COORDINATOR: "Coordenação",
  ADMIN:       "Administrador",
};

export function Sidebar() {
  const pathname  = usePathname();
  const router    = useRouter();
  const { user, logout } = useAuthStore();
  const role: SessionUser["role"] = user?.role ?? "STUDENT";
  const items = navByRole[role] ?? studentNav;

  const initials = user?.fullName
    ? user.fullName.split(" ").slice(0, 2).map((n) => n[0]).join("").toUpperCase()
    : "?";

  async function handleLogout() {
    await logout();
    router.push("/login");
  }

  return (
    <aside className="flex h-full w-60 flex-col bg-sidebar shrink-0">
      {/* Logo */}
      <div className="flex h-16 items-center gap-3 px-5 border-b border-white/[0.07]">
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-teal shrink-0">
          <svg width="16" height="16" fill="none" viewBox="0 0 24 24">
            <path
              d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"
              stroke="#fff" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"
            />
          </svg>
        </div>
        <div>
          <p className="text-[15px] font-extrabold text-white leading-none tracking-tight">GOSF</p>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-0.5">
        <p className="px-2 mb-2 text-[9px] font-bold uppercase tracking-[1.2px] text-white/25">
          Principal
        </p>
        {items.map(({ href, label, icon: Icon, badge }) => {
          const active = pathname === href;
          return (
            <Link
              key={href}
              href={href}
              className={cn(
                "flex items-center gap-2.5 rounded-lg px-2.5 py-2 text-[13px] transition-colors",
                active
                  ? "bg-white/[0.09] text-white font-semibold"
                  : "text-white/55 font-medium hover:bg-white/[0.06] hover:text-white/80"
              )}
            >
              <Icon
                size={16}
                className={active ? "text-teal" : "text-white/40"}
              />
              <span className="flex-1 truncate">{label}</span>
              {badge != null && badge > 0 && (
                <span className="text-[9px] font-bold bg-teal text-white px-1.5 py-0.5 rounded-full">
                  {badge}
                </span>
              )}
            </Link>
          );
        })}
      </nav>

      {/* Footer */}
      <div className="px-3 pb-4 border-t border-white/[0.07] pt-3 space-y-0.5">
        <Link
          href="/settings/privacy"
          className="flex items-center gap-2.5 rounded-lg px-2.5 py-2 text-[13px] font-medium text-white/55 hover:bg-white/[0.06] hover:text-white/80 transition-colors"
        >
          <Settings size={16} className="text-white/40" />
          Privacidade
        </Link>
        <button
          onClick={handleLogout}
          className="flex w-full items-center gap-2.5 rounded-lg px-2.5 py-2 text-[13px] font-medium text-white/55 hover:bg-destructive/20 hover:text-red-400 transition-colors"
        >
          <LogOut size={16} className="text-white/40" />
          Sair
        </button>

        {/* User info */}
        {user && (
          <div className="mt-2 flex items-center gap-2.5 px-2.5 py-2">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-amber-soft text-[11px] font-bold text-amber-fg">
              {initials}
            </div>
            <div className="min-w-0">
              <p className="text-[12px] font-semibold text-white/80 truncate">{user?.fullName}</p>
              <p className="text-[10px] text-white/35 truncate">{roleLabel[role]}</p>
            </div>
          </div>
        )}
      </div>
    </aside>
  );
}
