import { NestFastifyApplication } from "@nestjs/platform-fastify";
import { createTestApp, closeTestApp, loginAs } from "./helpers/create-app";

// IDs fixos do seed
const SEED_CLASS_ID = "class-3a-demo";
const SEED_SUBJECT_ID = "subj-mat-demo";

describe("Classes (e2e)", () => {
  let app: NestFastifyApplication;
  let coordinatorToken: string;
  let teacherToken: string;
  let studentToken: string;

  beforeAll(async () => {
    app = await createTestApp();
    [coordinatorToken, teacherToken, studentToken] = await Promise.all([
      loginAs(app, "coordinator").then((r) => r.accessToken),
      loginAs(app, "teacher").then((r) => r.accessToken),
      loginAs(app, "student").then((r) => r.accessToken),
    ]);
  });

  afterAll(async () => {
    await closeTestApp(app);
  });

  // ─── GET /classes ─────────────────────────────────────────────────────────

  describe("GET /api/v1/classes", () => {
    it("retorna lista de turmas para COORDINATOR", async () => {
      const res = await app.inject({
        method: "GET",
        url: "/api/v1/classes",
        headers: { authorization: `Bearer ${coordinatorToken}` },
      });
      expect(res.statusCode).toBe(200);
      expect(Array.isArray(res.json())).toBe(true);
    });

    it("retorna 403 para TEACHER", async () => {
      const res = await app.inject({
        method: "GET",
        url: "/api/v1/classes",
        headers: { authorization: `Bearer ${teacherToken}` },
      });
      expect(res.statusCode).toBe(403);
    });

    it("retorna 403 para STUDENT", async () => {
      const res = await app.inject({
        method: "GET",
        url: "/api/v1/classes",
        headers: { authorization: `Bearer ${studentToken}` },
      });
      expect(res.statusCode).toBe(403);
    });

    it("retorna 401 sem autenticação", async () => {
      const res = await app.inject({
        method: "GET",
        url: "/api/v1/classes",
      });
      expect(res.statusCode).toBe(401);
    });
  });

  // ─── POST /classes ────────────────────────────────────────────────────────

  describe("POST /api/v1/classes", () => {
    let createdClassId: string;
    const now = Date.now();

    it("cria uma turma como COORDINATOR e retorna 201", async () => {
      const res = await app.inject({
        method: "POST",
        url: "/api/v1/classes",
        headers: { authorization: `Bearer ${coordinatorToken}` },
        payload: {
          name: `Turma E2E ${now}`,
          academicPeriod: "2025/1",
        },
      });
      expect(res.statusCode).toBe(201);
      const body = res.json();
      expect(body).toHaveProperty("id");
      expect(body.name).toBe(`Turma E2E ${now}`);
      createdClassId = body.id;
    });

    it("retorna 400 ao criar turma sem nome", async () => {
      const res = await app.inject({
        method: "POST",
        url: "/api/v1/classes",
        headers: { authorization: `Bearer ${coordinatorToken}` },
        payload: { academicPeriod: "2025/1" },
      });
      expect(res.statusCode).toBe(400);
    });

    it("retorna 403 para TEACHER tentar criar turma", async () => {
      const res = await app.inject({
        method: "POST",
        url: "/api/v1/classes",
        headers: { authorization: `Bearer ${teacherToken}` },
        payload: { name: "Turma do Professor", academicPeriod: "2025/1" },
      });
      expect(res.statusCode).toBe(403);
    });

    it("retorna 403 para STUDENT tentar criar turma", async () => {
      const res = await app.inject({
        method: "POST",
        url: "/api/v1/classes",
        headers: { authorization: `Bearer ${studentToken}` },
        payload: { name: "Turma do Aluno", academicPeriod: "2025/1" },
      });
      expect(res.statusCode).toBe(403);
    });

    it("GET /:id retorna a turma criada", async () => {
      if (!createdClassId) return;
      const res = await app.inject({
        method: "GET",
        url: `/api/v1/classes/${createdClassId}`,
        headers: { authorization: `Bearer ${coordinatorToken}` },
      });
      expect(res.statusCode).toBe(200);
      expect(res.json().id).toBe(createdClassId);
    });
  });

  // ─── GET /classes/:id (seed) ──────────────────────────────────────────────

  describe("GET /api/v1/classes/:id (turma do seed)", () => {
    it("retorna a turma do seed para COORDINATOR", async () => {
      const res = await app.inject({
        method: "GET",
        url: `/api/v1/classes/${SEED_CLASS_ID}`,
        headers: { authorization: `Bearer ${coordinatorToken}` },
      });
      expect(res.statusCode).toBe(200);
      expect(res.json().id).toBe(SEED_CLASS_ID);
    });

    it("retorna a turma do seed para TEACHER", async () => {
      const res = await app.inject({
        method: "GET",
        url: `/api/v1/classes/${SEED_CLASS_ID}`,
        headers: { authorization: `Bearer ${teacherToken}` },
      });
      expect(res.statusCode).toBe(200);
    });

    it("retorna 403 para STUDENT", async () => {
      const res = await app.inject({
        method: "GET",
        url: `/api/v1/classes/${SEED_CLASS_ID}`,
        headers: { authorization: `Bearer ${studentToken}` },
      });
      expect(res.statusCode).toBe(403);
    });
  });

  // ─── GET /classes/mine (TEACHER) ──────────────────────────────────────────

  describe("GET /api/v1/classes/mine", () => {
    it("retorna turmas do professor logado", async () => {
      const res = await app.inject({
        method: "GET",
        url: "/api/v1/classes/mine",
        headers: { authorization: `Bearer ${teacherToken}` },
      });
      expect(res.statusCode).toBe(200);
      expect(Array.isArray(res.json())).toBe(true);
    });

    it("retorna 403 para COORDINATOR", async () => {
      const res = await app.inject({
        method: "GET",
        url: "/api/v1/classes/mine",
        headers: { authorization: `Bearer ${coordinatorToken}` },
      });
      expect(res.statusCode).toBe(403);
    });

    it("retorna 403 para STUDENT", async () => {
      const res = await app.inject({
        method: "GET",
        url: "/api/v1/classes/mine",
        headers: { authorization: `Bearer ${studentToken}` },
      });
      expect(res.statusCode).toBe(403);
    });
  });

  // ─── GET /classes/students e /classes/teachers ────────────────────────────

  describe("GET /api/v1/classes/students e /classes/teachers", () => {
    it("retorna lista de alunos para COORDINATOR", async () => {
      const res = await app.inject({
        method: "GET",
        url: "/api/v1/classes/students",
        headers: { authorization: `Bearer ${coordinatorToken}` },
      });
      expect(res.statusCode).toBe(200);
      expect(Array.isArray(res.json())).toBe(true);
    });

    it("retorna lista de professores para COORDINATOR", async () => {
      const res = await app.inject({
        method: "GET",
        url: "/api/v1/classes/teachers",
        headers: { authorization: `Bearer ${coordinatorToken}` },
      });
      expect(res.statusCode).toBe(200);
      expect(Array.isArray(res.json())).toBe(true);
    });

    it("retorna 403 para STUDENT acessar /classes/students", async () => {
      const res = await app.inject({
        method: "GET",
        url: "/api/v1/classes/students",
        headers: { authorization: `Bearer ${studentToken}` },
      });
      expect(res.statusCode).toBe(403);
    });
  });

  // ─── Enrollments ──────────────────────────────────────────────────────────

  describe("POST /api/v1/classes/:id/enrollments", () => {
    let studentId: string;

    beforeAll(async () => {
      const res = await app.inject({
        method: "GET",
        url: "/api/v1/classes/students",
        headers: { authorization: `Bearer ${coordinatorToken}` },
      });
      const students = res.json();
      if (Array.isArray(students) && students.length > 0) {
        studentId = students[0].id;
      }
    });

    it("matricula aluno em turma existente", async () => {
      if (!studentId) return;
      const res = await app.inject({
        method: "POST",
        url: `/api/v1/classes/${SEED_CLASS_ID}/enrollments`,
        headers: { authorization: `Bearer ${coordinatorToken}` },
        payload: { studentId },
      });
      // 201 se novo, 409 se já matriculado
      expect([201, 409]).toContain(res.statusCode);
    });

    it("retorna 400 ao enviar payload sem studentId", async () => {
      const res = await app.inject({
        method: "POST",
        url: `/api/v1/classes/${SEED_CLASS_ID}/enrollments`,
        headers: { authorization: `Bearer ${coordinatorToken}` },
        payload: {},
      });
      expect(res.statusCode).toBe(400);
    });

    it("retorna 403 para TEACHER tentar matricular aluno", async () => {
      const res = await app.inject({
        method: "POST",
        url: `/api/v1/classes/${SEED_CLASS_ID}/enrollments`,
        headers: { authorization: `Bearer ${teacherToken}` },
        payload: { studentId: "00000000-0000-0000-0000-000000000000" },
      });
      expect(res.statusCode).toBe(403);
    });
  });

  // ─── Subjects ─────────────────────────────────────────────────────────────

  describe("Subjects CRUD", () => {
    let createdSubjectId: string;
    const now = Date.now();

    it("GET /subjects retorna lista para COORDINATOR", async () => {
      const res = await app.inject({
        method: "GET",
        url: "/api/v1/subjects",
        headers: { authorization: `Bearer ${coordinatorToken}` },
      });
      expect(res.statusCode).toBe(200);
      expect(Array.isArray(res.json())).toBe(true);
    });

    it("GET /subjects retorna lista para TEACHER", async () => {
      const res = await app.inject({
        method: "GET",
        url: "/api/v1/subjects",
        headers: { authorization: `Bearer ${teacherToken}` },
      });
      expect(res.statusCode).toBe(200);
    });

    it("GET /subjects retorna 403 para STUDENT", async () => {
      const res = await app.inject({
        method: "GET",
        url: "/api/v1/subjects",
        headers: { authorization: `Bearer ${studentToken}` },
      });
      expect(res.statusCode).toBe(403);
    });

    it("POST /subjects cria disciplina para COORDINATOR", async () => {
      const res = await app.inject({
        method: "POST",
        url: "/api/v1/subjects",
        headers: { authorization: `Bearer ${coordinatorToken}` },
        payload: { name: `Disciplina E2E ${now}`, code: `D${now}` },
      });
      expect(res.statusCode).toBe(201);
      const body = res.json();
      expect(body).toHaveProperty("id");
      createdSubjectId = body.id;
    });

    it("POST /subjects retorna 400 sem nome", async () => {
      const res = await app.inject({
        method: "POST",
        url: "/api/v1/subjects",
        headers: { authorization: `Bearer ${coordinatorToken}` },
        payload: { code: "SEM-NOME" },
      });
      expect(res.statusCode).toBe(400);
    });

    it("POST /subjects retorna 403 para TEACHER", async () => {
      const res = await app.inject({
        method: "POST",
        url: "/api/v1/subjects",
        headers: { authorization: `Bearer ${teacherToken}` },
        payload: { name: "Disciplina Professor" },
      });
      expect(res.statusCode).toBe(403);
    });

    it("DELETE /subjects/:id exclui disciplina criada", async () => {
      if (!createdSubjectId) return;
      const res = await app.inject({
        method: "DELETE",
        url: `/api/v1/subjects/${createdSubjectId}`,
        headers: { authorization: `Bearer ${coordinatorToken}` },
      });
      expect(res.statusCode).toBe(200);
    });

    it("DELETE /subjects retorna 403 para TEACHER", async () => {
      const res = await app.inject({
        method: "DELETE",
        url: `/api/v1/subjects/${SEED_SUBJECT_ID}`,
        headers: { authorization: `Bearer ${teacherToken}` },
      });
      expect(res.statusCode).toBe(403);
    });

    it("GET /subjects retorna 401 sem autenticação", async () => {
      const res = await app.inject({
        method: "GET",
        url: "/api/v1/subjects",
      });
      expect(res.statusCode).toBe(401);
    });
  });
});
