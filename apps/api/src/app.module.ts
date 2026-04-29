import { Module } from "@nestjs/common";
import { APP_GUARD, APP_INTERCEPTOR } from "@nestjs/core";
import { ConfigModule } from "@nestjs/config";
import { ThrottlerModule, ThrottlerGuard } from "@nestjs/throttler";
import { LoggerModule } from "nestjs-pino";
import { AuditInterceptor } from "./common/interceptors/audit.interceptor";
import { JwtAuthGuard } from "./common/guards/jwt-auth.guard";
import { PlanGuard } from "./common/guards/plan.guard";
import { AuthModule } from "./modules/auth/auth.module";
import { UsersModule } from "./modules/users/users.module";
import { InstitutionsModule } from "./modules/institutions/institutions.module";
import { ClassesModule } from "./modules/classes/classes.module";
import { EvaluationsModule } from "./modules/evaluations/evaluations.module";
import { AnalyticsModule } from "./modules/analytics/analytics.module";
import { AiModule } from "./modules/ai/ai.module";
import { NotificationsModule } from "./modules/notifications/notifications.module";
import { PrivacyModule } from "./modules/privacy/privacy.module";
import { AuditModule } from "./modules/audit/audit.module";
import { GoalsModule } from "./modules/goals/goals.module";
import { HealthModule } from "./modules/health/health.module";
import { BillingModule } from "./modules/billing/billing.module";
import { DatabaseModule } from "./common/database/database.module";

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true, envFilePath: [".env", "../../.env"] }),
    LoggerModule.forRoot({
      pinoHttp: {
        level: process.env.LOG_LEVEL ?? (process.env.NODE_ENV === "production" ? "info" : "debug"),
        redact: [
          "req.headers.authorization",
          "req.headers.cookie",
          "req.body.password",
          "req.body.currentPassword",
          "req.body.newPassword",
          "req.body.token",
          "req.body.refreshToken",
        ],
        transport:
          process.env.NODE_ENV !== "production"
            ? { target: "pino-pretty", options: { colorize: true, singleLine: true } }
            : undefined,
      },
    }),
    ThrottlerModule.forRoot([
      { name: "default", ttl: 60000, limit: 200 },
      { name: "auth", ttl: 60000, limit: 5 },
    ]),
    DatabaseModule,
    AuthModule,
    UsersModule,
    InstitutionsModule,
    ClassesModule,
    EvaluationsModule,
    AnalyticsModule,
    AiModule,
    NotificationsModule,
    PrivacyModule,
    AuditModule,
    GoalsModule,
    HealthModule,
    BillingModule,
  ],
  providers: [
    { provide: APP_GUARD, useClass: ThrottlerGuard },
    { provide: APP_GUARD, useClass: JwtAuthGuard },
    { provide: APP_GUARD, useClass: PlanGuard },
    { provide: APP_INTERCEPTOR, useClass: AuditInterceptor },
  ],
})
export class AppModule {}
