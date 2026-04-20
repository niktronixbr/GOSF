import { Injectable } from "@nestjs/common";
import { NotificationType, Prisma } from "@gosf/database";
import { DatabaseService } from "../../common/database/database.service";

@Injectable()
export class NotificationsService {
  constructor(private db: DatabaseService) {}

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
    return this.db.notification.create({
      data: { userId, type, title, body, data: data as Prisma.InputJsonValue },
    });
  }
}
