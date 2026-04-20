import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from "@nestjs/common";
import { DatabaseService } from "../../common/database/database.service";
import { NotificationsService } from "../notifications/notifications.service";
import { CreateCycleDto } from "./dto/create-cycle.dto";
import { EvaluationCycleStatus, NotificationType } from "@gosf/database";

@Injectable()
export class CyclesService {
  constructor(
    private db: DatabaseService,
    private notifications: NotificationsService,
  ) {}

  async findAll(institutionId: string) {
    return this.db.evaluationCycle.findMany({
      where: { institutionId },
      orderBy: { startsAt: "desc" },
    });
  }

  async findOne(id: string, institutionId: string) {
    const cycle = await this.db.evaluationCycle.findFirst({
      where: { id, institutionId },
    });
    if (!cycle) throw new NotFoundException("Cycle not found");
    return cycle;
  }

  async create(institutionId: string, dto: CreateCycleDto) {
    if (new Date(dto.startsAt) >= new Date(dto.endsAt)) {
      throw new BadRequestException("startsAt must be before endsAt");
    }
    return this.db.evaluationCycle.create({
      data: {
        institutionId,
        title: dto.title,
        startsAt: new Date(dto.startsAt),
        endsAt: new Date(dto.endsAt),
        status: EvaluationCycleStatus.DRAFT,
      },
    });
  }

  async open(id: string, institutionId: string) {
    const cycle = await this.findOne(id, institutionId);
    const updated = await this.db.evaluationCycle.update({
      where: { id },
      data: { status: EvaluationCycleStatus.OPEN },
    });
    await this.notifyInstitution(institutionId, NotificationType.EVALUATION_OPEN,
      `Ciclo aberto: ${cycle.title}`,
      "Um novo ciclo de avaliação está disponível. Acesse para registrar suas avaliações.",
    );
    return updated;
  }

  async close(id: string, institutionId: string) {
    const cycle = await this.findOne(id, institutionId);
    const updated = await this.db.evaluationCycle.update({
      where: { id },
      data: { status: EvaluationCycleStatus.CLOSED },
    });
    await this.notifyInstitution(institutionId, NotificationType.SYSTEM,
      `Ciclo encerrado: ${cycle.title}`,
      "O ciclo de avaliação foi encerrado. Verifique seus resultados.",
    );
    return updated;
  }

  private async notifyInstitution(
    institutionId: string,
    type: NotificationType,
    title: string,
    body: string,
  ) {
    const users = await this.db.user.findMany({
      where: { institutionId, status: "ACTIVE" },
      select: { id: true },
    });
    await Promise.all(
      users.map((u) => this.notifications.create(u.id, type, title, body)),
    );
  }

  async getActiveCycle(institutionId: string) {
    return this.db.evaluationCycle.findFirst({
      where: { institutionId, status: EvaluationCycleStatus.OPEN },
      orderBy: { startsAt: "desc" },
    });
  }
}
