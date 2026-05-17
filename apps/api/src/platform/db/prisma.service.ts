import { PrismaClient } from "@prisma/client";
import { Injectable, OnModuleInit } from "@nestjs/common";
import { apiEnv } from "../config/env";

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit {
  async onModuleInit() {
    if (!apiEnv.databaseUrl) {
      return;
    }

    await this.$connect();
  }
}
