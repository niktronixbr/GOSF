import { PrismaClient, UserRole, InstitutionStatus } from "@prisma/client";
import * as bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  console.log("Seeding database...");

  const institution = await prisma.institution.upsert({
    where: { slug: "escola-demo" },
    update: {},
    create: {
      name: "Escola Demo GOSF",
      slug: "escola-demo",
      status: InstitutionStatus.ACTIVE,
    },
  });

  const passwordHash = await bcrypt.hash("Admin@1234", 12);

  await prisma.user.upsert({
    where: { institutionId_email: { institutionId: institution.id, email: "admin@escolademo.com" } },
    update: {},
    create: {
      institutionId: institution.id,
      email: "admin@escolademo.com",
      passwordHash,
      fullName: "Administrador Demo",
      role: UserRole.ADMIN,
      status: "ACTIVE",
      emailVerifiedAt: new Date(),
    },
  });

  await prisma.user.upsert({
    where: { institutionId_email: { institutionId: institution.id, email: "coord@escolademo.com" } },
    update: {},
    create: {
      institutionId: institution.id,
      email: "coord@escolademo.com",
      passwordHash,
      fullName: "Coordenadora Demo",
      role: UserRole.COORDINATOR,
      status: "ACTIVE",
      emailVerifiedAt: new Date(),
    },
  });

  const teacherUser = await prisma.user.upsert({
    where: { institutionId_email: { institutionId: institution.id, email: "professor@escolademo.com" } },
    update: {},
    create: {
      institutionId: institution.id,
      email: "professor@escolademo.com",
      passwordHash,
      fullName: "Prof. João Silva",
      role: UserRole.TEACHER,
      status: "ACTIVE",
      emailVerifiedAt: new Date(),
    },
  });

  const teacher = await prisma.teacher.upsert({
    where: { userId: teacherUser.id },
    update: {},
    create: {
      userId: teacherUser.id,
      department: "Ciências Exatas",
      specialty: "Matemática",
    },
  });

  const studentUser = await prisma.user.upsert({
    where: { institutionId_email: { institutionId: institution.id, email: "aluno@escolademo.com" } },
    update: {},
    create: {
      institutionId: institution.id,
      email: "aluno@escolademo.com",
      passwordHash,
      fullName: "Maria Oliveira",
      role: UserRole.STUDENT,
      status: "ACTIVE",
      emailVerifiedAt: new Date(),
    },
  });

  const student = await prisma.student.upsert({
    where: { userId: studentUser.id },
    update: {},
    create: {
      userId: studentUser.id,
      registrationCode: "2024-001",
      gradeLevel: "3º Ano",
    },
  });

  const subject = await prisma.subject.upsert({
    where: { id: "subj-mat-demo" },
    update: {},
    create: {
      id: "subj-mat-demo",
      institutionId: institution.id,
      name: "Matemática",
      code: "MAT101",
    },
  });

  const classGroup = await prisma.classGroup.upsert({
    where: { id: "class-3a-demo" },
    update: {},
    create: {
      id: "class-3a-demo",
      institutionId: institution.id,
      name: "3º A",
      academicPeriod: "2024",
    },
  });

  await prisma.enrollment.upsert({
    where: { classGroupId_studentId: { classGroupId: classGroup.id, studentId: student.id } },
    update: {},
    create: {
      classGroupId: classGroup.id,
      studentId: student.id,
    },
  });

  await prisma.classAssignment.upsert({
    where: { classGroupId_teacherId_subjectId: { classGroupId: classGroup.id, teacherId: teacher.id, subjectId: subject.id } },
    update: {},
    create: {
      classGroupId: classGroup.id,
      teacherId: teacher.id,
      subjectId: subject.id,
    },
  });

  console.log("Seed completed!");
  console.log("\nCredenciais de acesso (senha: Admin@1234):");
  console.log("  Admin:        admin@escolademo.com");
  console.log("  Coordenador:  coord@escolademo.com");
  console.log("  Professor:    professor@escolademo.com");
  console.log("  Aluno:        aluno@escolademo.com");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
