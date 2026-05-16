import { Injectable } from "@nestjs/common";
import { PrismaService } from "../../platform/db/prisma.service";
import { BootstrapWorkspaceDto } from "./dto/bootstrap-workspace.dto";

@Injectable()
export class BootstrapService {
  constructor(private readonly prisma: PrismaService) {}

  async bootstrapWorkspace(dto: BootstrapWorkspaceDto) {
    return this.prisma.$transaction(async (tx: any) => {
      const organization = await tx.organization.create({
        data: {
          name: dto.organizationName
        }
      });

      const team = await tx.team.create({
        data: {
          name: dto.teamName,
          organizationId: organization.id
        }
      });

      const project = await tx.project.create({
        data: {
          name: dto.projectName,
          key: dto.projectKey,
          organizationId: organization.id,
          teamId: team.id
        }
      });

      return {
        organization,
        team,
        project
      };
    });
  }
}
