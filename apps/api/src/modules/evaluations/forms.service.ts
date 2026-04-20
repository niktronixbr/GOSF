import { Injectable, NotFoundException } from "@nestjs/common";
import { DatabaseService } from "../../common/database/database.service";
import { CreateFormDto } from "./dto/create-form.dto";
import { TargetType } from "@gosf/database";

const DEFAULT_TEACHER_FORM = {
  title: "Avaliação do Professor",
  questions: [
    { dimension: "didatica", questionText: "Como você avalia a didática do professor?", weight: 1.5, order: 0 },
    { dimension: "clareza", questionText: "O professor explicou o conteúdo com clareza?", weight: 1.0, order: 1 },
    { dimension: "organizacao", questionText: "As aulas foram bem organizadas?", weight: 1.0, order: 2 },
    { dimension: "engajamento", questionText: "O professor manteve o engajamento da turma?", weight: 1.2, order: 3 },
    { dimension: "justica_avaliativa", questionText: "As avaliações foram justas e transparentes?", weight: 1.3, order: 4 },
  ],
};

const DEFAULT_STUDENT_FORM = {
  title: "Avaliação do Aluno",
  questions: [
    { dimension: "participacao", questionText: "O aluno participou ativamente das aulas?", weight: 1.0, order: 0 },
    { dimension: "desempenho", questionText: "Como foi o desempenho em avaliações?", weight: 1.5, order: 1 },
    { dimension: "entrega", questionText: "O aluno entregou as atividades em dia?", weight: 1.2, order: 2 },
    { dimension: "evolucao", questionText: "O aluno demonstrou evolução no ciclo?", weight: 1.3, order: 3 },
    { dimension: "consistencia", questionText: "O aluno manteve consistência ao longo do período?", weight: 1.0, order: 4 },
  ],
};

@Injectable()
export class FormsService {
  constructor(private db: DatabaseService) {}

  async findAll(institutionId: string, targetType?: TargetType) {
    return this.db.evaluationForm.findMany({
      where: { institutionId, isActive: true, ...(targetType ? { targetType } : {}) },
      include: { questions: { orderBy: { order: "asc" } } },
    });
  }

  async findOne(id: string, institutionId: string) {
    const form = await this.db.evaluationForm.findFirst({
      where: { id, institutionId },
      include: { questions: { orderBy: { order: "asc" } } },
    });
    if (!form) throw new NotFoundException("Form not found");
    return form;
  }

  async create(institutionId: string, dto: CreateFormDto) {
    const defaults =
      dto.targetType === TargetType.TEACHER
        ? DEFAULT_TEACHER_FORM
        : DEFAULT_STUDENT_FORM;

    return this.db.evaluationForm.create({
      data: {
        institutionId,
        targetType: dto.targetType,
        title: dto.title ?? defaults.title,
        description: dto.description,
        questions: {
          create: (dto.questions.length ? dto.questions : defaults.questions).map(
            (q) => ({
              dimension: q.dimension,
              questionText: q.questionText,
              responseType: "SCALE",
              weight: q.weight,
              order: q.order,
              isRequired: true,
            })
          ),
        },
      },
      include: { questions: { orderBy: { order: "asc" } } },
    });
  }

  async seedDefaults(institutionId: string) {
    const existing = await this.db.evaluationForm.count({ where: { institutionId } });
    if (existing > 0) return;

    await this.create(institutionId, {
      targetType: TargetType.TEACHER,
      questions: [],
    } as CreateFormDto);

    await this.create(institutionId, {
      targetType: TargetType.STUDENT,
      questions: [],
    } as CreateFormDto);
  }
}
