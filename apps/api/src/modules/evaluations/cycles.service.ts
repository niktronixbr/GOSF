import {
  Injectable,
  NotFoundException,
  BadRequestException,
  Logger,
} from "@nestjs/common";
import { DatabaseService } from "../../common/database/database.service";
import { NotificationsService } from "../notifications/notifications.service";
import { AnalyticsService } from "../analytics/analytics.service";
import { CreateCycleDto } from "./dto/create-cycle.dto";
import { EvaluationCycleStatus, NotificationType } from "@gosf/database";

@Injectable()
export class CyclesService {
  private readonly logger = new Logger(CyclesService.name);

  constructor(
    private db: DatabaseService,
    private notifications: NotificationsService,
    private analytics: AnalyticsService,
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

    await this.computeScoresForCycle(id, institutionId);

    return updated;
  }

  private async computeScoresForCycle(cycleId: string, institutionId: string) {
    const [teacherEvals, studentEvals] = await Promise.all([
      this.db.teacherEvaluation.findMany({
        where: { cycleId },
        select: { teacherId: true },
        distinct: ["teacherId"],
      }),
      this.db.studentEvaluation.findMany({
        where: { cycleId },
        select: { studentId: true },
        distinct: ["studentId"],
      }),
    ]);

    for (const { teacherId } of teacherEvals) {
      try {
        await this.analytics.computeTeacherScores(teacherId, cycleId, institutionId);
      } catch (err) {
        this.logger.error(`Erro ao computar scores do professor ${teacherId}: ${err}`);
      }
    }

    for (const { studentId } of studentEvals) {
      try {
        await this.analytics.computeStudentScores(studentId, cycleId, institutionId);
      } catch (err) {
        this.logger.error(`Erro ao computar scores do aluno ${studentId}: ${err}`);
      }
    }
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
