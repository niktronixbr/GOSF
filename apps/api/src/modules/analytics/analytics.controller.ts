import { Controller, Get, Post, Param, Query, UseGuards } from "@nestjs/common";
import { JwtAuthGuard } from "../../common/guards/jwt-auth.guard";
import { RolesGuard } from "../../common/guards/roles.guard";
import { Roles } from "../../common/decorators/roles.decorator";
import { CurrentUser } from "../../common/decorators/current-user.decorator";
import { UserRole } from "@gosf/database";
import { AnalyticsService } from "./analytics.service";

@Controller("analytics")
@UseGuards(JwtAuthGuard, RolesGuard)
export class AnalyticsController {
  constructor(private analytics: AnalyticsService) {}

  @Get("dashboard/student")
  @Roles(UserRole.STUDENT)
  getStudentDashboard(@CurrentUser() user: any) {
    return this.analytics.getDashboardStudent(user.id, user.institutionId);
  }

  @Get("dashboard/teacher")
  @Roles(UserRole.TEACHER)
  getTeacherDashboard(@CurrentUser() user: any) {
    return this.analytics.getDashboardTeacher(user.id, user.institutionId);
  }

  @Get("teacher/students")
  @Roles(UserRole.TEACHER)
  getTeacherStudentInsights(@CurrentUser() user: any) {
    return this.analytics.getTeacherStudentInsights(user.id, user.institutionId);
  }

  @Get("student/history")
  @Roles(UserRole.STUDENT)
  getStudentHistory(@CurrentUser() user: any) {
    return this.analytics.getStudentHistory(user.id);
  }

  @Get("student/feedbacks")
  @Roles(UserRole.STUDENT)
  getStudentFeedbacks(@CurrentUser() user: any) {
    return this.analytics.getStudentFeedbacks(user.id);
  }

  @Get("reports")
  @Roles(UserRole.COORDINATOR, UserRole.ADMIN)
  getReports(
    @CurrentUser() user: any,
    @Query("cycleId") cycleId: string
  ) {
    return this.analytics.getReports(user.institutionId, cycleId ?? "");
  }

  @Get("overview")
  @Roles(UserRole.COORDINATOR, UserRole.ADMIN)
  getOverview(@CurrentUser() user: any, @Query("cycleId") cycleId: string) {
    return this.analytics.getInstitutionOverview(user.institutionId, cycleId);
  }

  @Get("benchmarking")
  @Roles(UserRole.COORDINATOR, UserRole.ADMIN)
  getBenchmarking(
    @CurrentUser() user: any,
    @Query("cycleId") cycleId: string
  ) {
    return this.analytics.getBenchmarking(user.institutionId, cycleId ?? "");
  }

  @Get("teachers")
  @Roles(UserRole.COORDINATOR, UserRole.ADMIN)
  getTeachersWithScores(
    @CurrentUser() user: any,
    @Query("cycleId") cycleId: string
  ) {
    return this.analytics.getTeachersWithScores(user.institutionId, cycleId ?? "");
  }

  @Post("compute/teacher/:teacherId/cycle/:cycleId")
  @Roles(UserRole.COORDINATOR, UserRole.ADMIN)
  computeTeacher(
    @Param("teacherId") teacherId: string,
    @Param("cycleId") cycleId: string,
    @CurrentUser() user: any
  ) {
    return this.analytics.computeTeacherScores(teacherId, cycleId, user.institutionId);
  }

  @Post("compute/student/:studentId/cycle/:cycleId")
  @Roles(UserRole.COORDINATOR, UserRole.ADMIN)
  computeStudent(
    @Param("studentId") studentId: string,
    @Param("cycleId") cycleId: string,
    @CurrentUser() user: any
  ) {
    return this.analytics.computeStudentScores(studentId, cycleId, user.institutionId);
  }
}
