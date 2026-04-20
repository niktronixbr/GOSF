import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from "@nestjs/common";
import { DatabaseService } from "../../common/database/database.service";
import { CreateCycleDto } from "./dto/create-cycle.dto";
import { EvaluationCycleStatus } from "@gosf/database";

@Injectable()
export class CyclesService {
  constructor(private db: DatabaseService) {}

  async findAll(institutionId: string) {
    return this.db.evaluationCycle.findMany({
      where: { institutionId },
      orderBy: { startsAt: "desc" },
    });
  }

  async findOne(id: string, institutionId: string) {
    const cycle = await this.db.evaluationCycle.findFirst({
      where: { id, institutionId },
    });
    if (!cycle) throw new NotFoundException("Cycle not found");
    return cycle;
  }

  async create(institutionId: string, dto: CreateCycleDto) {
    if (new Date(dto.startsAt) >= new Date(dto.endsAt)) {
      throw new BadRequestException("startsAt must be before endsAt");
    }
    return this.db.evaluationCycle.create({
      data: {
        institutionId,
        title: dto.title,
        startsAt: new Date(dto.startsAt),
        endsAt: new Date(dto.endsAt),
        status: EvaluationCycleStatus.DRAFT,
      },
    });
  }

  async open(id: string, institutionId: string) {
    await this.findOne(id, institutionId);
    return this.db.evaluationCycle.update({
      where: { id },
      data: { status: EvaluationCycleStatus.OPEN },
    });
  }

  async close(id: string, institutionId: string) {
    await this.findOne(id, institutionId);
    return this.db.evaluationCycle.update({
      where: { id },
      data: { status: EvaluationCycleStatus.CLOSED },
    });
  }

  async getActiveCycle(institutionId: string) {
    return this.db.evaluationCycle.findFirst({
      where: { institutionId, status: EvaluationCycleStatus.OPEN },
      orderBy: { startsAt: "desc" },
    });
  }
}
