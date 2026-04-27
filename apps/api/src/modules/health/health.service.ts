import { Injectable } from "@nestjs/common";
import type { HealthResponse } from "@project-management-tool/types";

@Injectable()
export class HealthService {
  getHealth(): HealthResponse {
    return {
      service: "api",
      status: "ok",
      timestamp: new Date().toISOString()
    };
  }
}
