import {
  Injectable,
  BadRequestException,
  NotFoundException,
  Logger,
} from "@nestjs/common";
import { DatabaseService } from "../../common/database/database.service";
import { AnalyticsService } from "../analytics/analytics.service";
import { SubmitEvaluationDto } from "./dto/submit-evaluation.dto";
import { TargetType, EvaluationCycleStatus } from "@gosf/database";

@Injectable()
export class SubmissionsService {
  private readonly logger = new Logger(SubmissionsService.name);

  constructor(
    private db: DatabaseService,
    private analytics: AnalyticsService,
  ) {}

  async submitTeacherEvaluation(
    studentUserId: string,
    dto: SubmitEvaluationDto
  ) {
    const cycle = await this.db.evaluationCycle.findFirst({
      where: { id: dto.cycleId, status: EvaluationCycleStatus.OPEN },
    });
    if (!cycle) throw new BadRequestException("Cycle is not open");

    const student = await this.db.student.findUnique({
      where: { userId: studentUserId },
    });
    if (!student) throw new NotFoundException("Student profile not found");

    let teacherById = await this.db.teacher.findUnique({ where: { userId: dto.targetId } });
    if (!teacherById) teacherById = await this.db.teacher.findUnique({ where: { id: dto.targetId } });
    if (!teacherById) throw new NotFoundException("Teacher not found");
    const teacherId = teacherById.id;

    const result = await this.db.teacherEvaluation.upsert({
      where: { cycleId_studentId_teacherId: { cycleId: dto.cycleId, studentId: student.id, teacherId } },
      update: { answersJson: dto.answers as any, comment: dto.comment },
      create: {
        cycleId: dto.cycleId,
        formId: dto.formId,
        studentId: student.id,
        teacherId,
        answersJson: dto.answers as any,
        comment: dto.comment,
      },
    });

    // Recalcula scores do professor em background sem bloquear a resposta
    this.analytics.computeTeacherScores(teacherId, dto.cycleId, cycle.institutionId)
      .catch((err) => this.logger.error(`Auto-compute teacher scores failed: ${err}`));

    return result;
  }

  async submitStudentEvaluation(
    teacherUserId: string,
    dto: SubmitEvaluationDto
  ) {
    const cycle = await this.db.evaluationCycle.findFirst({
      where: { id: dto.cycleId, status: EvaluationCycleStatus.OPEN },
    });
    if (!cycle) throw new BadRequestException("Cycle is not open");

    const teacher = await this.db.teacher.findUnique({
      where: { userId: teacherUserId },
    });
    if (!teacher) throw new NotFoundException("Teacher profile not found");

    const student = await this.db.student.findFirst({
      where: { OR: [{ userId: dto.targetId }, { id: dto.targetId }] },
    });
    if (!student) throw new NotFoundException("Student not found");

    const result = await this.db.studentEvaluation.upsert({
      where: {
        cycleId_teacherId_studentId: {
          cycleId: dto.cycleId,
          teacherId: teacher.id,
          studentId: student.id,
        },
      },
      update: { answersJson: dto.answers as any, comment: dto.comment },
      create: {
        cycleId: dto.cycleId,
        formId: dto.formId,
        teacherId: teacher.id,
        studentId: student.id,
        answersJson: dto.answers as any,
        comment: dto.comment,
      },
    });

    // Recalcula scores do aluno em background sem bloquear a resposta
    this.analytics.computeStudentScores(student.id, dto.cycleId, cycle.institutionId)
      .catch((err) => this.logger.error(`Auto-compute student scores failed: ${err}`));

    return result;
  }

  async getMyTeacherEvaluations(studentUserId: string, cycleId: string) {
    const student = await this.db.student.findUnique({ where: { userId: studentUserId } });
    if (!student) return [];
    return this.db.teacherEvaluation.findMany({
      where: { studentId: student.id, cycleId },
      include: { teacher: { include: { user: { select: { fullName: true } } } } },
    });
  }

  async getMyStudentEvaluations(teacherUserId: string, cycleId: string) {
    const teacher = await this.db.teacher.findUnique({ where: { userId: teacherUserId } });
    if (!teacher) return [];
    return this.db.studentEvaluation.findMany({
      where: { teacherId: teacher.id, cycleId },
      include: { student: { include: { user: { select: { fullName: true } } } } },
    });
  }
}
