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
import { paginate, PaginationQueryDto } from "../../common/dto/pagination.dto";
import { MailService } from "../../common/mail/mail.service";

@Injectable()
export class CyclesService {
  private readonly logger = new Logger(CyclesService.name);

  constructor(
    private db: DatabaseService,
    private notifications: NotificationsService,
    private analytics: AnalyticsService,
    private mail: MailService,
  ) {}

  async findAll(institutionId: string, dto: Partial<PaginationQueryDto> = {}) {
    const page = dto.page ?? 1;
    const limit = dto.limit ?? 20;
    const skip = (page - 1) * limit;

    const where = { institutionId };
    const [data, total] = await Promise.all([
      this.db.evaluationCycle.findMany({ where, orderBy: { startsAt: "desc" }, skip, take: limit }),
      this.db.evaluationCycle.count({ where }),
    ]);

    return paginate(data, total, page, limit);
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
    const wasOpen = cycle.status === EvaluationCycleStatus.OPEN;
    const updated = await this.db.evaluationCycle.update({
      where: { id },
      data: { status: EvaluationCycleStatus.OPEN },
    });
    if (!wasOpen) {
      await this.notifyInstitution(
        institutionId,
        NotificationType.EVALUATION_OPEN,
        `Ciclo aberto: ${cycle.title}`,
        "Um novo ciclo de avaliação está disponível. Acesse para registrar suas avaliações.",
      );
      await this.emailInstitution(institutionId, cycle.title);
    }
    return updated;
  }

  async close(id: string, institutionId: string) {
    const cycle = await this.findOne(id, institutionId);
    const wasClosed = cycle.status === EvaluationCycleStatus.CLOSED;
    const updated = await this.db.evaluationCycle.update({
      where: { id },
      data: { status: EvaluationCycleStatus.CLOSED },
    });

    if (!wasClosed) {
      await this.notifyInstitution(
        institutionId,
        NotificationType.SYSTEM,
        `Ciclo encerrado: ${cycle.title}`,
        "O ciclo de avaliação foi encerrado. Verifique seus resultados.",
      );

      await this.computeScoresForCycle(id, institutionId);
    }

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

  private async emailInstitution(institutionId: string, cycleTitle: string) {
    const users = await this.db.user.findMany({
      where: { institutionId, status: "ACTIVE" },
      select: { email: true, fullName: true },
    });
    const results = await Promise.allSettled(
      users.map((u) => this.mail.sendEvaluationOpen(u.email, u.fullName, cycleTitle)),
    );
    results.forEach((r, i) => {
      if (r.status === "rejected")
        this.logger.error(`Email cycle failed for ${users[i].email}`, r.reason);
    });
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
