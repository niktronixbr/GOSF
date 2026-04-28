import { NestFastifyApplication } from "@nestjs/platform-fastify";
import { createTestApp, closeTestApp, loginAs } from "./helpers/create-app";
import { MockAiProvider, STUDENT_PLAN_FIXTURE, TEACHER_PLAN_FIXTURE } from "./helpers/mock-ai-provider";
import { AiProviderService } from "../src/modules/ai/ai-provider.service";
import { DatabaseService } from "../src/common/database/database.service";
import { MailService } from "../src/common/mail/mail.service";

const mockMailService = {
  sendPasswordReset: jest.fn().mockResolvedValue(undefined),
  sendEvaluationOpen: jest.fn().mockResolvedValue(undefined),
  sendPlanReady: jest.fn().mockResolvedValue(undefined),
};

describe("AI Plans (e2e)", () => {
  let app: NestFastifyApplication;
  let db: DatabaseService;
  let mockAi: MockAiProvider;
  let cycleId: string;
  let institutionId: string;
  let studentToken: string;
  let teacherToken: string;
  let coordinatorToken: string;
  let adminToken: string;

  beforeAll(async () => {
    mockAi = new MockAiProvider();
    app = await createTestApp([
      { token: AiProviderService, value: mockAi },
      { token: MailService, value: mockMailService },
    ]);
    db = app.get(DatabaseService);

    [studentToken, teacherToken, coordinatorToken, adminToken] = await Promise.all([
      loginAs(app, "student").then((r) => r.accessToken),
      loginAs(app, "teacher").then((r) => r.accessToken),
      loginAs(app, "coordinator").then((r) => r.accessToken),
      loginAs(app, "admin").then((r) => r.accessToken),
    ]);

    const institution = await db.institution.findUniqueOrThrow({
      where: { slug: "escola-demo" },
    });
    institutionId = institution.id;

    const cycle = await db.evaluationCycle.create({
      data: {
        institutionId,
        title: "Ciclo e2e AI",
        startsAt: new Date("2026-01-01"),
        endsAt: new Date("2026-12-31"),
        status: "OPEN",
      },
    });
    cycleId = cycle.id;
  });

  afterAll(async () => {
    await db.studentPlan.deleteMany({ where: { cycleId } });
    await db.teacherDevelopmentPlan.deleteMany({ where: { cycleId } });
    await db.evaluationCycle.deleteMany({ where: { id: cycleId } });
    await closeTestApp(app);
  });

  // ─── POST /ai/plans/student/generate ─────────────────────────────────────

  describe("POST /api/v1/ai/plans/student/generate", () => {
    it("STUDENT gera plano com aiOutputJson do mock", async () => {
      const callsBefore = mockAi.calls.length;
      const res = await app.inject({
        method: "POST",
        url: `/api/v1/ai/plans/student/generate?cycleId=${cycleId}`,
        headers: { authorization: `Bearer ${studentToken}` },
      });
      expect(res.statusCode).toBe(201);
      const body = res.json();
      expect(body.status).toBe("READY");
      expect(body.cycleId).toBe(cycleId);
      expect(body.aiOutputJson).toMatchObject(STUDENT_PLAN_FIXTURE);
      expect(mockAi.calls.length).toBe(callsBefore + 1);
      expect(mockAi.calls.at(-1)!.system).toContain("plano de estudo");
    });

    it("TEACHER recebe 403", async () => {
      const res = await app.inject({
        method: "POST",
        url: `/api/v1/ai/plans/student/generate?cycleId=${cycleId}`,
        headers: { authorization: `Bearer ${teacherToken}` },
      });
      expect(res.statusCode).toBe(403);
    });

    it("retorna 401 sem autenticação", async () => {
      const res = await app.inject({
        method: "POST",
        url: `/api/v1/ai/plans/student/generate?cycleId=${cycleId}`,
      });
      expect(res.statusCode).toBe(401);
    });

    it("ADMIN não tem perfil Student → 404", async () => {
      const res = await app.inject({
        method: "POST",
        url: `/api/v1/ai/plans/student/generate?cycleId=${cycleId}`,
        headers: { authorization: `Bearer ${adminToken}` },
      });
      expect(res.statusCode).toBe(404);
    });

    it("apos gerar, cria notification PLAN_READY para o aluno", async () => {
      const res = await app.inject({
        method: "GET",
        url: "/api/v1/notifications",
        headers: { authorization: `Bearer ${studentToken}` },
      });
      expect(res.statusCode).toBe(200);
      const list = res.json() as Array<{ type: string; title: string }>;
      const planReady = list.find((n) => n.type === "PLAN_READY");
      expect(planReady).toBeDefined();
      expect(planReady!.title).toMatch(/plano de estudo/i);
    });
  });

  // ─── GET /ai/plans/student ───────────────────────────────────────────────

  describe("GET /api/v1/ai/plans/student", () => {
    it("STUDENT recupera o plano gerado", async () => {
      const res = await app.inject({
        method: "GET",
        url: `/api/v1/ai/plans/student?cycleId=${cycleId}`,
        headers: { authorization: `Bearer ${studentToken}` },
      });
      expect(res.statusCode).toBe(200);
      const body = res.json();
      expect(body).toBeTruthy();
      expect(body.status).toBe("READY");
      expect(body.aiOutputJson).toMatchObject(STUDENT_PLAN_FIXTURE);
    });

    it("retorna 401 sem autenticação", async () => {
      const res = await app.inject({
        method: "GET",
        url: `/api/v1/ai/plans/student?cycleId=${cycleId}`,
      });
      expect(res.statusCode).toBe(401);
    });
  });

  // ─── POST /ai/plans/teacher/generate ─────────────────────────────────────

  describe("POST /api/v1/ai/plans/teacher/generate", () => {
    it("TEACHER gera plano com fixture de teacher", async () => {
      const res = await app.inject({
        method: "POST",
        url: `/api/v1/ai/plans/teacher/generate?cycleId=${cycleId}`,
        headers: { authorization: `Bearer ${teacherToken}` },
      });
      expect(res.statusCode).toBe(201);
      const body = res.json();
      expect(body.status).toBe("READY");
      expect(body.aiOutputJson).toMatchObject(TEACHER_PLAN_FIXTURE);
    });

    it("STUDENT recebe 403", async () => {
      const res = await app.inject({
        method: "POST",
        url: `/api/v1/ai/plans/teacher/generate?cycleId=${cycleId}`,
        headers: { authorization: `Bearer ${studentToken}` },
      });
      expect(res.statusCode).toBe(403);
    });

    it("COORDINATOR não tem perfil Teacher → 404", async () => {
      const res = await app.inject({
        method: "POST",
        url: `/api/v1/ai/plans/teacher/generate?cycleId=${cycleId}`,
        headers: { authorization: `Bearer ${coordinatorToken}` },
      });
      expect(res.statusCode).toBe(404);
    });
  });

  // ─── GET /ai/plans/teacher ───────────────────────────────────────────────

  describe("GET /api/v1/ai/plans/teacher", () => {
    it("TEACHER recupera o plano gerado", async () => {
      const res = await app.inject({
        method: "GET",
        url: `/api/v1/ai/plans/teacher?cycleId=${cycleId}`,
        headers: { authorization: `Bearer ${teacherToken}` },
      });
      expect(res.statusCode).toBe(200);
      const body = res.json();
      expect(body.status).toBe("READY");
      expect(body.aiOutputJson).toMatchObject(TEACHER_PLAN_FIXTURE);
    });

    it("retorna null para cycleId sem plano gerado", async () => {
      const fakeCycleId = "00000000-0000-0000-0000-000000000000";
      const res = await app.inject({
        method: "GET",
        url: `/api/v1/ai/plans/teacher?cycleId=${fakeCycleId}`,
        headers: { authorization: `Bearer ${teacherToken}` },
      });
      expect(res.statusCode).toBe(200);
      expect(res.body).toMatch(/^("")?$|null/);
    });
  });
});
