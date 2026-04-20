import { Injectable } from "@nestjs/common";
import { DatabaseService } from "../../common/database/database.service";
import { Prisma } from "@gosf/database";

export interface LogOptions {
  actorUserId?: string;
  resourceId?: string;
  metadata?: Record<string, unknown>;
  ipAddress?: string;
}

@Injectable()
export class AuditService {
  constructor(private db: DatabaseService) {}

  async log(
    institutionId: string,
    action: string,
    resourceType: string,
    options: LogOptions = {},
  ) {
    await this.db.auditLog.create({
      data: {
        institutionId,
        action,
        resourceType,
        actorUserId: options.actorUserId,
        resourceId: options.resourceId,
        metadataJson: options.metadata as Prisma.InputJsonValue,
        ipAddress: options.ipAddress,
      },
    });
  }

  async findAll(
    institutionId: string,
    filters: { resourceType?: string; action?: string; from?: string; to?: string },
  ) {
    return this.db.auditLog.findMany({
      where: {
        institutionId,
        ...(filters.resourceType && { resourceType: filters.resourceType }),
        ...(filters.action && { action: { contains: filters.action, mode: "insensitive" } }),
        ...((filters.from || filters.to) && {
          createdAt: {
            ...(filters.from && { gte: new Date(filters.from) }),
            ...(filters.to && { lte: new Date(filters.to) }),
          },
        }),
      },
      orderBy: { createdAt: "desc" },
      take: 200,
    });
  }
}
