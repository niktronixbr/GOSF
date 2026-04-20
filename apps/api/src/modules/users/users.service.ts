import { Injectable, NotFoundException } from "@nestjs/common";
import { DatabaseService } from "../../common/database/database.service";

@Injectable()
export class UsersService {
  constructor(private db: DatabaseService) {}

  async findById(id: string) {
    const user = await this.db.user.findUnique({
      where: { id },
      select: {
        id: true,
        email: true,
        fullName: true,
        role: true,
        status: true,
        avatarUrl: true,
        institutionId: true,
        lastLoginAt: true,
        createdAt: true,
      },
    });
    if (!user) throw new NotFoundException("User not found");
    return user;
  }

  async findByInstitution(institutionId: string) {
    return this.db.user.findMany({
      where: { institutionId },
      select: {
        id: true,
        email: true,
        fullName: true,
        role: true,
        status: true,
        avatarUrl: true,
        lastLoginAt: true,
        createdAt: true,
      },
      orderBy: { fullName: "asc" },
    });
  }
}
