import {
  Controller,
  Get,
  Post,
  Delete,
  Body,
  Param,
  UseGuards,
  HttpCode,
  HttpStatus,
} from "@nestjs/common";
import { RolesGuard } from "../../common/guards/roles.guard";
import { Roles } from "../../common/decorators/roles.decorator";
import { CurrentUser } from "../../common/decorators/current-user.decorator";
import { UserRole } from "@gosf/database";
import { GradesService } from "./grades.service";
import { CreateGradeDto } from "./dto/create-grade.dto";

@Controller("grades")
@UseGuards(RolesGuard)
export class GradesController {
  constructor(private grades: GradesService) {}

  @Post()
  @Roles(UserRole.TEACHER)
  @HttpCode(HttpStatus.CREATED)
  upsert(@CurrentUser() user: any, @Body() dto: CreateGradeDto) {
    return this.grades.upsertGrade(user.id, dto);
  }

  @Delete(":id")
  @Roles(UserRole.TEACHER)
  deleteGrade(@CurrentUser() user: any, @Param("id") id: string) {
    return this.grades.deleteGrade(user.id, id);
  }

  @Get("students")
  @Roles(UserRole.TEACHER)
  getStudents(@CurrentUser() user: any) {
    return this.grades.getStudentsForTeacher(user.id);
  }

  @Get("my")
  @Roles(UserRole.STUDENT)
  getMyGrades(@CurrentUser() user: any) {
    return this.grades.getMyGrades(user.id);
  }

  @Get("overview")
  @Roles(UserRole.COORDINATOR, UserRole.ADMIN)
  getOverview(@CurrentUser() user: any) {
    return this.grades.getOverview(user.institutionId);
  }
}
