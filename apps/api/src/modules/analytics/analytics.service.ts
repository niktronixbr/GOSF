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

  async getTeachersWithScores(institutionId: string, cycleId: string) {
    const teachers = await this.db.teacher.findMany({
      where: { user: { institutionId } },
      include: {
        user: { select: { id: true, fullName: true, email: true, status: true } },
        developmentPlans: {
          where: { cycleId },
          orderBy: { version: "desc" },
          take: 1,
          select: { status: true },
        },
      },
      orderBy: { user: { fullName: "asc" } },
    });

    const scores = cycleId
      ? await this.db.scoreAggregate.findMany({
          where: { institutionId, cycleId, targetType: TargetType.TEACHER },
        })
      : [];

    return teachers.map((t) => {
      const teacherScores = scores.filter((s) => s.targetId === t.id);
      const avg =
        teacherScores.length
          ? Math.round(
              (teacherScores.reduce((a, s) => a + s.score, 0) / teacherScores.length) * 10
            ) / 10
          : null;
      return {
        id: t.id,
        userId: t.user.id,
        fullName: t.user.fullName,
        email: t.user.email,
        status: t.user.status,
        department: t.department,
        specialty: t.specialty,
        planStatus: t.developmentPlans[0]?.status ?? null,
        avgScore: avg,
        scores: teacherScores.map((s) => ({ dimension: s.dimension, score: s.score })),
      };
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

  async getStudentFeedbacks(userId: string) {
    const student = await this.db.student.findUnique({ where: { userId } });
    if (!student) return [];

    const evaluations = await this.db.studentEvaluation.findMany({
      where: { studentId: student.id },
      include: {
        cycle: { select: { id: true, title: true, startsAt: true } },
        teacher: { include: { user: { select: { fullName: true } } } },
        form: { include: { questions: { select: { id: true, dimension: true, questionText: true } } } },
      },
      orderBy: { submittedAt: "desc" },
    });

    return evaluations.map((ev) => {
      const answers = ev.answersJson as Record<string, number>;
      const dimensionScores: Record<string, number[]> = {};
      for (const q of ev.form.questions) {
        const val = answers[q.id];
        if (typeof val === "number") {
          if (!dimensionScores[q.dimension]) dimensionScores[q.dimension] = [];
          dimensionScores[q.dimension].push((val / 5) * 100);
        }
      }
      const dimensions = Object.entries(dimensionScores).map(([dim, vals]) => ({
        dimension: dim,
        score: Math.round(vals.reduce((a, v) => a + v, 0) / vals.length),
      }));

      return {
        id: ev.id,
        cycleId: ev.cycleId,
        cycleTitle: ev.cycle.title,
        submittedAt: ev.submittedAt,
        teacherName: ev.teacher.user.fullName,
        comment: ev.comment ?? null,
        dimensions,
      };
    });
  }

  async getStudentHistory(userId: string) {
    const student = await this.db.student.findUnique({ where: { userId } });
    if (!student) return [];

    const aggregates = await this.db.scoreAggregate.findMany({
      where: { targetId: student.id, targetType: TargetType.STUDENT },
      include: { cycle: { select: { id: true, title: true, startsAt: true } } },
      orderBy: { cycle: { startsAt: "asc" } },
    });

    const cycleMap = new Map<string, { cycleId: string; cycleTitle: string; startsAt: Date; scores: { dimension: string; score: number }[] }>();

    for (const agg of aggregates) {
      if (!cycleMap.has(agg.cycleId)) {
        cycleMap.set(agg.cycleId, {
          cycleId: agg.cycleId,
          cycleTitle: agg.cycle.title,
          startsAt: agg.cycle.startsAt,
          scores: [],
        });
      }
      cycleMap.get(agg.cycleId)!.scores.push({ dimension: agg.dimension, score: agg.score });
    }

    return Array.from(cycleMap.values());
  }

  async getTeacherStudentInsights(userId: string, institutionId: string) {
    const teacher = await this.db.teacher.findUnique({ where: { userId } });
    if (!teacher) return [];

    const cycle = await this.db.evaluationCycle.findFirst({
      where: { institutionId, status: "OPEN" },
      orderBy: { startsAt: "desc" },
    });

    const evaluations = await this.db.studentEvaluation.findMany({
      where: { teacherId: teacher.id },
      include: {
        student: { include: { user: { select: { id: true, fullName: true } } } },
      },
      distinct: ["studentId"],
    });

    const studentIds = evaluations.map((e) => e.studentId);

    const scores = cycle
      ? await this.db.scoreAggregate.findMany({
          where: { targetId: { in: studentIds }, cycleId: cycle.id, targetType: TargetType.STUDENT },
        })
      : [];

    return evaluations.map((e) => {
      const studentScores = scores.filter((s) => s.targetId === e.studentId);
      const avg =
        studentScores.length
          ? Math.round((studentScores.reduce((a, s) => a + s.score, 0) / studentScores.length) * 10) / 10
          : null;
      const atRisk = avg !== null && avg < 50;
      return {
        studentId: e.studentId,
        fullName: e.student.user.fullName,
        avgScore: avg,
        atRisk,
        scores: studentScores.map((s) => ({ dimension: s.dimension, score: s.score })),
      };
    });
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
