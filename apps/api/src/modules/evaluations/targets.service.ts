import { Injectable, NotFoundException } from "@nestjs/common";
import { DatabaseService } from "../../common/database/database.service";

@Injectable()
export class TargetsService {
  constructor(private db: DatabaseService) {}

  /** Retorna os professores que o aluno pode avaliar no ciclo ativo */
  async getTeachersForStudent(studentUserId: string, institutionId: string) {
    const student = await this.db.student.findUnique({
      where: { userId: studentUserId },
    });
    if (!student) throw new NotFoundException("Student profile not found");

    const cycle = await this.db.evaluationCycle.findFirst({
      where: { institutionId, status: "OPEN" },
      orderBy: { startsAt: "desc" },
    });

    // Busca turmas em que o aluno está matriculado
    const enrollments = await this.db.enrollment.findMany({
      where: { studentId: student.id, status: "ACTIVE" },
      include: {
        classGroup: {
          include: {
            classAssignments: {
              include: {
                teacher: {
                  include: {
                    user: { select: { id: true, fullName: true, avatarUrl: true } },
                  },
                },
                subject: true,
              },
            },
          },
        },
      },
    });

    // Agrega professores únicos com as disciplinas que ministram
    const teacherMap = new Map<
      string,
      { teacherId: string; userId: string; fullName: string; avatarUrl: string | null; subjects: string[]; evaluated: boolean }
    >();

    for (const enrollment of enrollments) {
      for (const assignment of enrollment.classGroup.classAssignments) {
        const { teacher, subject } = assignment;
        if (!teacherMap.has(teacher.id)) {
          teacherMap.set(teacher.id, {
            teacherId: teacher.id,
            userId: teacher.user.id,
            fullName: teacher.user.fullName,
            avatarUrl: teacher.user.avatarUrl,
            subjects: [],
            evaluated: false,
          });
        }
        teacherMap.get(teacher.id)!.subjects.push(subject.name);
      }
    }

    // Marca quais já foram avaliados neste ciclo
    if (cycle) {
      const done = await this.db.teacherEvaluation.findMany({
        where: { studentId: student.id, cycleId: cycle.id },
        select: { teacherId: true },
      });
      const doneSet = new Set(done.map((d) => d.teacherId));
      for (const [id, t] of teacherMap) {
        if (doneSet.has(id)) t.evaluated = true;
      }
    }

    return {
      cycle,
      teachers: Array.from(teacherMap.values()),
    };
  }

  /** Retorna os alunos que o professor pode avaliar no ciclo ativo */
  async getStudentsForTeacher(teacherUserId: string, institutionId: string) {
    const teacher = await this.db.teacher.findUnique({
      where: { userId: teacherUserId },
    });
    if (!teacher) throw new NotFoundException("Teacher profile not found");

    const cycle = await this.db.evaluationCycle.findFirst({
      where: { institutionId, status: "OPEN" },
      orderBy: { startsAt: "desc" },
    });

    // Turmas onde o professor leciona
    const assignments = await this.db.classAssignment.findMany({
      where: { teacherId: teacher.id },
      include: {
        subject: true,
        classGroup: {
          include: {
            enrollments: {
              where: { status: "ACTIVE" },
              include: {
                student: {
                  include: {
                    user: { select: { id: true, fullName: true, avatarUrl: true } },
                  },
                },
              },
            },
          },
        },
      },
    });

    const studentMap = new Map<
      string,
      { studentId: string; userId: string; fullName: string; avatarUrl: string | null; classGroup: string; evaluated: boolean }
    >();

    for (const assignment of assignments) {
      for (const enrollment of assignment.classGroup.enrollments) {
        const { student } = enrollment;
        if (!studentMap.has(student.id)) {
          studentMap.set(student.id, {
            studentId: student.id,
            userId: student.user.id,
            fullName: student.user.fullName,
            avatarUrl: student.user.avatarUrl,
            classGroup: assignment.classGroup.name,
            evaluated: false,
          });
        }
      }
    }

    // Marca avaliados no ciclo ativo
    if (cycle) {
      const done = await this.db.studentEvaluation.findMany({
        where: { teacherId: teacher.id, cycleId: cycle.id },
        select: { studentId: true },
      });
      const doneSet = new Set(done.map((d) => d.studentId));
      for (const [id, s] of studentMap) {
        if (doneSet.has(id)) s.evaluated = true;
      }
    }

    return {
      cycle,
      students: Array.from(studentMap.values()),
    };
  }
}
