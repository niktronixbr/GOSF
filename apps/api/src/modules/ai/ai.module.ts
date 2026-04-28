import { Module } from "@nestjs/common";
import { AiController } from "./ai.controller";
import { PlansService } from "./plans.service";
import { AiProviderService } from "./ai-provider.service";
import { NotificationsModule } from "../notifications/notifications.module";
import { MailModule } from "../../common/mail/mail.module";

@Module({
  imports: [NotificationsModule, MailModule],
  controllers: [AiController],
  providers: [PlansService, AiProviderService],
  exports: [PlansService, AiProviderService],
})
export class AiModule {}
