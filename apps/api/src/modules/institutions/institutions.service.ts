import { Injectable, NotFoundException } from "@nestjs/common";
import { DatabaseService } from "../../common/database/database.service";
import { UpdateInstitutionDto } from "./dto/update-institution.dto";

@Injectable()
export class InstitutionsService {
  constructor(private db: DatabaseService) {}

  async findById(id: string) {
    const institution = await this.db.institution.findUnique({
      where: { id },
      select: { id: true, name: true, slug: true, status: true },
    });
    if (!institution) throw new NotFoundException("Instituição não encontrada.");
    return institution;
  }

  async update(id: string, dto: UpdateInstitutionDto) {
    await this.findById(id);
    return this.db.institution.update({
      where: { id },
      data: dto,
      select: { id: true, name: true, slug: true, status: true },
    });
  }
}
