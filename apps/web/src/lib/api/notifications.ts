import { api } from "./client";

export type NotificationType =
  | "EVALUATION_OPEN"
  | "EVALUATION_REMINDER"
  | "PLAN_READY"
  | "FEEDBACK_RECEIVED"
  | "SYSTEM";

export interface Notification {
  id: string;
  userId: string;
  type: NotificationType;
  title: string;
  body: string;
  data: Record<string, unknown> | null;
  readAt: string | null;
  createdAt: string;
}

export const notificationsApi = {
  list: () => api.get<Notification[]>("/notifications"),
  countUnread: () => api.get<{ count: number }>("/notifications/unread-count"),
  markRead: (id: string) => api.patch<unknown>(`/notifications/${id}/read`, {}),
  markAllRead: () => api.patch<unknown>("/notifications/read-all", {}),
};
