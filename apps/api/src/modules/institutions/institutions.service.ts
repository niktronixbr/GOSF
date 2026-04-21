import * as bcrypt from "bcryptjs";
import { ConflictException, Injectable, NotFoundException } from "@nestjs/common";
import { InstitutionStatus, UserRole, UserStatus } from "@gosf/database";
import { DatabaseService } from "../../common/database/database.service";
import { UpdateInstitutionDto } from "./dto/update-institution.dto";
import { RegisterInstitutionDto } from "./dto/register-institution.dto";

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

  async register(dto: RegisterInstitutionDto) {
    const slugExists = await this.db.institution.findUnique({
      where: { slug: dto.slug },
      select: { id: true },
    });
    if (slugExists) throw new ConflictException("Slug já está em uso por outra instituição.");

    const institution = await this.db.institution.create({
      data: { name: dto.name, slug: dto.slug, status: InstitutionStatus.TRIAL },
      select: { id: true, name: true, slug: true, status: true },
    });

    const passwordHash = await bcrypt.hash(dto.adminPassword, 10);
    const admin = await this.db.user.create({
      data: {
        institutionId: institution.id,
        email: dto.adminEmail,
        fullName: dto.adminName,
        passwordHash,
        role: UserRole.ADMIN,
        status: UserStatus.ACTIVE,
      },
      select: { id: true, email: true, fullName: true, role: true },
    });

    return { institution, admin };
  }
}
