import { Module } from "@nestjs/common";
import { AiController } from "./ai.controller";
import { PlansService } from "./plans.service";
import { AiProviderService } from "./ai-provider.service";

@Module({
  controllers: [AiController],
  providers: [PlansService, AiProviderService],
  exports: [PlansService, AiProviderService],
})
export class AiModule {}
