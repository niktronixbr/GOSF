import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  Param,
  Post,
  UseGuards,
} from "@nestjs/common";
import { JwtAuthGuard } from "../../common/guards/jwt-auth.guard";
import { RolesGuard } from "../../common/guards/roles.guard";
import { Roles } from "../../common/decorators/roles.decorator";
import { CurrentUser } from "../../common/decorators/current-user.decorator";
import { UserRole } from "@gosf/database";
import { ClassesService } from "./classes.service";
import { CreateClassDto } from "./dto/create-class.dto";
import { CreateSubjectDto } from "./dto/create-subject.dto";
import { EnrollStudentDto } from "./dto/enroll-student.dto";
import { AssignTeacherDto } from "./dto/assign-teacher.dto";

@Controller("classes")
@UseGuards(JwtAuthGuard, RolesGuard)
export class ClassesController {
  constructor(private classes: ClassesService) {}

  @Get()
  @Roles(UserRole.COORDINATOR, UserRole.ADMIN)
  listClasses(@CurrentUser() user: any) {
    return this.classes.listClasses(user.institutionId);
  }

  @Post()
  @Roles(UserRole.COORDINATOR, UserRole.ADMIN)
  createClass(@CurrentUser() user: any, @Body() dto: CreateClassDto) {
    return this.classes.createClass(user.institutionId, dto);
  }

  @Get("mine")
  @Roles(UserRole.TEACHER)
  getMyClasses(@CurrentUser() user: any) {
    return this.classes.getTeacherClasses(user.id);
  }

  @Get("students")
  @Roles(UserRole.COORDINATOR, UserRole.ADMIN)
  listStudents(@CurrentUser() user: any) {
    return this.classes.listStudents(user.institutionId);
  }

  @Get("teachers")
  @Roles(UserRole.COORDINATOR, UserRole.ADMIN)
  listTeachers(@CurrentUser() user: any) {
    return this.classes.listTeachers(user.institutionId);
  }

  @Get(":id")
  @Roles(UserRole.COORDINATOR, UserRole.ADMIN, UserRole.TEACHER)
  getClassDetail(@CurrentUser() user: any, @Param("id") id: string) {
    return this.classes.getClassDetail(user.institutionId, id);
  }

  @Post(":id/enrollments")
  @Roles(UserRole.COORDINATOR, UserRole.ADMIN)
  enrollStudent(
    @CurrentUser() user: any,
    @Param("id") id: string,
    @Body() dto: EnrollStudentDto
  ) {
    return this.classes.enrollStudent(user.institutionId, id, dto);
  }

  @Delete(":id/enrollments/:studentId")
  @Roles(UserRole.COORDINATOR, UserRole.ADMIN)
  unenrollStudent(
    @CurrentUser() user: any,
    @Param("id") id: string,
    @Param("studentId") studentId: string
  ) {
    return this.classes.unenrollStudent(user.institutionId, id, studentId);
  }

  @Post(":id/assignments")
  @Roles(UserRole.COORDINATOR, UserRole.ADMIN)
  assignTeacher(
    @CurrentUser() user: any,
    @Param("id") id: string,
    @Body() dto: AssignTeacherDto
  ) {
    return this.classes.assignTeacher(user.institutionId, id, dto);
  }

  @Delete(":id/assignments/:assignmentId")
  @Roles(UserRole.COORDINATOR, UserRole.ADMIN)
  removeAssignment(
    @CurrentUser() user: any,
    @Param("id") id: string,
    @Param("assignmentId") assignmentId: string
  ) {
    return this.classes.removeAssignment(user.institutionId, id, assignmentId);
  }
}

@Controller("subjects")
@UseGuards(JwtAuthGuard, RolesGuard)
export class SubjectsController {
  constructor(private classes: ClassesService) {}

  @Get()
  @Roles(UserRole.COORDINATOR, UserRole.ADMIN, UserRole.TEACHER)
  listSubjects(@CurrentUser() user: any) {
    return this.classes.listSubjects(user.institutionId);
  }

  @Post()
  @Roles(UserRole.COORDINATOR, UserRole.ADMIN)
  createSubject(@CurrentUser() user: any, @Body() dto: CreateSubjectDto) {
    return this.classes.createSubject(user.institutionId, dto);
  }

  @Delete(":id")
  @Roles(UserRole.COORDINATOR, UserRole.ADMIN)
  @HttpCode(200)
  deleteSubject(@CurrentUser() user: any, @Param("id") id: string) {
    return this.classes.deleteSubject(user.institutionId, id);
  }
}
