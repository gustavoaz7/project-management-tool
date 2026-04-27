import { Module } from "@nestjs/common";
import { HealthModule } from "./modules/health/health.module";
import { PrismaModule } from "./platform/db/prisma.module";
import { QueueModule } from "./platform/queue/queue.module";

@Module({
  imports: [PrismaModule, QueueModule, HealthModule]
})
export class AppModule {}
