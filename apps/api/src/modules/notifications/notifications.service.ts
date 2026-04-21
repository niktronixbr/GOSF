import { Injectable } from "@nestjs/common";
import { NotificationType, Prisma, Notification } from "@gosf/database";
import { DatabaseService } from "../../common/database/database.service";

@Injectable()
export class NotificationsService {
  constructor(private db: DatabaseService) {}

  private readonly listeners = new Map<
    string,
    Set<(n: Notification) => void>
  >();

  subscribe(userId: string, cb: (n: Notification) => void): () => void {
    if (!this.listeners.has(userId)) {
      this.listeners.set(userId, new Set());
    }
    this.listeners.get(userId)!.add(cb);
    return () => {
      const set = this.listeners.get(userId);
      if (set) {
        set.delete(cb);
        if (set.size === 0) this.listeners.delete(userId);
      }
    };
  }

  async findAll(userId: string) {
    return this.db.notification.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
      take: 30,
    });
  }

  async countUnread(userId: string) {
    const count = await this.db.notification.count({
      where: { userId, readAt: null },
    });
    return { count };
  }

  async markRead(id: string, userId: string) {
    return this.db.notification.updateMany({
      where: { id, userId },
      data: { readAt: new Date() },
    });
  }

  async markAllRead(userId: string) {
    return this.db.notification.updateMany({
      where: { userId, readAt: null },
      data: { readAt: new Date() },
    });
  }

  async create(
    userId: string,
    type: NotificationType,
    title: string,
    body: string,
    data?: Record<string, unknown>,
  ) {
    const notification = await this.db.notification.create({
      data: { userId, type, title, body, data: data as Prisma.InputJsonValue },
    });
    this.listeners.get(userId)?.forEach((cb) => cb(notification));
    return notification;
  }
}
