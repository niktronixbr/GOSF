import {
  Injectable,
  ForbiddenException,
  NotFoundException,
  Logger,
} from "@nestjs/common";
import { DatabaseService } from "../../common/database/database.service";
import { PlansService } from "../ai/plans.service";
import { CreateGradeDto } from "./dto/create-grade.dto";

@Injectable()
export class GradesService {
  private readonly logger = new Logger(GradesService.name);

  constructor(
    private db: DatabaseService,
    private plansService: PlansService,
  ) {}

  private weightedAverage(grades: { value: number; weight: number }[]): number | null {
    if (grades.length === 0) return null;
    const totalWeight = grades.reduce((sum, g) => sum + g.weight, 0);
    if (totalWeight === 0) return null;
    return grades.reduce((sum, g) => sum + g.value * g.weight, 0) / totalWeight;
  }

  async upsertGrade(teacherUserId: string, dto: CreateGradeDto) {
    const teacher = await this.db.teacher.findUnique({ where: { userId: teacherUserId } });
    if (!teacher) throw new ForbiddenException("Perfil de professor não encontrado");

    const assignment = await this.db.classAssignment.findFirst({
      where: {
        teacherId: teacher.id,
        subjectId: dto.subjectId,
        classGroup: { enrollments: { some: { studentId: dto.studentId } } },
      },
    });
    if (!assignment) {
      throw new ForbiddenException("Sem permissão para lançar nota para este aluno nesta disciplina");
    }

    const grade = await this.db.grade.upsert({
      where: {
        studentId_subjectId_cycleId_title: {
          studentId: dto.studentId,
          subjectId: dto.subjectId,
          cycleId: dto.cycleId,
          title: dto.title,
        },
      },
      create: {
        studentId: dto.studentId,
        subjectId: dto.subjectId,
        cycleId: dto.cycleId,
        teacherId: teacher.id,
        title: dto.title,
        weight: dto.weight,
        value: dto.value,
      },
      update: { weight: dto.weight, value: dto.value, teacherId: teacher.id },
    });

    const student = await this.db.student.findUnique({
      where: { id: dto.studentId },
      include: { user: { select: { id: true, institutionId: true } } },
    });
    if (student) {
      this.plansService
        .generateStudentPlan(student.user.id, dto.cycleId, student.user.institutionId)
        .catch((err) => this.logger.warn(`Auto-plan failed for student ${dto.studentId}`, err));
    }

    return grade;
  }

  async deleteGrade(teacherUserId: string, gradeId: string) {
    const teacher = await this.db.teacher.findUnique({ where: { userId: teacherUserId } });
    if (!teacher) throw new ForbiddenException();

    const grade = await this.db.grade.findUnique({ where: { id: gradeId } });
    if (!grade) throw new NotFoundException("Nota não encontrada");
    if (grade.teacherId !== teacher.id) throw new ForbiddenException("Sem permissão para remover esta nota");

    await this.db.grade.delete({ where: { id: gradeId } });
    return { deleted: true };
  }

  async getStudentsForTeacher(teacherUserId: string) {
    const teacher = await this.db.teacher.findUnique({
      where: { userId: teacherUserId },
      include: { user: { select: { institutionId: true } } },
    });
    if (!teacher) throw new ForbiddenException();

    const cycle = await this.db.evaluationCycle.findFirst({
      where: { institutionId: teacher.user.institutionId, status: "OPEN" },
      orderBy: { startsAt: "desc" },
    });

    const assignments = await this.db.classAssignment.findMany({
      where: { teacherId: teacher.id },
      include: {
        classGroup: {
          include: {
            enrollments: {
              include: {
                student: { include: { user: { select: { id: true, fullName: true } } } },
              },
            },
          },
        },
        subject: { select: { id: true, name: true } },
      },
    });

    return Promise.all(
      assignments.map(async (assignment) => {
        const students = await Promise.all(
          assignment.classGroup.enrollments.map(async (enrollment) => {
            const grades = cycle
              ? await this.db.grade.findMany({
                  where: {
                    studentId: enrollment.student.id,
                    subjectId: assignment.subjectId,
                    cycleId: cycle.id,
                  },
                })
              : [];
            const avg = this.weightedAverage(grades);
            return {
              studentId: enrollment.student.id,
              userId: enrollment.student.user.id,
              fullName: enrollment.student.user.fullName,
              weightedAverage: avg,
              atRisk: avg !== null && avg < 6,
              grades: grades.map((g) => ({ id: g.id, title: g.title, weight: g.weight, value: g.value })),
            };
          }),
        );

        const allAvgs = students
          .filter((s) => s.weightedAverage !== null)
          .map((s) => ({ value: s.weightedAverage!, weight: 1 }));

        return {
          classId: assignment.classGroup.id,
          className: assignment.classGroup.name,
          subjectId: assignment.subject.id,
          subjectName: assignment.subject.name,
          cycleId: cycle?.id ?? null,
          cycleTitle: cycle?.title ?? null,
          classAvg: this.weightedAverage(allAvgs),
          students,
        };
      }),
    );
  }

