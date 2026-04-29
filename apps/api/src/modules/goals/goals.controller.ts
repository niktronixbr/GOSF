import {
  Controller, Get, Post, Patch, Delete, Body, Param, UseGuards,
} from "@nestjs/common";
import { RolesGuard } from "../../common/guards/roles.guard";
import { Roles } from "../../common/decorators/roles.decorator";
import { CurrentUser } from "../../common/decorators/current-user.decorator";
import { UserRole } from "@gosf/database";
import { GoalsService } from "./goals.service";
import { CreateGoalDto } from "./dto/create-goal.dto";
import { UpdateGoalDto } from "./dto/update-goal.dto";

@Controller("goals")
@UseGuards(RolesGuard)
@Roles(UserRole.STUDENT)
export class GoalsController {
  constructor(private goals: GoalsService) {}

  @Get()
  findAll(@CurrentUser() user: any) {
    return this.goals.findAll(user.id);
  }

  @Post()
  create(@CurrentUser() user: any, @Body() dto: CreateGoalDto) {
    return this.goals.create(user.id, dto);
  }

  @Patch(":id")
  update(@CurrentUser() user: any, @Param("id") id: string, @Body() dto: UpdateGoalDto) {
    return this.goals.update(user.id, id, dto);
  }

  @Delete(":id")
  remove(@CurrentUser() user: any, @Param("id") id: string) {
    return this.goals.remove(user.id, id);
  }
}
