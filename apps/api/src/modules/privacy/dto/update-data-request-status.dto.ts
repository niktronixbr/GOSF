import { IsEnum } from "class-validator";
import { DataRequestStatus } from "@gosf/database";

export class UpdateDataRequestStatusDto {
  @IsEnum(DataRequestStatus)
  status: DataRequestStatus;
}
