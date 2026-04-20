import { Injectable, UnauthorizedException } from "@nestjs/common";
import { PassportStrategy } from "@nestjs/passport";
import { ExtractJwt, Strategy } from "passport-jwt";
import { ConfigService } from "@nestjs/config";
import { DatabaseService } from "../../../common/database/database.service";
import { JwtPayload } from "../auth.service";

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(config: ConfigService, private db: DatabaseService) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: config.getOrThrow("JWT_SECRET"),
    });
  }

  async validate(payload: JwtPayload) {
    const user = await this.db.user.findUnique({
      where: { id: payload.sub },
      select: {
        id: true,
        email: true,
        fullName: true,
        role: true,
        status: true,
        institutionId: true,
      },
    });

    if (!user || user.status !== "ACTIVE") {
      throw new UnauthorizedException();
    }

    return user;
  }
}
