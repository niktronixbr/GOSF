import { BookOpen } from "lucide-react";

export default function CoordinatorClassesPage() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4 text-center">
      <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-muted">
        <BookOpen size={28} className="text-muted-foreground" />
      </div>
      <div>
        <h1 className="text-2xl font-bold text-foreground">Turmas</h1>
        <p className="text-sm text-muted-foreground mt-1 max-w-xs">
          Gestão de turmas e grupos da instituição. Em breve.
        </p>
      </div>
      <span className="rounded-full bg-yellow-100 px-3 py-1 text-xs font-medium text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400">
        Em desenvolvimento
      </span>
    </div>
  );
}
