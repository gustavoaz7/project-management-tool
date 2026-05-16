import { Controller, Get, Param } from "@nestjs/common";
import { ProjectsService } from "./projects.service";

@Controller("projects")
export class ProjectsController {
  constructor(private readonly projectsService: ProjectsService) {}

  @Get(":projectId")
  getProject(@Param("projectId") projectId: string) {
    return this.projectsService.getProject(projectId);
  }
}
