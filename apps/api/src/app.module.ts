import { Module } from "@nestjs/common";
import { HealthModule } from "./modules/health/health.module";
import { IssuesModule } from "./modules/issues/issues.module";
import { PrismaModule } from "./platform/db/prisma.module";

@Module({
  imports: [PrismaModule, HealthModule, IssuesModule]
})
export class AppModule {}
