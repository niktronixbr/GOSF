import { Injectable, NotFoundException, ForbiddenException } from "@nestjs/common";
import { DatabaseService } from "../../common/database/database.service";
import { NotificationsService } from "../notifications/notifications.service";
import { CreateConsentDto } from "./dto/create-consent.dto";
import { CreateDataRequestDto } from "./dto/create-data-request.dto";
import { UpdateDataRequestStatusDto } from "./dto/update-data-request-status.dto";
import { DataRequestStatus, DataRequestType, NotificationType, UserRole } from "@gosf/database";

const STATUS_NOTIFICATION_COPY: Record<
  DataRequestStatus,
  { title: string; body: (type: DataRequestType) => string } | null
> = {
  PENDING: null,
  IN_PROGRESS: {
    title: "Sua solicitação LGPD está em análise",
    body: (t) => `Sua solicitação de ${typeLabel(t)} entrou em análise.`,
  },
  COMPLETED: {
    title: "Sua solicitação LGPD foi concluída",
    body: (t) => `Sua solicitação de ${typeLabel(t)} foi concluída.`,
  },
  REJECTED: {
    title: "Sua solicitação LGPD foi recusada",
    body: (t) => `Sua solicitação de ${typeLabel(t)} foi recusada.`,
  },
};

function typeLabel(t: DataRequestType): string {
  switch (t) {
    case "ACCESS": return "acesso aos dados";
    case "CORRECTION": return "correção de dados";
    case "DELETION": return "exclusão de dados";
    case "PORTABILITY": return "portabilidade dos dados";
    case "OPPOSITION": return "oposição ao tratamento";
  }
}

@Injectable()
export class PrivacyService {
  constructor(
    private db: DatabaseService,
    private notifications: NotificationsService,
  ) {}

  async recordConsent(userId: string, institutionId: string, dto: CreateConsentDto) {
    return this.db.consentRecord.create({
      data: {
        userId,
        institutionId,
        purpose: dto.purpose,
        version: dto.version,
        accepted: dto.accepted,
        ipAddress: dto.ipAddress,
        userAgent: dto.userAgent,
      },
    });
  }

  async getMyConsents(userId: string) {
    return this.db.consentRecord.findMany({
      where: { userId },
      orderBy: { recordedAt: "desc" },
    });
  }

  async createDataRequest(userId: string, institutionId: string, dto: CreateDataRequestDto) {
    return this.db.dataRequest.create({
      data: {
        userId,
        institutionId,
        type: dto.type,
        details: dto.details,
        status: DataRequestStatus.PENDING,
      },
    });
  }

  async getMyDataRequests(userId: string) {
    return this.db.dataRequest.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
    });
  }

  async listDataRequests(institutionId: string, status?: DataRequestStatus) {
    return this.db.dataRequest.findMany({
      where: { institutionId, ...(status && { status }) },
      include: {
        user: { select: { id: true, fullName: true, email: true, role: true } },
      },
      orderBy: { createdAt: "desc" },
    });
  }

  async updateDataRequestStatus(
    id: string,
    institutionId: string,
    dto: UpdateDataRequestStatusDto,
  ) {
    const request = await this.db.dataRequest.findFirst({ where: { id, institutionId } });
    if (!request) throw new NotFoundException("Solicitação não encontrada");

    const updated = await this.db.dataRequest.update({
      where: { id },
      data: {
        status: dto.status,
        ...(dto.status === DataRequestStatus.COMPLETED || dto.status === DataRequestStatus.REJECTED
          ? { resolvedAt: new Date() }
          : {}),
      },
    });

    if (request.status !== dto.status) {
      const copy = STATUS_NOTIFICATION_COPY[dto.status];
      if (copy) {
        await this.notifications.create(
          request.userId,
          NotificationType.SYSTEM,
          copy.title,
          copy.body(request.type),
          { dataRequestId: id, status: dto.status },
        );
      }
    }

    return updated;
  }

  async exportMyData(userId: string) {
    const user = await this.db.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        fullName: true,
        role: true,
        status: true,
        lastLoginAt: true,
        createdAt: true,
        updatedAt: true,
        institution: { select: { name: true, slug: true } },
      },
    });
    if (!user) throw new NotFoundException("Usuário não encontrado");

    const [student, teacher, consents, dataRequests, notifications] = await Promise.all([
      this.db.student.findUnique({
        where: { userId },
        include: {
          enrollments: { include: { classGroup: { select: { name: true, academicPeriod: true } } } },
          plans: true,
          goals: true,
        },
      }),
      this.db.teacher.findUnique({
        where: { userId },
        include: {
          classAssignments: {
            include: {
              classGroup: { select: { name: true, academicPeriod: true } },
              subject: { select: { name: true } },
            },
          },
          developmentPlans: true,
        },
      }),
      this.db.consentRecord.findMany({ where: { userId }, orderBy: { recordedAt: "desc" } }),
      this.db.dataRequest.findMany({ where: { userId }, orderBy: { createdAt: "desc" } }),
      this.db.notification.findMany({
        where: { userId },
        orderBy: { createdAt: "desc" },
        take: 500,
      }),
    ]);

    return {
      exportedAt: new Date().toISOString(),
      user,
      ...(student && { studentProfile: student }),
      ...(teacher && { teacherProfile: teacher }),
      consents,
      dataRequests,
      notifications,
    };
  }
}
