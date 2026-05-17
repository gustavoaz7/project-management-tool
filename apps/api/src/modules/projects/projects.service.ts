import { Injectable, NotFoundException } from "@nestjs/common";
import { PrismaService } from "../../platform/db/prisma.service";

@Injectable()
export class ProjectsService {
  constructor(private readonly prisma: PrismaService) {}

  async getProject(projectId: string) {
    const project = await this.prisma.project.findUnique({
      where: { id: projectId },
      select: {
        id: true,
        organizationId: true,
        teamId: true,
        name: true,
        key: true,
        description: true,
        createdAt: true,
        updatedAt: true,
        team: {
          select: {
            id: true,
            name: true
          }
        }
      }
    });

    if (!project) {
      throw new NotFoundException(`Project ${projectId} was not found.`);
    }

    return project;
  }
}
