import { Module } from "@nestjs/common";
import { EvaluationsController } from "./evaluations.controller";
import { CyclesService } from "./cycles.service";
import { FormsService } from "./forms.service";
import { SubmissionsService } from "./submissions.service";
import { TargetsService } from "./targets.service";
import { NotificationsModule } from "../notifications/notifications.module";
import { AnalyticsModule } from "../analytics/analytics.module";
import { MailModule } from "../../common/mail/mail.module";

@Module({
  imports: [NotificationsModule, AnalyticsModule, MailModule],
  controllers: [EvaluationsController],
  providers: [CyclesService, FormsService, SubmissionsService, TargetsService],
  exports: [CyclesService, FormsService, SubmissionsService, TargetsService],
})
export class EvaluationsModule {}
