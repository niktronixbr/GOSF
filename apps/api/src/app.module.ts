import { Module } from "@nestjs/common";
import { APP_GUARD, APP_INTERCEPTOR } from "@nestjs/core";
import { ConfigModule } from "@nestjs/config";
import { ThrottlerModule, ThrottlerGuard } from "@nestjs/throttler";
import { AuditInterceptor } from "./common/interceptors/audit.interceptor";
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
import { DatabaseModule } from "./common/database/database.module";

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true, envFilePath: [".env", "../../.env"] }),
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
  ],
  providers: [
    { provide: APP_GUARD, useClass: ThrottlerGuard },
    { provide: APP_INTERCEPTOR, useClass: AuditInterceptor },
  ],
})
export class AppModule {}
