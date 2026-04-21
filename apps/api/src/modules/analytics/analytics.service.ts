import { Injectable } from "@nestjs/common";
import { DatabaseService } from "../../common/database/database.service";
import { TargetType } from "@gosf/database";
import { paginate } from "../../common/dto/pagination.dto";

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

  async getTeachersWithScores(
    institutionId: string,
    cycleId: string,
    page = 1,
    limit = 20,
    search?: string,
  ) {
    const skip = (page - 1) * limit;

    const where = {
      user: {
        institutionId,
        ...(search && {
          OR: [
            { fullName: { contains: search, mode: "insensitive" as const } },
            { email: { contains: search, mode: "insensitive" as const } },
          ],
        }),
      },
    };

    const [teachers, total] = await Promise.all([
      this.db.teacher.findMany({
        where,
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
        skip,
        take: limit,
      }),
      this.db.teacher.count({ where }),
    ]);

    const scores = cycleId
      ? await this.db.scoreAggregate.findMany({
          where: {
            institutionId,
            cycleId,
            targetType: TargetType.TEACHER,
            targetId: { in: teachers.map((t) => t.id) },
          },
        })
      : [];

    const data = teachers.map((t) => {
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

    return paginate(data, total, page, limit);
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

  async getReports(institutionId: string, cycleId: string) {
    const [students, teachers, scores] = await Promise.all([
      this.db.student.findMany({
        where: { user: { institutionId } },
        include: { user: { select: { fullName: true } } },
        orderBy: { user: { fullName: "asc" } },
      }),
      this.db.teacher.findMany({
        where: { user: { institutionId } },
        include: { user: { select: { fullName: true } } },
        orderBy: { user: { fullName: "asc" } },
      }),
      cycleId
        ? this.db.scoreAggregate.findMany({ where: { institutionId, cycleId } })
        : Promise.resolve([]),
    ]);

    const buildEntry = (
      type: "STUDENT" | "TEACHER",
      id: string,
      fullName: string
    ) => {
      const entityScores = scores.filter((s) => s.targetId === id);
      const avg =
        entityScores.length
          ? Math.round((entityScores.reduce((a, s) => a + s.score, 0) / entityScores.length) * 10) / 10
          : null;
      return {
        type,
        id,
        fullName,
        avgScore: avg,
        atRisk: avg !== null && avg < 50,
        scores: entityScores.map((s) => ({ dimension: s.dimension, score: s.score })),
      };
    };

    return [
      ...students.map((s) => buildEntry("STUDENT", s.id, s.user.fullName)),
      ...teachers.map((t) => buildEntry("TEACHER", t.id, t.user.fullName)),
    ];
  }

  async getTeacherProfile(teacherId: string, institutionId: string) {
    const teacher = await this.db.teacher.findFirst({
      where: { id: teacherId, user: { institutionId } },
      include: {
        user: { select: { id: true, fullName: true, email: true, status: true, createdAt: true } },
        classAssignments: {
          include: {
            classGroup: { select: { id: true, name: true, academicPeriod: true } },
            subject: { select: { id: true, name: true, code: true } },
          },
          orderBy: { createdAt: "desc" },
        },
        developmentPlans: {
          orderBy: [{ version: "desc" }],
          select: {
            id: true,
            cycleId: true,
            status: true,
            version: true,
            createdAt: true,
            cycle: { select: { title: true } },
          },
        },
      },
    });
    if (!teacher) return null;

    const aggregates = await this.db.scoreAggregate.findMany({
      where: { targetId: teacherId, targetType: TargetType.TEACHER },
      include: { cycle: { select: { id: true, title: true, startsAt: true, endsAt: true } } },
      orderBy: { cycle: { startsAt: "asc" } },
    });

    const cycleMap = new Map<
      string,
      { cycleId: string; cycleTitle: string; startsAt: Date; endsAt: Date | null; scores: { dimension: string; score: number }[]; avg: number }
    >();

    for (const agg of aggregates) {
      if (!cycleMap.has(agg.cycleId)) {
        cycleMap.set(agg.cycleId, {
          cycleId: agg.cycleId,
          cycleTitle: agg.cycle.title,
          startsAt: agg.cycle.startsAt,
          endsAt: agg.cycle.endsAt,
          scores: [],
          avg: 0,
        });
      }
      cycleMap.get(agg.cycleId)!.scores.push({ dimension: agg.dimension, score: agg.score });
    }

    const cycleHistory = Array.from(cycleMap.values()).map((c) => ({
      ...c,
      avg:
        c.scores.length
          ? Math.round((c.scores.reduce((a, s) => a + s.score, 0) / c.scores.length) * 10) / 10
          : 0,
    }));

    const evaluationCount = await this.db.teacherEvaluation.count({
      where: { teacherId },
    });

    return {
      id: teacher.id,
      userId: teacher.user.id,
      fullName: teacher.user.fullName,
      email: teacher.user.email,
      status: teacher.user.status,
      createdAt: teacher.user.createdAt,
      department: teacher.department,
      specialty: teacher.specialty,
      evaluationCount,
      classAssignments: teacher.classAssignments,
      developmentPlans: teacher.developmentPlans,
      cycleHistory,
    };
  }

  async getBenchmarking(institutionId: string, cycleId: string) {
    const classes = await this.db.classGroup.findMany({
      where: { institutionId },
      include: { enrollments: { select: { studentId: true } } },
      orderBy: { name: "asc" },
    });

    if (!cycleId) {
      return classes.map((c) => ({
        classId: c.id,
        className: c.name,
        academicPeriod: c.academicPeriod,
        studentCount: c.enrollments.length,
        avgScore: null,
        dimensions: [] as { dimension: string; avg: number }[],
      }));
    }

    const allStudentIds = classes.flatMap((c) => c.enrollments.map((e) => e.studentId));
    const scores =
      allStudentIds.length > 0
        ? await this.db.scoreAggregate.findMany({
            where: { targetId: { in: allStudentIds }, cycleId, targetType: TargetType.STUDENT },
          })
        : [];

    return classes.map((c) => {
      const enrolled = new Set(c.enrollments.map((e) => e.studentId));
      const classScores = scores.filter((s) => enrolled.has(s.targetId));

      const avgScore =
        classScores.length
          ? Math.round((classScores.reduce((a, s) => a + s.score, 0) / classScores.length) * 10) / 10
          : null;

      const dimMap: Record<string, number[]> = {};
      for (const s of classScores) {
        if (!dimMap[s.dimension]) dimMap[s.dimension] = [];
        dimMap[s.dimension].push(s.score);
      }
      const dimensions = Object.entries(dimMap).map(([dimension, vals]) => ({
        dimension,
        avg: Math.round((vals.reduce((a, v) => a + v, 0) / vals.length) * 10) / 10,
      }));

      return {
        classId: c.id,
        className: c.name,
        academicPeriod: c.academicPeriod,
        studentCount: c.enrollments.length,
        avgScore,
        dimensions,
      };
    });
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
