import { Module } from "@nestjs/common";
import { BootstrapModule } from "./modules/bootstrap/bootstrap.module";
import { HealthModule } from "./modules/health/health.module";
import { IssuesModule } from "./modules/issues/issues.module";
import { ProjectsModule } from "./modules/projects/projects.module";
import { PrismaModule } from "./platform/db/prisma.module";

@Module({
  imports: [PrismaModule, HealthModule, IssuesModule, ProjectsModule, BootstrapModule]
})
export class AppModule {}
