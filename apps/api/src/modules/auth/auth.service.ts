import {
  Injectable,
  UnauthorizedException,
  BadRequestException,
} from "@nestjs/common";
import { JwtService } from "@nestjs/jwt";
import { ConfigService } from "@nestjs/config";
import * as bcrypt from "bcryptjs";
import * as crypto from "crypto";
import { DatabaseService } from "../../common/database/database.service";
import { MailService } from "../../common/mail/mail.service";

export interface JwtPayload {
  sub: string;
  email: string;
  fullName: string;
  role: string;
  institutionId: string;
}

@Injectable()
export class AuthService {
  constructor(
    private db: DatabaseService,
    private jwt: JwtService,
    private config: ConfigService,
    private mail: MailService,
  ) {}

  async validateUser(email: string, password: string, institutionSlug: string) {
    const institution = await this.db.institution.findUnique({
      where: { slug: institutionSlug },
    });
    if (!institution) throw new UnauthorizedException("Institution not found");

    const user = await this.db.user.findUnique({
      where: { institutionId_email: { institutionId: institution.id, email } },
    });

    if (!user || !(await bcrypt.compare(password, user.passwordHash))) {
      throw new UnauthorizedException("Invalid credentials");
    }

    if (user.status !== "ACTIVE") {
      throw new UnauthorizedException("Account is not active");
    }

    await this.db.user.update({
      where: { id: user.id },
      data: { lastLoginAt: new Date() },
    });

    return {
      id: user.id,
      email: user.email,
      fullName: user.fullName,
      role: user.role,
      institutionId: user.institutionId,
      status: user.status,
    };
  }

  async login(user: { id: string; email: string; fullName: string; role: string; institutionId: string }) {
    const payload: JwtPayload = {
      sub: user.id,
      email: user.email,
      fullName: user.fullName,
      role: user.role,
      institutionId: user.institutionId,
    };

    const accessToken = this.jwt.sign(payload);
    const refreshToken = this.jwt.sign(payload, {
      secret: this.config.getOrThrow("JWT_REFRESH_SECRET"),
      expiresIn: this.config.get("JWT_REFRESH_EXPIRES_IN", "7d"),
    });

    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7);

    await this.db.refreshToken.create({
      data: { userId: user.id, token: refreshToken, expiresAt },
    });

    return { accessToken, refreshToken };
  }

  async refresh(token: string) {
    const stored = await this.db.refreshToken.findUnique({
      where: { token },
      include: { user: true },
    });

    if (!stored || stored.revokedAt || stored.expiresAt < new Date()) {
      throw new UnauthorizedException("Invalid refresh token");
    }

    await this.db.refreshToken.update({
      where: { id: stored.id },
      data: { revokedAt: new Date() },
    });

    return this.login({
      id: stored.user.id,
      email: stored.user.email,
      fullName: stored.user.fullName,
      role: stored.user.role,
      institutionId: stored.user.institutionId,
    });
  }

  async logout(token: string) {
    await this.db.refreshToken.updateMany({
      where: { token },
      data: { revokedAt: new Date() },
    });
  }

  async forgotPassword(email: string, institutionSlug: string) {
    const institution = await this.db.institution.findUnique({
      where: { slug: institutionSlug },
    });

    // Resposta genérica — não revela se o e-mail existe
    if (!institution) return { message: "Se o e-mail existir, você receberá as instruções." };

    const user = await this.db.user.findUnique({
      where: { institutionId_email: { institutionId: institution.id, email } },
    });

    if (!user || user.status !== "ACTIVE") {
      return { message: "Se o e-mail existir, você receberá as instruções." };
    }

    // Invalida tokens anteriores não utilizados
    await this.db.passwordResetToken.updateMany({
      where: { userId: user.id, usedAt: null },
      data: { usedAt: new Date() },
    });

    const token = crypto.randomBytes(32).toString("hex");
    const expiresAt = new Date(Date.now() + 60 * 60 * 1000); // 1 hora

    await this.db.passwordResetToken.create({
      data: { userId: user.id, token, expiresAt },
    });

    const appUrl = this.config.get("APP_URL", "http://localhost:3002");
    const resetUrl = `${appUrl}/reset-password?token=${token}`;

    await this.mail.sendPasswordReset(user.email, user.fullName, resetUrl);

    return { message: "Se o e-mail existir, você receberá as instruções." };
  }

  async resetPassword(token: string, newPassword: string) {
    const record = await this.db.passwordResetToken.findUnique({
      where: { token },
      include: { user: true },
    });

    if (!record || record.usedAt || record.expiresAt < new Date()) {
      throw new BadRequestException("Token inválido ou expirado");
    }

    const passwordHash = await bcrypt.hash(newPassword, 10);

    await this.db.$transaction([
      this.db.user.update({
        where: { id: record.userId },
        data: { passwordHash },
      }),
      this.db.passwordResetToken.update({
        where: { id: record.id },
        data: { usedAt: new Date() },
      }),
      // Revoga todos os refresh tokens do usuário
      this.db.refreshToken.updateMany({
        where: { userId: record.userId, revokedAt: null },
        data: { revokedAt: new Date() },
      }),
    ]);

    return { message: "Senha redefinida com sucesso" };
  }
}
