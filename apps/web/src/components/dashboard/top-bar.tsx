import { NotificationsBell } from "./notifications-bell";

export function TopBar() {
  return (
    <header className="flex h-14 shrink-0 items-center justify-end border-b border-border bg-card px-6 gap-2">
      <NotificationsBell />
    </header>
  );
}
