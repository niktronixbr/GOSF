import { Injectable, NotFoundException, ForbiddenException } from "@nestjs/common";
import { GoalStatus } from "@gosf/database";
import { DatabaseService } from "../../common/database/database.service";
import { CreateGoalDto } from "./dto/create-goal.dto";
import { UpdateGoalDto } from "./dto/update-goal.dto";

@Injectable()
export class GoalsService {
  constructor(private db: DatabaseService) {}

  private async getStudentId(userId: string): Promise<string> {
    const student = await this.db.student.findUnique({ where: { userId } });
    if (!student) throw new ForbiddenException("Perfil de aluno não encontrado");
    return student.id;
  }

  async findAll(userId: string) {
    const studentId = await this.getStudentId(userId);
    return this.db.studentGoal.findMany({
      where: { studentId },
      orderBy: [{ status: "asc" }, { createdAt: "desc" }],
    });
  }

  async create(userId: string, dto: CreateGoalDto) {
    const studentId = await this.getStudentId(userId);
    return this.db.studentGoal.create({
      data: {
        studentId,
        title: dto.title,
        description: dto.description,
        dueDate: dto.dueDate ? new Date(dto.dueDate) : undefined,
      },
    });
  }

  async update(userId: string, goalId: string, dto: UpdateGoalDto) {
    const studentId = await this.getStudentId(userId);
    const goal = await this.db.studentGoal.findUnique({ where: { id: goalId } });
    if (!goal) throw new NotFoundException("Meta não encontrada");
    if (goal.studentId !== studentId) throw new ForbiddenException();

    const completedAt =
      dto.status === GoalStatus.DONE && goal.status !== GoalStatus.DONE
        ? new Date()
        : dto.status !== GoalStatus.DONE && goal.status === GoalStatus.DONE
          ? null
          : undefined;

    return this.db.studentGoal.update({
      where: { id: goalId },
      data: {
        ...(dto.title !== undefined && { title: dto.title }),
        ...(dto.description !== undefined && { description: dto.description }),
        ...(dto.status !== undefined && { status: dto.status }),
        ...(dto.dueDate !== undefined && { dueDate: dto.dueDate ? new Date(dto.dueDate) : null }),
        ...(completedAt !== undefined && { completedAt }),
      },
    });
  }

  async remove(userId: string, goalId: string) {
    const studentId = await this.getStudentId(userId);
    const goal = await this.db.studentGoal.findUnique({ where: { id: goalId } });
    if (!goal) throw new NotFoundException("Meta não encontrada");
    if (goal.studentId !== studentId) throw new ForbiddenException();
    await this.db.studentGoal.delete({ where: { id: goalId } });
    return { deleted: true };
  }
}
