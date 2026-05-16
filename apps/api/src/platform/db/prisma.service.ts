import { Injectable, OnModuleInit } from "@nestjs/common";
import { apiEnv } from "../config/env";

const prismaModule = (() => {
  try {
    return require("@prisma/client") as {
      PrismaClient?: new () => Record<string, any>;
    };
  } catch {
    return {};
  }
})();

const PrismaClientBase =
  prismaModule.PrismaClient ??
  class {
    [key: string]: any;
  };

@Injectable()
export class PrismaService extends PrismaClientBase implements OnModuleInit {
  declare $connect?: () => Promise<void>;
  [key: string]: any;

  async onModuleInit() {
    if (!apiEnv.databaseUrl) {
      return;
    }

    if (typeof this.$connect === "function") {
      await this.$connect();
    }
  }
}
