import { CanActivate, ExecutionContext, HttpException, Injectable } from "@nestjs/common";
import { Reflector } from "@nestjs/core";
import { IS_PUBLIC_KEY } from "../decorators/public.decorator";
import { SKIP_PLAN_GUARD_KEY } from "../decorators/skip-plan-guard.decorator";

@Injectable()
export class PlanGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (isPublic) return true;

    const req = context.switchToHttp().getRequest();
    const user = req.user;
    if (!user) return true;

    if (user.role === "ADMIN") return true;

    const skip = this.reflector.getAllAndOverride<boolean>(SKIP_PLAN_GUARD_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (skip) return true;

    if (user.institutionStatus === "SUSPENDED") {
      throw new HttpException(
        "Sua assinatura está suspensa por falha no pagamento. Acesse as configurações para regularizar.",
        402,
      );
    }

    if (user.institutionStatus === "INACTIVE") {
      throw new HttpException(
        "Assinatura cancelada. Acesse /coordinator/settings para reativar.",
        402,
      );
    }

    return true;
  }
}
