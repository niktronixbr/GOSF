import { Module } from "@nestjs/common";
import { GradesController } from "./grades.controller";
import { GradesService } from "./grades.service";
import { AiModule } from "../ai/ai.module";

@Module({
  imports: [AiModule],
  controllers: [GradesController],
  providers: [GradesService],
})
export class GradesModule {}
