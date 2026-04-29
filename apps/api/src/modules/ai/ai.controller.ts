import { Controller, Post, Get, Param, Query, UseGuards, HttpCode, HttpStatus } from "@nestjs/common";
import { RolesGuard } from "../../common/guards/roles.guard";
import { Roles } from "../../common/decorators/roles.decorator";
import { CurrentUser } from "../../common/decorators/current-user.decorator";
import { UserRole } from "@gosf/database";
import { PlansService } from "./plans.service";

@Controller("ai")
@UseGuards(RolesGuard)
export class AiController {
  constructor(private plans: PlansService) {}

  @Post("plans/student/generate")
  @Roles(UserRole.STUDENT, UserRole.COORDINATOR, UserRole.ADMIN)
  @HttpCode(HttpStatus.CREATED)
  generateStudentPlan(
    @CurrentUser() user: any,
    @Query("cycleId") cycleId: string
  ) {
    return this.plans.generateStudentPlan(user.id, cycleId, user.institutionId);
  }

  @Post("plans/teacher/generate")
  @Roles(UserRole.TEACHER, UserRole.COORDINATOR, UserRole.ADMIN)
  @HttpCode(HttpStatus.CREATED)
  generateTeacherPlan(
    @CurrentUser() user: any,
    @Query("cycleId") cycleId: string
  ) {
    return this.plans.generateTeacherPlan(user.id, cycleId, user.institutionId);
  }

  @Get("plans/student")
  @Roles(UserRole.STUDENT, UserRole.COORDINATOR, UserRole.ADMIN)
  getStudentPlan(@CurrentUser() user: any, @Query("cycleId") cycleId: string) {
    return this.plans.getStudentPlan(user.id, cycleId);
  }

  @Get("plans/teacher")
  @Roles(UserRole.TEACHER, UserRole.COORDINATOR, UserRole.ADMIN)
  getTeacherPlan(@CurrentUser() user: any, @Query("cycleId") cycleId: string) {
    return this.plans.getTeacherPlan(user.id, cycleId);
  }
}
