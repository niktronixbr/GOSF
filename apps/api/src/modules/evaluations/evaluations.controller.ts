import {
  Controller,
  Get,
  Post,
  Patch,
  Body,
  Param,
  Query,
  UseGuards,
  HttpCode,
  HttpStatus,
} from "@nestjs/common";
import { JwtAuthGuard } from "../../common/guards/jwt-auth.guard";
import { RolesGuard } from "../../common/guards/roles.guard";
import { Roles } from "../../common/decorators/roles.decorator";
import { CurrentUser } from "../../common/decorators/current-user.decorator";
import { UserRole, TargetType } from "@gosf/database";
import { CyclesService } from "./cycles.service";
import { FormsService } from "./forms.service";
import { SubmissionsService } from "./submissions.service";
import { TargetsService } from "./targets.service";
import { CreateCycleDto } from "./dto/create-cycle.dto";
import { CreateFormDto } from "./dto/create-form.dto";
import { SubmitEvaluationDto } from "./dto/submit-evaluation.dto";

@Controller("evaluations")
@UseGuards(JwtAuthGuard, RolesGuard)
export class EvaluationsController {
  constructor(
    private cycles: CyclesService,
    private forms: FormsService,
    private submissions: SubmissionsService,
    private targets: TargetsService
  ) {}

  // ─── Cycles ───────────────────────────────────────────────

  @Get("cycles")
  getCycles(@CurrentUser() user: any) {
    return this.cycles.findAll(user.institutionId);
  }

  @Get("cycles/active")
  getActiveCycle(@CurrentUser() user: any) {
    return this.cycles.getActiveCycle(user.institutionId);
  }

  @Get("cycles/:id")
  getCycle(@Param("id") id: string, @CurrentUser() user: any) {
    return this.cycles.findOne(id, user.institutionId);
  }

  @Post("cycles")
  @Roles(UserRole.ADMIN, UserRole.COORDINATOR)
  createCycle(@Body() dto: CreateCycleDto, @CurrentUser() user: any) {
    return this.cycles.create(user.institutionId, dto);
  }

  @Patch("cycles/:id/open")
  @Roles(UserRole.ADMIN, UserRole.COORDINATOR)
  openCycle(@Param("id") id: string, @CurrentUser() user: any) {
    return this.cycles.open(id, user.institutionId);
  }

  @Patch("cycles/:id/close")
  @Roles(UserRole.ADMIN, UserRole.COORDINATOR)
  closeCycle(@Param("id") id: string, @CurrentUser() user: any) {
    return this.cycles.close(id, user.institutionId);
  }

  // ─── Forms ────────────────────────────────────────────────

  @Get("forms")
  getForms(
    @CurrentUser() user: any,
    @Query("targetType") targetType?: TargetType
  ) {
    return this.forms.findAll(user.institutionId, targetType);
  }

  @Get("forms/:id")
  getForm(@Param("id") id: string, @CurrentUser() user: any) {
    return this.forms.findOne(id, user.institutionId);
  }

  @Post("forms")
  @Roles(UserRole.ADMIN, UserRole.COORDINATOR)
  createForm(@Body() dto: CreateFormDto, @CurrentUser() user: any) {
    return this.forms.create(user.institutionId, dto);
  }

  @Post("forms/seed-defaults")
  @Roles(UserRole.ADMIN)
  @HttpCode(HttpStatus.NO_CONTENT)
  seedForms(@CurrentUser() user: any) {
    return this.forms.seedDefaults(user.institutionId);
  }

  // ─── Submissions ──────────────────────────────────────────

  @Post("submit/teacher")
  @Roles(UserRole.STUDENT)
  @HttpCode(HttpStatus.CREATED)
  submitTeacher(@CurrentUser() user: any, @Body() dto: SubmitEvaluationDto) {
    return this.submissions.submitTeacherEvaluation(user.id, dto);
  }

  @Post("submit/student")
  @Roles(UserRole.TEACHER)
  @HttpCode(HttpStatus.CREATED)
  submitStudent(@CurrentUser() user: any, @Body() dto: SubmitEvaluationDto) {
    return this.submissions.submitStudentEvaluation(user.id, dto);
  }

  @Get("my/teacher-evaluations")
  @Roles(UserRole.STUDENT)
  getMyTeacherEvaluations(
    @CurrentUser() user: any,
    @Query("cycleId") cycleId: string
  ) {
    return this.submissions.getMyTeacherEvaluations(user.id, cycleId);
  }

  @Get("my/student-evaluations")
  @Roles(UserRole.TEACHER)
  getMyStudentEvaluations(
    @CurrentUser() user: any,
    @Query("cycleId") cycleId: string
  ) {
    return this.submissions.getMyStudentEvaluations(user.id, cycleId);
  }

  // ─── Targets ──────────────────────────────────────────────

  @Get("targets/teachers")
  @Roles(UserRole.STUDENT)
  getTeachersForStudent(@CurrentUser() user: any) {
    return this.targets.getTeachersForStudent(user.id, user.institutionId);
  }

  @Get("targets/students")
  @Roles(UserRole.TEACHER)
  getStudentsForTeacher(@CurrentUser() user: any) {
    return this.targets.getStudentsForTeacher(user.id, user.institutionId);
  }
}
