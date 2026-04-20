import { Injectable, NotFoundException, ConflictException } from "@nestjs/common";
import { DatabaseService } from "../../common/database/database.service";
import { CreateClassDto } from "./dto/create-class.dto";
import { CreateSubjectDto } from "./dto/create-subject.dto";
import { EnrollStudentDto } from "./dto/enroll-student.dto";
import { AssignTeacherDto } from "./dto/assign-teacher.dto";

@Injectable()
export class ClassesService {
  constructor(private db: DatabaseService) {}

  async listClasses(institutionId: string) {
    return this.db.classGroup.findMany({
      where: { institutionId },
      orderBy: [{ academicPeriod: "desc" }, { name: "asc" }],
      include: {
        _count: { select: { enrollments: true, classAssignments: true } },
      },
    });
  }

  async createClass(institutionId: string, dto: CreateClassDto) {
    return this.db.classGroup.create({
      data: { institutionId, name: dto.name, academicPeriod: dto.academicPeriod },
      include: {
        _count: { select: { enrollments: true, classAssignments: true } },
      },
    });
  }

  async getClassDetail(institutionId: string, classId: string) {
    const classGroup = await this.db.classGroup.findFirst({
      where: { id: classId, institutionId },
      include: {
        enrollments: {
          where: { status: "ACTIVE" },
          include: {
            student: {
              include: { user: { select: { id: true, fullName: true, email: true } } },
            },
          },
          orderBy: { enrolledAt: "asc" },
        },
        classAssignments: {
          include: {
            teacher: {
              include: { user: { select: { id: true, fullName: true, email: true } } },
            },
            subject: { select: { id: true, name: true, code: true } },
          },
          orderBy: { createdAt: "asc" },
        },
      },
    });
    if (!classGroup) throw new NotFoundException("Turma não encontrada.");
    return classGroup;
  }

  async enrollStudent(institutionId: string, classId: string, dto: EnrollStudentDto) {
    await this.assertClassBelongsTo(classId, institutionId);
    const student = await this.db.student.findFirst({
      where: { id: dto.studentId, user: { institutionId } },
    });
    if (!student) throw new NotFoundException("Aluno não encontrado.");
    try {
      return await this.db.enrollment.create({
        data: { classGroupId: classId, studentId: dto.studentId },
      });
    } catch {
      throw new ConflictException("Aluno já matriculado nesta turma.");
    }
  }

  async unenrollStudent(institutionId: string, classId: string, studentId: string) {
    await this.assertClassBelongsTo(classId, institutionId);
    const enrollment = await this.db.enrollment.findUnique({
      where: { classGroupId_studentId: { classGroupId: classId, studentId } },
    });
    if (!enrollment) throw new NotFoundException("Matrícula não encontrada.");
    await this.db.enrollment.delete({
      where: { classGroupId_studentId: { classGroupId: classId, studentId } },
    });
  }

  async assignTeacher(institutionId: string, classId: string, dto: AssignTeacherDto) {
    await this.assertClassBelongsTo(classId, institutionId);
    const teacher = await this.db.teacher.findFirst({
      where: { id: dto.teacherId, user: { institutionId } },
    });
    if (!teacher) throw new NotFoundException("Professor não encontrado.");
    const subject = await this.db.subject.findFirst({
      where: { id: dto.subjectId, institutionId },
    });
    if (!subject) throw new NotFoundException("Disciplina não encontrada.");
    try {
      return await this.db.classAssignment.create({
        data: { classGroupId: classId, teacherId: dto.teacherId, subjectId: dto.subjectId },
        include: {
          teacher: { include: { user: { select: { id: true, fullName: true, email: true } } } },
          subject: { select: { id: true, name: true, code: true } },
        },
      });
    } catch {
      throw new ConflictException("Professor já atribuído com esta disciplina nesta turma.");
    }
  }

  async removeAssignment(institutionId: string, classId: string, assignmentId: string) {
    await this.assertClassBelongsTo(classId, institutionId);
    const assignment = await this.db.classAssignment.findFirst({
      where: { id: assignmentId, classGroupId: classId },
    });
    if (!assignment) throw new NotFoundException("Atribuição não encontrada.");
    await this.db.classAssignment.delete({ where: { id: assignmentId } });
  }

  async getTeacherClasses(userId: string) {
    const teacher = await this.db.teacher.findUnique({ where: { userId } });
    if (!teacher) return [];
    return this.db.classAssignment.findMany({
      where: { teacherId: teacher.id },
      include: {
        classGroup: {
          include: { _count: { select: { enrollments: true } } },
        },
        subject: { select: { id: true, name: true, code: true } },
      },
      orderBy: [{ classGroup: { academicPeriod: "desc" } }, { classGroup: { name: "asc" } }],
    });
  }

  async listSubjects(institutionId: string) {
    return this.db.subject.findMany({
      where: { institutionId },
      orderBy: { name: "asc" },
    });
  }

  async createSubject(institutionId: string, dto: CreateSubjectDto) {
    return this.db.subject.create({
      data: { institutionId, name: dto.name, code: dto.code },
    });
  }

  async listStudents(institutionId: string) {
    return this.db.student.findMany({
      where: { user: { institutionId } },
      include: { user: { select: { id: true, fullName: true, email: true } } },
      orderBy: { user: { fullName: "asc" } },
    });
  }

  async listTeachers(institutionId: string) {
    return this.db.teacher.findMany({
      where: { user: { institutionId } },
      include: { user: { select: { id: true, fullName: true, email: true } } },
      orderBy: { user: { fullName: "asc" } },
    });
  }

  private async assertClassBelongsTo(classId: string, institutionId: string) {
    const cls = await this.db.classGroup.findFirst({ where: { id: classId, institutionId } });
    if (!cls) throw new NotFoundException("Turma não encontrada.");
  }
}
