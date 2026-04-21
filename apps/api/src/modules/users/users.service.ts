import { Injectable, NotFoundException, ConflictException, BadRequestException, UnauthorizedException } from "@nestjs/common";
import * as bcrypt from "bcryptjs";
import { UserRole, UserStatus } from "@gosf/database";
import { DatabaseService } from "../../common/database/database.service";
import { AuditService } from "../audit/audit.service";
import { CreateUserDto } from "./dto/create-user.dto";
import { UpdateUserDto } from "./dto/update-user.dto";
import { ChangePasswordDto } from "./dto/change-password.dto";
import { UpdateProfileDto } from "./dto/update-profile.dto";

const userSelect = {
  id: true,
  email: true,
  fullName: true,
  role: true,
  status: true,
  avatarUrl: true,
  lastLoginAt: true,
  createdAt: true,
};

@Injectable()
export class UsersService {
  constructor(
    private db: DatabaseService,
    private audit: AuditService,
  ) {}

  async findById(id: string) {
    const user = await this.db.user.findUnique({
      where: { id },
      select: { ...userSelect, institutionId: true },
    });
    if (!user) throw new NotFoundException("Usuário não encontrado");
    return user;
  }

  async findByInstitution(institutionId: string) {
    return this.db.user.findMany({
      where: { institutionId },
      select: userSelect,
      orderBy: { fullName: "asc" },
    });
  }

  async create(institutionId: string, dto: CreateUserDto) {
    const existing = await this.db.user.findFirst({
      where: { email: dto.email, institutionId },
    });
    if (existing) throw new ConflictException("E-mail já cadastrado nesta instituição");

    const passwordHash = await bcrypt.hash(dto.password, 10);

    const user = await this.db.user.create({
      data: {
        email: dto.email,
        fullName: dto.fullName,
        passwordHash,
        role: dto.role,
        status: UserStatus.ACTIVE,
        institutionId,
      },
      select: userSelect,
    });

    if (dto.role === UserRole.STUDENT) {
      await this.db.student.create({ data: { userId: user.id } });
    } else if (dto.role === UserRole.TEACHER) {
      await this.db.teacher.create({ data: { userId: user.id } });
    }

    this.audit
      .log(institutionId, "CREATE_USER", "User", { resourceId: user.id })
      .catch(() => {});

    return user;
  }

  async update(id: string, institutionId: string, dto: UpdateUserDto) {
    await this.findById(id);
    return this.db.user.update({
      where: { id, institutionId },
      data: {
        ...(dto.fullName !== undefined && { fullName: dto.fullName }),
        ...(dto.role !== undefined && { role: dto.role }),
        ...(dto.status !== undefined && { status: dto.status }),
      },
      select: userSelect,
    });
  }

  async updateMe(id: string, dto: UpdateProfileDto) {
    return this.db.user.update({
      where: { id },
      data: {
        ...(dto.fullName !== undefined && { fullName: dto.fullName }),
        ...(dto.avatarUrl !== undefined && { avatarUrl: dto.avatarUrl }),
      },
      select: userSelect,
    });
  }

  async changePassword(id: string, dto: ChangePasswordDto) {
    const user = await this.db.user.findUnique({ where: { id } });
    if (!user) throw new NotFoundException("Usuário não encontrado");

    const valid = await bcrypt.compare(dto.currentPassword, user.passwordHash);
    if (!valid) throw new UnauthorizedException("Senha atual incorreta");

    if (dto.currentPassword === dto.newPassword) {
      throw new BadRequestException("A nova senha deve ser diferente da senha atual");
    }

    const passwordHash = await bcrypt.hash(dto.newPassword, 10);
    await this.db.user.update({ where: { id }, data: { passwordHash } });
    await this.db.refreshToken.deleteMany({ where: { userId: id } });
  }

  async toggleStatus(id: string, institutionId: string) {
    const user = await this.db.user.findUnique({ where: { id, institutionId } });
    if (!user) throw new NotFoundException("Usuário não encontrado");
    const next = user.status === UserStatus.ACTIVE ? UserStatus.INACTIVE : UserStatus.ACTIVE;
    const updated = await this.db.user.update({
      where: { id },
      data: { status: next },
      select: { ...userSelect, institutionId: true },
    });

    this.audit
      .log(updated.institutionId, `USER_${next}`, "User", { resourceId: id })
      .catch(() => {});

    return updated;
  }
}
