import { Injectable } from "@nestjs/common";
import { DatabaseService } from "../../common/database/database.service";
import { TargetType } from "@gosf/database";

interface DimensionScore {
  dimension: string;
  score: number;
  count: number;
}

@Injectable()
export class AnalyticsService {
  constructor(private db: DatabaseService) {}

  async computeTeacherScores(teacherId: string, cycleId: string, institutionId: string) {
    const evaluations = await this.db.teacherEvaluation.findMany({
      where: { teacherId, cycleId },
      include: {
        form: { include: { questions: true } },
      },
    });

    if (!evaluations.length) return [];

    const dimensionMap: Record<string, { total: number; weight: number; count: number }> = {};

    for (const ev of evaluations) {
      const answers = ev.answersJson as Record<string, number>;
      for (const question of ev.form.questions) {
        const raw = answers[question.id];
        if (typeof raw !== "number") continue;
        const normalized = (raw / 5) * 100;
        if (!dimensionMap[question.dimension]) {
          dimensionMap[question.dimension] = { total: 0, weight: 0, count: 0 };
        }
        dimensionMap[question.dimension].total += normalized * question.weight;
        dimensionMap[question.dimension].weight += question.weight;
        dimensionMap[question.dimension].count += 1;
      }
    }

    const scores: DimensionScore[] = Object.entries(dimensionMap).map(
      ([dimension, { total, weight, count }]) => ({
        dimension,
        score: weight > 0 ? Math.round((total / weight) * 10) / 10 : 0,
        count,
      })
    );

    await this.upsertAggregates(institutionId, TargetType.TEACHER, teacherId, cycleId, scores);
    return scores;
  }

  async computeStudentScores(studentId: string, cycleId: string, institutionId: string) {
    const evaluations = await this.db.studentEvaluation.findMany({
      where: { studentId, cycleId },
      include: {
        form: { include: { questions: true } },
      },
    });

    if (!evaluations.length) return [];

    const dimensionMap: Record<string, { total: number; weight: number; count: number }> = {};

    for (const ev of evaluations) {
      const answers = ev.answersJson as Record<string, number>;
      for (const question of ev.form.questions) {
        const raw = answers[question.id];
        if (typeof raw !== "number") continue;
        const normalized = (raw / 5) * 100;
        if (!dimensionMap[question.dimension]) {
          dimensionMap[question.dimension] = { total: 0, weight: 0, count: 0 };
        }
        dimensionMap[question.dimension].total += normalized * question.weight;
        dimensionMap[question.dimension].weight += question.weight;
        dimensionMap[question.dimension].count += 1;
      }
    }

    const scores: DimensionScore[] = Object.entries(dimensionMap).map(
      ([dimension, { total, weight, count }]) => ({
        dimension,
        score: weight > 0 ? Math.round((total / weight) * 10) / 10 : 0,
        count,
      })
    );

    await this.upsertAggregates(institutionId, TargetType.STUDENT, studentId, cycleId, scores);
    return scores;
  }

  private async upsertAggregates(
    institutionId: string,
    targetType: TargetType,
    targetId: string,
    cycleId: string,
    scores: DimensionScore[]
  ) {
    await Promise.all(
      scores.map((s) =>
        this.db.scoreAggregate.upsert({
          where: { targetId_cycleId_dimension: { targetId, cycleId, dimension: s.dimension } },
          update: { score: s.score, computedAt: new Date() },
          create: {
            institutionId,
            targetType,
            targetId,
            cycleId,
            dimension: s.dimension,
            score: s.score,
          },
        })
      )
    );
  }

  async getTeacherAggregates(teacherId: string, cycleId: string) {
    return this.db.scoreAggregate.findMany({
      where: { targetId: teacherId, cycleId, targetType: TargetType.TEACHER },
    });
  }

  async getStudentAggregates(studentId: string, cycleId: string) {
    return this.db.scoreAggregate.findMany({
      where: { targetId: studentId, cycleId, targetType: TargetType.STUDENT },
    });
  }

  async getInstitutionOverview(institutionId: string, cycleId: string) {
    const [teacherScores, studentScores] = await Promise.all([
      this.db.scoreAggregate.findMany({
        where: { institutionId, cycleId, targetType: TargetType.TEACHER },
        orderBy: { score: "asc" },
      }),
      this.db.scoreAggregate.findMany({
        where: { institutionId, cycleId, targetType: TargetType.STUDENT },
        orderBy: { score: "asc" },
      }),
    ]);

    const atRiskTeachers = teacherScores.filter((s) => s.score < 50);
    const atRiskStudents = studentScores.filter((s) => s.score < 50);

    return { teacherScores, studentScores, atRiskTeachers, atRiskStudents };
  }

  async getDashboardStudent(userId: string, institutionId: string) {
    const student = await this.db.student.findUnique({ where: { userId } });
    if (!student) return null;

    const cycle = await this.db.evaluationCycle.findFirst({
      where: { institutionId, status: "OPEN" },
      orderBy: { startsAt: "desc" },
    });
    if (!cycle) return { student, cycle: null, scores: [], plan: null };

    const scores = await this.getStudentAggregates(student.id, cycle.id);
    const plan = await this.db.studentPlan.findFirst({
      where: { studentId: student.id, cycleId: cycle.id },
      orderBy: { version: "desc" },
    });

    return { student, cycle, scores, plan };
  }

  async getDashboardTeacher(userId: string, institutionId: string) {
    const teacher = await this.db.teacher.findUnique({ where: { userId } });
    if (!teacher) return null;

    const cycle = await this.db.evaluationCycle.findFirst({
      where: { institutionId, status: "OPEN" },
      orderBy: { startsAt: "desc" },
    });
    if (!cycle) return { teacher, cycle: null, scores: [], plan: null };

    const scores = await this.getTeacherAggregates(teacher.id, cycle.id);
    const plan = await this.db.teacherDevelopmentPlan.findFirst({
      where: { teacherId: teacher.id, cycleId: cycle.id },
      orderBy: { version: "desc" },
    });

    return { teacher, cycle, scores, plan };
  }
}
