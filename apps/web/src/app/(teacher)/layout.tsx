import { Sidebar } from "@/components/dashboard/sidebar";

export default function TeacherLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex h-screen overflow-hidden">
      <Sidebar role="teacher" />
      <main className="flex-1 overflow-y-auto p-6 bg-muted/20">{children}</main>
    </div>
  );
}