  async getMyGrades(studentUserId: string) {
    const student = await this.db.student.findUnique({
      where: { userId: studentUserId },
      include: { user: { select: { institutionId: true } } },
    });
    if (!student) throw new ForbiddenException();

    const cycle = await this.db.evaluationCycle.findFirst({
      where: { institutionId: student.user.institutionId, status: "OPEN" },
      orderBy: { startsAt: "desc" },
    });
    if (!cycle) return { cycleId: null, cycleTitle: null, subjects: [] };

    const grades = await this.db.grade.findMany({
      where: { studentId: student.id, cycleId: cycle.id },
      include: { subject: { select: { id: true, name: true } } },
    });

    const bySubject = new Map<string, { subject: { id: string; name: string }; grades: typeof grades }>();
    for (const grade of grades) {
      if (!bySubject.has(grade.subjectId)) {
        bySubject.set(grade.subjectId, { subject: grade.subject, grades: [] });
      }
      bySubject.get(grade.subjectId)!.grades.push(grade);
    }

    const subjects = Array.from(bySubject.values()).map(({ subject, grades }) => ({
      subjectId: subject.id,
      subjectName: subject.name,
      weightedAverage: this.weightedAverage(grades),
      grades: grades.map((g) => ({ id: g.id, title: g.title, weight: g.weight, value: g.value })),
    }));

    return { cycleId: cycle.id, cycleTitle: cycle.title, subjects };
  }

  async getMyGradesHistory(studentUserId: string) {
    const student = await this.db.student.findUnique({
      where: { userId: studentUserId },
      include: { user: { select: { institutionId: true } } },
    });
    if (!student) throw new ForbiddenException();

    const grades = await this.db.grade.findMany({
      where: { studentId: student.id },
      include: {
        subject: { select: { id: true, name: true } },
        cycle: { select: { id: true, title: true, startsAt: true } },
      },
      orderBy: { cycle: { startsAt: "asc" } },
    });

    const cycleMap = new Map<string, {
      cycleId: string;
      cycleTitle: string;
      subjects: Map<string, { subjectId: string; subjectName: string; grades: typeof grades }>;
    }>();

    for (const grade of grades) {
      if (!cycleMap.has(grade.cycleId)) {
        cycleMap.set(grade.cycleId, {
          cycleId: grade.cycleId,
          cycleTitle: grade.cycle.title,
          subjects: new Map(),
        });
      }
      const cycleEntry = cycleMap.get(grade.cycleId)!;
      if (!cycleEntry.subjects.has(grade.subjectId)) {
        cycleEntry.subjects.set(grade.subjectId, {
          subjectId: grade.subjectId,
          subjectName: grade.subject.name,
          grades: [],
        });
      }
      cycleEntry.subjects.get(grade.subjectId)!.grades.push(grade);
    }

    return Array.from(cycleMap.values()).map((c) => ({
      cycleId: c.cycleId,
      cycleTitle: c.cycleTitle,
      subjects: Array.from(c.subjects.values()).map(({ subjectId, subjectName, grades }) => ({
        subjectId,
        subjectName,
        weightedAverage: this.weightedAverage(grades),
        grades: grades.map((g) => ({ id: g.id, title: g.title, weight: g.weight, value: g.value })),
      })),
    }));
  }

  async getOverview(institutionId: string) {
    const cycle = await this.db.evaluationCycle.findFirst({
      where: { institutionId, status: "OPEN" },
      orderBy: { startsAt: "desc" },
    });
    if (!cycle) return { cycleId: null, cycleTitle: null, atRiskSubjects: [], bySubject: [] };

    const grades = await this.db.grade.findMany({
      where: { cycleId: cycle.id, student: { user: { institutionId } } },
      include: { subject: { select: { id: true, name: true } } },
    });

    const byStudentSubject = new Map<
      string,
      { subject: { id: string; name: string }; grades: { value: number; weight: number }[] }
    >();
    for (const grade of grades) {
      const key = `${grade.studentId}-${grade.subjectId}`;
      if (!byStudentSubject.has(key)) {
        byStudentSubject.set(key, { subject: grade.subject, grades: [] });
      }
      byStudentSubject.get(key)!.grades.push({ value: grade.value, weight: grade.weight });
    }

    const bySubjectMap = new Map<string, { subject: { id: string; name: string }; avgs: number[] }>();
    for (const [, { subject, grades }] of byStudentSubject) {
      const avg = this.weightedAverage(grades);
      if (avg === null) continue;
      if (!bySubjectMap.has(subject.id)) bySubjectMap.set(subject.id, { subject, avgs: [] });
      bySubjectMap.get(subject.id)!.avgs.push(avg);
    }

    const bySubject = Array.from(bySubjectMap.values()).map(({ subject, avgs }) => {
      const avg = avgs.reduce((sum, a) => sum + a, 0) / avgs.length;
      return {
        subjectId: subject.id,
        subjectName: subject.name,
        avg,
        studentCount: avgs.length,
        atRiskCount: avgs.filter((a) => a < 6).length,
      };
    });

    return {
      cycleId: cycle.id,
      cycleTitle: cycle.title,
      atRiskSubjects: bySubject.filter((s) => s.avg < 6),
      bySubject,
    };
  }
}
