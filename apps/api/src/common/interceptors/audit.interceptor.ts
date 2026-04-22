import {
  CallHandler,
  ExecutionContext,
  Injectable,
  Logger,
  NestInterceptor,
} from "@nestjs/common";
import { Observable, tap } from "rxjs";
import { AuditService } from "../../modules/audit/audit.service";

const MUTATING_METHODS = new Set(["POST", "PATCH", "PUT", "DELETE"]);

const SKIP_PATHS = [
  "/api/v1/auth/login",
  "/api/v1/auth/refresh",
  "/api/v1/auth/logout",
  "/api/v1/auth/forgot-password",
  "/api/v1/auth/reset-password",
];

@Injectable()
export class AuditInterceptor implements NestInterceptor {
  private readonly logger = new Logger(AuditInterceptor.name);

  constructor(private audit: AuditService) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    const req = context.switchToHttp().getRequest();
    const method: string = req.method;

    if (!MUTATING_METHODS.has(method)) return next.handle();
    if (SKIP_PATHS.some((p) => req.url?.startsWith(p))) return next.handle();

    const user = req.user;
    if (!user?.institutionId) return next.handle();

    const path: string = (req.routerPath || req.url || "").split("?")[0];
    const resourceType = this.extractResourceType(path);
    const resourceId = req.params?.id ?? null;
    const ipAddress = this.extractIp(req);

    return next.handle().pipe(
      tap({
        next: () => {
          this.audit
            .log(user.institutionId, `${method} ${path}`, resourceType, {
              actorUserId: user.id,
              resourceId,
              ipAddress,
            })
            .catch((err) => this.logger.warn(`Falha ao gravar audit log: ${err.message}`));
        },
      }),
    );
  }

  private extractResourceType(path: string): string {
    const parts = path.replace(/^\/api\/v\d+\//, "").split("/");
    return parts[0] || "unknown";
  }

  private extractIp(req: any): string | undefined {
    const fwd = req.headers?.["x-forwarded-for"];
    if (typeof fwd === "string") return fwd.split(",")[0].trim();
    return req.ip;
  }
}
