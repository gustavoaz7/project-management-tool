import { Module } from "@nestjs/common";
import { HealthModule } from "./modules/health/health.module";
import { PrismaModule } from "./platform/db/prisma.module";

@Module({
  imports: [PrismaModule, HealthModule]
})
export class AppModule {}
