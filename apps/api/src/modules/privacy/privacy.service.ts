import { Injectable, NotFoundException, ForbiddenException } from "@nestjs/common";
import { DatabaseService } from "../../common/database/database.service";
import { CreateConsentDto } from "./dto/create-consent.dto";
import { CreateDataRequestDto } from "./dto/create-data-request.dto";
import { UpdateDataRequestStatusDto } from "./dto/update-data-request-status.dto";
import { DataRequestStatus, UserRole } from "@gosf/database";

@Injectable()
export class PrivacyService {
  constructor(private db: DatabaseService) {}

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

    return this.db.dataRequest.update({
      where: { id },
      data: {
        status: dto.status,
        ...(dto.status === DataRequestStatus.COMPLETED || dto.status === DataRequestStatus.REJECTED
          ? { resolvedAt: new Date() }
          : {}),
      },
    });
  }
}
