import { NestFactory } from "@nestjs/core";
import { AppModule } from "./app.module";
import { apiEnv } from "./platform/config/env";

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  await app.listen(apiEnv.port);
}

void bootstrap();
