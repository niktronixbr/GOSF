import { Test } from "@nestjs/testing";
import { ForbiddenException, NotFoundException } from "@nestjs/common";
import { GradesService } from "./grades.service";
import { DatabaseService } from "../../common/database/database.service";
import { PlansService } from "../ai/plans.service";

const mockDb = () => ({
  teacher: { findUnique: jest.fn() },
  classAssignment: { findFirst: jest.fn() },
  grade: {
    upsert: jest.fn(),
    findMany: jest.fn(),
    findUnique: jest.fn(),
    delete: jest.fn(),
  },
  student: { findUnique: jest.fn() },
  evaluationCycle: { findFirst: jest.fn() },
});

const mockPlans = () => ({
  generateStudentPlan: jest.fn().mockResolvedValue(undefined),
});

describe("GradesService", () => {
  let service: GradesService;
  let db: ReturnType<typeof mockDb>;

  beforeEach(async () => {
    db = mockDb();
    const module = await Test.createTestingModule({
      providers: [
        GradesService,
        { provide: DatabaseService, useValue: db },
        { provide: PlansService, useValue: mockPlans() },
      ],
    }).compile();

    service = module.get(GradesService);
  });

  describe("upsertGrade", () => {
    const dto = {
      studentId: "s-1",
      subjectId: "sub-1",
      cycleId: "c-1",
      title: "Prova 1",
      weight: 0.4,
      value: 8,
    };

    it("throws ForbiddenException if teacher not found", async () => {
      db.teacher.findUnique.mockResolvedValue(null);
      await expect(service.upsertGrade("user-1", dto)).rejects.toThrow(ForbiddenException);
    });

    it("throws ForbiddenException if no ClassAssignment for student+subject", async () => {
      db.teacher.findUnique.mockResolvedValue({ id: "t-1" });
      db.classAssignment.findFirst.mockResolvedValue(null);
      await expect(service.upsertGrade("user-1", dto)).rejects.toThrow(ForbiddenException);
    });

    it("upserts and returns grade", async () => {
      db.teacher.findUnique.mockResolvedValue({ id: "t-1" });
      db.classAssignment.findFirst.mockResolvedValue({ id: "a-1" });
      db.grade.upsert.mockResolvedValue({ id: "g-1", ...dto, teacherId: "t-1", createdAt: new Date(), updatedAt: new Date() });
      db.student.findUnique.mockResolvedValue({ id: "s-1", user: { id: "u-1", institutionId: "inst-1" } });

      const result = await service.upsertGrade("user-1", dto);

      expect(result.id).toBe("g-1");
      expect(db.grade.upsert).toHaveBeenCalledWith(
        expect.objectContaining({ create: expect.objectContaining({ value: 8, weight: 0.4 }) })
      );
    });
  });

  describe("deleteGrade", () => {
    it("throws ForbiddenException if teacher not found", async () => {
      db.teacher.findUnique.mockResolvedValue(null);
      await expect(service.deleteGrade("user-1", "g-1")).rejects.toThrow(ForbiddenException);
    });

    it("throws NotFoundException if grade does not exist", async () => {
      db.teacher.findUnique.mockResolvedValue({ id: "t-1" });
      db.grade.findUnique.mockResolvedValue(null);
      await expect(service.deleteGrade("user-1", "g-999")).rejects.toThrow(NotFoundException);
    });

    it("throws ForbiddenException if teacher does not own grade", async () => {
      db.teacher.findUnique.mockResolvedValue({ id: "t-1" });
      db.grade.findUnique.mockResolvedValue({ id: "g-1", teacherId: "t-other" });
      await expect(service.deleteGrade("user-1", "g-1")).rejects.toThrow(ForbiddenException);
    });

    it("deletes grade and returns { deleted: true }", async () => {
      db.teacher.findUnique.mockResolvedValue({ id: "t-1" });
      db.grade.findUnique.mockResolvedValue({ id: "g-1", teacherId: "t-1" });
      db.grade.delete.mockResolvedValue({ id: "g-1" });

      const result = await service.deleteGrade("user-1", "g-1");
      expect(result).toEqual({ deleted: true });
    });
  });

  describe("weightedAverage (private)", () => {
    it("returns null for empty array", () => {
      expect((service as any).weightedAverage([])).toBeNull();
    });

    it("computes weighted average correctly", () => {
      const grades = [{ value: 8, weight: 0.4 }, { value: 6, weight: 0.6 }];
      // 8*0.4 + 6*0.6 = 3.2 + 3.6 = 6.8 / 1.0 = 6.8
      expect((service as any).weightedAverage(grades)).toBeCloseTo(6.8);
    });

    it("normalizes when weights do not sum to 1", () => {
      const grades = [{ value: 8, weight: 0.4 }];
      expect((service as any).weightedAverage(grades)).toBeCloseTo(8);
    });
  });
});
