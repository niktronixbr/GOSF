import { Module } from "@nestjs/common";
import { EvaluationsController } from "./evaluations.controller";
import { CyclesService } from "./cycles.service";
import { FormsService } from "./forms.service";
import { SubmissionsService } from "./submissions.service";

@Module({
  controllers: [EvaluationsController],
  providers: [CyclesService, FormsService, SubmissionsService],
  exports: [CyclesService, FormsService, SubmissionsService],
})
export class EvaluationsModule {}
