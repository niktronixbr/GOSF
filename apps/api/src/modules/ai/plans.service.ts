import { Injectable, NotFoundException, Logger } from "@nestjs/common";
import { DatabaseService } from "../../common/database/database.service";
import { AiProviderService } from "./ai-provider.service";
import { NotificationsService } from "../notifications/notifications.service";
import { MailService } from "../../common/mail/mail.service";
import { STUDENT_PLAN_SYSTEM, TEACHER_PLAN_SYSTEM } from "./prompts";
import { PlanStatus, NotificationType } from "@gosf/database";

@Injectable()
export class PlansService {
  private readonly logger = new Logger(PlansService.name);

  constructor(
    private db: DatabaseService,
    private ai: AiProviderService,
    private notifications: NotificationsService,
    private mail: MailService,
  ) {}

  async generateStudentPlan(studentUserId: string, cycleId: string, institutionId: string) {
    const student = await this.db.student.findUnique({
      where: { userId: studentUserId },
      include: { user: { select: { fullName: true, email: true } } },
    });
    if (!student) throw new NotFoundException("Student not found");

    const scores = await this.db.scoreAggregate.findMany({
      where: { targetId: student.id, cycleId, targetType: "STUDENT" },
    });

    const evaluations = await this.db.studentEvaluation.findMany({
      where: { studentId: student.id, cycleId },
      select: { comment: true, submittedAt: true },
    });

    const gradeRows = await this.db.grade.findMany({
      where: { studentId: student.id, cycleId },
      include: { subject: { select: { name: true } } },
    });

    const gradeGroups = new Map<
      string,
      { subject: string; assessments: { title: string; weight: number; value: number }[] }
    >();
    for (const g of gradeRows) {
      if (!gradeGroups.has(g.subjectId)) {
        gradeGroups.set(g.subjectId, { subject: g.subject.name, assessments: [] });
      }
      gradeGroups.get(g.subjectId)!.assessments.push({ title: g.title, weight: g.weight, value: g.value });
    }
    const grades = Array.from(gradeGroups.values()).map(({ subject, assessments }) => {
      const totalWeight = assessments.reduce((sum, a) => sum + a.weight, 0);
      const weightedAverage =
        totalWeight > 0
          ? assessments.reduce((sum, a) => sum + a.value * a.weight, 0) / totalWeight
          : null;
      return { subject, assessments, weightedAverage };
    });

    const snapshot = {
      studentName: student.user.fullName,
      cycleId,
      scores: scores.map((s) => ({ dimension: s.dimension, score: s.score })),
      comments: evaluations.filter((e) => e.comment).map((e) => e.comment),
      totalEvaluations: evaluations.length,
      grades,
    };

    const plan = await this.db.studentPlan.create({
      data: {
        studentId: student.id,
        cycleId,
        inputSnapshotJson: snapshot,
        status: PlanStatus.GENERATING,
      },
    });

    try {
      const output = await this.ai.generateJson(
        STUDENT_PLAN_SYSTEM,
        `Dados do aluno para geração do plano:\n\`\`\`json\n${JSON.stringify(snapshot, null, 2)}\n\`\`\``
      );

      const ready = await this.db.studentPlan.update({
        where: { id: plan.id },
        data: {
          aiOutputJson: output as any,
          status: PlanStatus.READY,
          generatedAt: new Date(),
        },
      });
      await this.notifications.create(
        studentUserId,
        NotificationType.PLAN_READY,
        "Seu plano de estudo está pronto",
        "A IA gerou seu plano personalizado. Acesse Plano de Estudo para visualizar.",
      );
      await this.mail
        .sendPlanReady(student.user.email, student.user.fullName, 'student')
        .catch((err) => this.logger.error(`Email plan failed for ${student.user.email}`, err));
      return ready;
    } catch (err) {
      this.logger.error("Failed to generate student plan", err);
      await this.db.studentPlan.update({
        where: { id: plan.id },
        data: { status: PlanStatus.FAILED },
      });
      throw err;
    }
  }

  async generateTeacherPlan(teacherUserId: string, cycleId: string, institutionId: string) {
    const teacher = await this.db.teacher.findUnique({
      where: { userId: teacherUserId },
      include: { user: { select: { fullName: true, email: true } } },
    });
    if (!teacher) throw new NotFoundException("Teacher not found");

    const scores = await this.db.scoreAggregate.findMany({
      where: { targetId: teacher.id, cycleId, targetType: "TEACHER" },
    });

    const evaluations = await this.db.teacherEvaluation.findMany({
      where: { teacherId: teacher.id, cycleId },
      select: { comment: true, submittedAt: true },
    });

    const snapshot = {
      teacherName: teacher.user.fullName,
      department: teacher.department,
      cycleId,
      scores: scores.map((s) => ({ dimension: s.dimension, score: s.score })),
      comments: evaluations.filter((e) => e.comment).map((e) => e.comment),
      totalEvaluations: evaluations.length,
    };

    const plan = await this.db.teacherDevelopmentPlan.create({
      data: {
        teacherId: teacher.id,
        cycleId,
        inputSnapshotJson: snapshot,
        status: PlanStatus.GENERATING,
      },
    });

    try {
      const output = await this.ai.generateJson(
        TEACHER_PLAN_SYSTEM,
        `Dados do professor para geração do plano:\n\`\`\`json\n${JSON.stringify(snapshot, null, 2)}\n\`\`\``
      );

      const ready = await this.db.teacherDevelopmentPlan.update({
        where: { id: plan.id },
        data: {
          aiOutputJson: output as any,
          status: PlanStatus.READY,
          generatedAt: new Date(),
        },
      });
      await this.notifications.create(
        teacherUserId,
        NotificationType.PLAN_READY,
        "Seu plano de desenvolvimento está pronto",
        "A IA gerou seu plano de desenvolvimento profissional. Acesse Desenvolvimento para visualizar.",
      );
      await this.mail
        .sendPlanReady(teacher.user.email, teacher.user.fullName, 'teacher')
        .catch((err) => this.logger.error(`Email plan failed for ${teacher.user.email}`, err));
      return ready;
    } catch (err) {
      this.logger.error("Failed to generate teacher plan", err);
      await this.db.teacherDevelopmentPlan.update({
        where: { id: plan.id },
        data: { status: PlanStatus.FAILED },
      });
      throw err;
    }
  }

  async getStudentPlan(studentUserId: string, cycleId: string) {
    const student = await this.db.student.findUnique({ where: { userId: studentUserId } });
    if (!student) return null;
    return this.db.studentPlan.findFirst({
      where: { studentId: student.id, cycleId, status: PlanStatus.READY },
      orderBy: { version: "desc" },
    });
  }

  async getTeacherPlan(teacherUserId: string, cycleId: string) {
    const teacher = await this.db.teacher.findUnique({ where: { userId: teacherUserId } });
    if (!teacher) return null;
    return this.db.teacherDevelopmentPlan.findFirst({
      where: { teacherId: teacher.id, cycleId, status: PlanStatus.READY },
      orderBy: { version: "desc" },
    });
  }
}
