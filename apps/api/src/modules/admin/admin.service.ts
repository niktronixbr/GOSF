import { Injectable } from "@nestjs/common";
import { DatabaseService } from "../../common/database/database.service";

@Injectable()
export class AdminService {
  constructor(private db: DatabaseService) {}

  async getMetrics(institutionId: string) {
    const [
      totalUsers,
      usersByRole,
      activeUsers,
      totalCycles,
      cyclesByStatus,
      teacherEvalCount,
      studentEvalCount,
      studentPlans,
      teacherPlans,
    ] = await Promise.all([
      this.db.user.count({ where: { institutionId } }),
      this.db.user.groupBy({ by: ["role"], where: { institutionId }, _count: { id: true } }),
      this.db.user.count({ where: { institutionId, status: "ACTIVE" } }),
      this.db.evaluationCycle.count({ where: { institutionId } }),
      this.db.evaluationCycle.groupBy({ by: ["status"], where: { institutionId }, _count: { id: true } }),
      this.db.teacherEvaluation.count({ where: { cycle: { institutionId } } }),
      this.db.studentEvaluation.count({ where: { cycle: { institutionId } } }),
      this.db.studentPlan.count({ where: { student: { user: { institutionId } } } }),
      this.db.teacherDevelopmentPlan.count({ where: { teacher: { user: { institutionId } } } }),
    ]);

    const byRole = Object.fromEntries(usersByRole.map(({ role, _count }) => [role, _count.id]));
    const byStatus = Object.fromEntries(cyclesByStatus.map(({ status, _count }) => [status, _count.id]));

    return {
      users: {
        total: totalUsers,
        active: activeUsers,
        byRole: {
          STUDENT: byRole["STUDENT"] ?? 0,
          TEACHER: byRole["TEACHER"] ?? 0,
          COORDINATOR: byRole["COORDINATOR"] ?? 0,
          ADMIN: byRole["ADMIN"] ?? 0,
        },
      },
      cycles: {
        total: totalCycles,
        byStatus: {
          DRAFT: byStatus["DRAFT"] ?? 0,
          OPEN: byStatus["OPEN"] ?? 0,
          CLOSED: byStatus["CLOSED"] ?? 0,
          ARCHIVED: byStatus["ARCHIVED"] ?? 0,
        },
      },
      evaluations: {
        totalSubmissions: teacherEvalCount + studentEvalCount,
      },
      aiPlans: {
        studentPlans,
        teacherPlans,
      },
    };
  }
}
