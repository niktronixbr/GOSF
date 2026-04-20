import {
  Injectable,
  BadRequestException,
  NotFoundException,
} from "@nestjs/common";
import { DatabaseService } from "../../common/database/database.service";
import { SubmitEvaluationDto } from "./dto/submit-evaluation.dto";
import { TargetType, EvaluationCycleStatus } from "@gosf/database";

@Injectable()
export class SubmissionsService {
  constructor(private db: DatabaseService) {}

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

    const teacher = await this.db.teacher.findUnique({
      where: { userId: dto.targetId },
    });
    if (!teacher) {
      const teacherById = await this.db.teacher.findUnique({ where: { id: dto.targetId } });
      if (!teacherById) throw new NotFoundException("Teacher not found");

      return this.db.teacherEvaluation.upsert({
        where: {
          cycleId_studentId_teacherId: {
            cycleId: dto.cycleId,
            studentId: student.id,
            teacherId: teacherById.id,
          },
        },
        update: { answersJson: dto.answers as any, comment: dto.comment },
        create: {
          cycleId: dto.cycleId,
          formId: dto.formId,
          studentId: student.id,
          teacherId: teacherById.id,
          answersJson: dto.answers as any,
          comment: dto.comment,
        },
      });
    }

    return this.db.teacherEvaluation.upsert({
      where: {
        cycleId_studentId_teacherId: {
          cycleId: dto.cycleId,
          studentId: student.id,
          teacherId: teacher.id,
        },
      },
      update: { answersJson: dto.answers as any, comment: dto.comment },
      create: {
        cycleId: dto.cycleId,
        formId: dto.formId,
        studentId: student.id,
        teacherId: teacher.id,
        answersJson: dto.answers as any,
        comment: dto.comment,
      },
    });
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

    return this.db.studentEvaluation.upsert({
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
