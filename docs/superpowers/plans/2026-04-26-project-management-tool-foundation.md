# Project Management Tool Foundation Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build the Turborepo foundation for the project management tool, including the monorepo layout, local infrastructure, shared packages, a running Next.js web app, a running NestJS API, a running worker, and one thin end-to-end health vertical slice.

**Architecture:** This plan creates a Turborepo-based monorepo with separate deployables in `apps/web`, `apps/api`, and `apps/worker`, plus small shared packages for TypeScript and lint configuration. It establishes Docker-based local infrastructure, Prisma-backed database wiring in the API, and a minimal queue-backed worker so later feature work lands on a production-realistic skeleton instead of a toy scaffold.

**Tech Stack:** Turborepo, pnpm workspaces, Next.js, NestJS, TypeScript, Prisma, PostgreSQL, Redis, BullMQ, Docker Compose, ESLint, Prettier, Vitest, Jest

---

## Planned File Structure

### Root workspace files

- Create: `package.json`
- Create: `pnpm-workspace.yaml`
- Create: `turbo.json`
- Create: `.gitignore`
- Create: `.editorconfig`
- Create: `.env.example`
- Create: `README.md`

### Shared packages

- Create: `packages/tsconfig/package.json`
- Create: `packages/tsconfig/base.json`
- Create: `packages/tsconfig/nextjs.json`
- Create: `packages/tsconfig/nestjs.json`
- Create: `packages/eslint-config/package.json`
- Create: `packages/eslint-config/base.js`
- Create: `packages/eslint-config/next.js`
- Create: `packages/eslint-config/nest.js`
- Create: `packages/config/package.json`
- Create: `packages/config/src/env.ts`
- Create: `packages/config/src/index.ts`
- Create: `packages/types/package.json`
- Create: `packages/types/src/health.d.ts`
- Create: `packages/types/src/index.d.ts`

### Web app

- Create: `apps/web/package.json`
- Create: `apps/web/tsconfig.json`
- Create: `apps/web/next.config.js`
- Create: `apps/web/.eslintrc.js`
- Create: `apps/web/app/layout.tsx`
- Create: `apps/web/app/page.tsx`
- Create: `apps/web/app/globals.css`
- Create: `apps/web/lib/api.ts`

### API app

- Create: `apps/api/package.json`
- Create: `apps/api/tsconfig.json`
- Create: `apps/api/tsconfig.build.json`
- Create: `apps/api/nest-cli.json`
- Create: `apps/api/.eslintrc.js`
- Create: `apps/api/src/main.ts`
- Create: `apps/api/src/app.module.ts`
- Create: `apps/api/src/platform/config/env.ts`
- Create: `apps/api/src/platform/db/prisma.service.ts`
- Create: `apps/api/src/platform/db/prisma.module.ts`
- Create: `apps/api/src/platform/queue/queue.module.ts`
- Create: `apps/api/src/modules/health/health.controller.ts`
- Create: `apps/api/src/modules/health/health.service.ts`
- Create: `apps/api/src/modules/health/health.module.ts`
- Create: `apps/api/prisma/schema.prisma`

### Worker app

- Create: `apps/worker/package.json`
- Create: `apps/worker/tsconfig.json`
- Create: `apps/worker/.eslintrc.js`
- Create: `apps/worker/src/main.ts`
- Create: `apps/worker/src/env.ts`
- Create: `apps/worker/src/queues/health.queue.ts`

### Infrastructure

- Create: `infra/docker/docker-compose.yml`

### Tests

- Create: `apps/api/test/health.e2e-spec.ts`
- Create: `apps/web/app/page.test.tsx`
- Create: `apps/worker/src/queues/health.queue.test.ts`

## Task 1: Scaffold the Turborepo Workspace

**Files:**
- Create: `package.json`
- Create: `pnpm-workspace.yaml`
- Create: `turbo.json`
- Create: `.gitignore`
- Create: `.editorconfig`
- Create: `.env.example`
- Create: `README.md`

- [ ] **Step 1: Write the failing workspace smoke check**

Create `README.md` with the expected workspace commands so the first setup task has a concrete target:

```md
# Project Management Tool

## Workspace Commands

- `pnpm install`
- `pnpm dev`
- `pnpm lint`
- `pnpm test`
- `pnpm build`
```

- [ ] **Step 2: Run the root command to verify it fails before scaffolding**

Run:

```powershell
pnpm -w lint
```

Expected: FAIL with a message that no `package.json` exists yet.

- [ ] **Step 3: Write the minimal root workspace files**

Create `package.json`:

```json
{
  "name": "project-management-tool",
  "private": true,
  "packageManager": "pnpm@10.0.0",
  "scripts": {
    "build": "turbo run build",
    "dev": "turbo run dev --parallel",
    "lint": "turbo run lint",
    "test": "turbo run test",
    "format": "turbo run format"
  },
  "devDependencies": {
    "turbo": "^2.0.14"
  }
}
```

Create `pnpm-workspace.yaml`:

```yaml
packages:
  - "apps/*"
  - "packages/*"
```

Create `turbo.json`:

```json
{
  "$schema": "https://turbo.build/schema.json",
  "tasks": {
    "build": {
      "dependsOn": ["^build"],
      "outputs": [".next/**", "dist/**"]
    },
    "dev": {
      "cache": false,
      "persistent": true
    },
    "lint": {
      "dependsOn": ["^lint"]
    },
    "test": {
      "dependsOn": ["^test"],
      "outputs": ["coverage/**"]
    },
    "format": {
      "cache": false
    }
  }
}
```

Create `.gitignore`:

```gitignore
node_modules
.turbo
.next
dist
coverage
.env
.env.local
pnpm-lock.yaml
```

Create `.editorconfig`:

```ini
root = true

[*]
charset = utf-8
end_of_line = lf
insert_final_newline = true
indent_style = space
indent_size = 2
trim_trailing_whitespace = true
```

Create `.env.example`:

```env
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/project_management_tool
REDIS_URL=redis://localhost:6379
NEXT_PUBLIC_API_URL=http://localhost:3001
API_PORT=3001
WEB_PORT=3000
```

- [ ] **Step 4: Run the root command to verify the workspace is recognized**

Run:

```powershell
pnpm -w lint
```

Expected: FAIL with Turbo finding the workspace but no package-level `lint` tasks yet.

- [ ] **Step 5: Commit**

Run:

```powershell
git add README.md package.json pnpm-workspace.yaml turbo.json .gitignore .editorconfig .env.example
git commit -m "chore: scaffold turbo workspace root"
```

## Task 2: Add Shared Workspace Packages

**Files:**
- Create: `packages/tsconfig/package.json`
- Create: `packages/tsconfig/base.json`
- Create: `packages/tsconfig/nextjs.json`
- Create: `packages/tsconfig/nestjs.json`
- Create: `packages/eslint-config/package.json`
- Create: `packages/eslint-config/base.js`
- Create: `packages/eslint-config/next.js`
- Create: `packages/eslint-config/nest.js`
- Create: `packages/config/package.json`
- Create: `packages/config/src/env.ts`
- Create: `packages/config/src/index.ts`
- Create: `packages/types/package.json`
- Create: `packages/types/src/health.d.ts`
- Create: `packages/types/src/index.d.ts`

- [ ] **Step 1: Write the failing package import test**

Create `packages/types/src/health.d.ts`:

```ts
export type HealthResponse = {
  service: "api";
  status: "ok";
  timestamp: string;
};
```

Create `packages/types/src/index.d.ts`:

```ts
export * from "./health";
```

Run a quick type import check later from the apps to prove package resolution works.

- [ ] **Step 2: Run package resolution before package manifests exist**

Run:

```powershell
pnpm -w test
```

Expected: FAIL because the shared packages and app tests do not exist yet.

- [ ] **Step 3: Write the shared package files**

Create `packages/tsconfig/package.json`:

```json
{
  "name": "@project-management-tool/tsconfig",
  "version": "0.0.0",
  "private": true
}
```

Create `packages/tsconfig/base.json`:

```json
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "ESNext",
    "moduleResolution": "Bundler",
    "strict": true,
    "skipLibCheck": true,
    "noEmit": true,
    "esModuleInterop": true,
    "forceConsistentCasingInFileNames": true
  }
}
```

Create `packages/tsconfig/nextjs.json`:

```json
{
  "extends": "./base.json",
  "compilerOptions": {
    "jsx": "preserve",
    "allowJs": true,
    "incremental": true,
    "plugins": [{ "name": "next" }]
  }
}
```

Create `packages/tsconfig/nestjs.json`:

```json
{
  "extends": "./base.json",
  "compilerOptions": {
    "module": "CommonJS",
    "moduleResolution": "Node",
    "noEmit": false,
    "declaration": true,
    "removeComments": true,
    "emitDecoratorMetadata": true,
    "experimentalDecorators": true,
    "sourceMap": true
  }
}
```

Create `packages/eslint-config/package.json`:

```json
{
  "name": "@project-management-tool/eslint-config",
  "version": "0.0.0",
  "private": true,
  "peerDependencies": {
    "@typescript-eslint/eslint-plugin": "^8.0.0",
    "@typescript-eslint/parser": "^8.0.0",
    "eslint": "^8.57.0 || ^9.0.0",
    "eslint-config-next": "^15.0.0"
  }
}
```

Create `packages/eslint-config/base.js`:

```js
module.exports = {
  root: false,
  env: {
    es2022: true,
    node: true
  },
  extends: ["eslint:recommended"],
  parserOptions: {
    ecmaVersion: "latest",
    sourceType: "module"
  },
  overrides: [
    {
      files: ["**/*.ts", "**/*.tsx"],
      parser: "@typescript-eslint/parser",
      plugins: ["@typescript-eslint"],
      extends: ["plugin:@typescript-eslint/recommended"]
    }
  ]
};
```

Create `packages/eslint-config/next.js`:

```js
module.exports = {
  extends: ["./base", "next/core-web-vitals"]
};
```

Create `packages/eslint-config/nest.js`:

```js
module.exports = {
  extends: ["./base"],
  env: {
    jest: true
  }
};
```

Create `packages/config/package.json`:

```json
{
  "name": "@project-management-tool/config",
  "version": "0.0.0",
  "private": true,
  "type": "module",
  "exports": {
    ".": "./src/index.ts"
  }
}
```

Create `packages/config/src/env.ts`:

```ts
export const requiredEnv = (value: string | undefined, name: string) => {
  if (!value) {
    throw new Error(`Missing environment variable: ${name}`);
  }

  return value;
};
```

Create `packages/config/src/index.ts`:

```ts
export * from "./env.js";
```

Create `packages/types/package.json`:

```json
{
  "name": "@project-management-tool/types",
  "version": "0.0.0",
  "private": true,
  "type": "module",
  "types": "./src/index.d.ts",
  "exports": {
    ".": "./src/index.d.ts"
  }
}
```

- [ ] **Step 4: Run the workspace command to verify package definitions are valid**

Run:

```powershell
pnpm -w lint
```

Expected: FAIL because the apps still do not exist, but the root workspace and package manifests are now parseable.

- [ ] **Step 5: Commit**

Run:

```powershell
git add packages/tsconfig packages/eslint-config packages/config packages/types
git commit -m "chore: add shared workspace packages"
```

## Task 3: Scaffold the Next.js Web App

**Files:**
- Create: `apps/web/package.json`
- Create: `apps/web/tsconfig.json`
- Create: `apps/web/next-env.d.ts`
- Create: `apps/web/next.config.js`
- Create: `apps/web/.eslintrc.js`
- Create: `apps/web/app/layout.tsx`
- Create: `apps/web/app/page.tsx`
- Create: `apps/web/app/globals.css`
- Create: `apps/web/lib/api.ts`
- Create: `apps/web/app/page.test.tsx`
- Create: `apps/web/vitest.config.ts`
- Create: `apps/web/vitest.setup.ts`
- Modify: `pnpm-lock.yaml`

- [ ] **Step 1: Write the failing web page test**

Create `apps/web/app/page.test.tsx`:

```tsx
import React from "react";
import { render, screen } from "@testing-library/react";
import HomePage from "./page";

describe("HomePage", () => {
  it("renders the platform status heading", () => {
    render(<HomePage />);
    expect(screen.getByText("Project Management Tool")).toBeInTheDocument();
    expect(screen.getByText("Platform foundation is online.")).toBeInTheDocument();
  });
});
```

- [ ] **Step 2: Run the web test to verify it fails**

Run:

```powershell
pnpm --filter web test
```

Expected: FAIL because the `web` workspace and test runner are not defined yet.

- [ ] **Step 3: Write the minimal web app implementation**

Create `apps/web/package.json`:

```json
{
  "name": "web",
  "private": true,
  "scripts": {
    "dev": "next dev -p 3000",
    "build": "next build",
    "start": "next start",
    "lint": "next lint",
    "test": "vitest run"
  },
  "dependencies": {
    "@project-management-tool/types": "workspace:*",
    "next": "^15.0.0",
    "react": "^19.0.0",
    "react-dom": "^19.0.0"
  },
  "devDependencies": {
    "@project-management-tool/eslint-config": "workspace:*",
    "@project-management-tool/tsconfig": "workspace:*",
    "@testing-library/jest-dom": "^6.6.3",
    "@testing-library/react": "^16.0.1",
    "@types/node": "^22.10.2",
    "@types/react": "^19.0.2",
    "@types/react-dom": "^19.0.2",
    "eslint": "^9.16.0",
    "jsdom": "^25.0.1",
    "typescript": "^5.7.2",
    "vitest": "^2.1.8"
  }
}
```

Create `apps/web/tsconfig.json`:

```json
{
  "extends": "@project-management-tool/tsconfig/nextjs.json",
  "compilerOptions": {
    "baseUrl": ".",
    "paths": {
      "@/*": ["./*"]
    }
  },
  "include": ["next-env.d.ts", "**/*.ts", "**/*.tsx"],
  "exclude": ["node_modules"]
}
```

Create `apps/web/next-env.d.ts`:

```ts
/// <reference types="next" />
/// <reference types="next/image-types/global" />

// This file is automatically generated by Next.js.
// Do not edit this file directly.
```

Create `apps/web/next.config.js`:

```js
/** @type {import("next").NextConfig} */
const nextConfig = {};

module.exports = nextConfig;
```

Create `apps/web/.eslintrc.js`:

```js
module.exports = {
  extends: ["@project-management-tool/eslint-config/next"]
};
```

Create `apps/web/app/layout.tsx`:

```tsx
import "./globals.css";
import type { ReactNode } from "react";

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
```

Create `apps/web/app/page.tsx`:

```tsx
import React from "react";

export default function HomePage() {
  return (
    <main>
      <h1>Project Management Tool</h1>
      <p>Platform foundation is online.</p>
    </main>
  );
}
```

Create `apps/web/app/globals.css`:

```css
:root {
  color-scheme: light;
  font-family: ui-sans-serif, system-ui, sans-serif;
}

body {
  margin: 0;
  padding: 2rem;
}
```

Create `apps/web/lib/api.ts`:

```ts
export const apiBaseUrl =
  process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3001";
```

Create `apps/web/vitest.config.ts`:

```ts
import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    environment: "jsdom",
    globals: true,
    setupFiles: ["./vitest.setup.ts"]
  }
});
```

Create `apps/web/vitest.setup.ts`:

```ts
import "@testing-library/jest-dom/vitest";
```

- [ ] **Step 4: Run the web test to verify it passes**

Run:

```powershell
pnpm --filter web test
```

Expected: PASS with one passing `HomePage` test.

Note: if dependency installation is required to execute the test, allow `pnpm-lock.yaml` to update as part of the task.

- [ ] **Step 5: Commit**

Run:

```powershell
git add apps/web
git commit -m "feat: scaffold next web app"
```

## Task 4: Scaffold the NestJS API and Health Vertical Slice

**Files:**
- Create: `apps/api/package.json`
- Create: `apps/api/tsconfig.json`
- Create: `apps/api/tsconfig.build.json`
- Create: `apps/api/jest.config.ts`
- Create: `apps/api/nest-cli.json`
- Create: `apps/api/.eslintrc.js`
- Create: `apps/api/src/main.ts`
- Create: `apps/api/src/app.module.ts`
- Create: `apps/api/src/platform/config/env.ts`
- Create: `apps/api/src/platform/db/prisma.service.ts`
- Create: `apps/api/src/platform/db/prisma.module.ts`
- Create: `apps/api/src/platform/queue/queue.module.ts`
- Create: `apps/api/src/modules/health/health.controller.ts`
- Create: `apps/api/src/modules/health/health.service.ts`
- Create: `apps/api/src/modules/health/health.module.ts`
- Create: `apps/api/prisma/schema.prisma`
- Create: `apps/api/test/health.e2e-spec.ts`
- Modify: `pnpm-lock.yaml`

- [ ] **Step 1: Write the failing API health test**

Create `apps/api/test/health.e2e-spec.ts`:

```ts
import { Test } from "@nestjs/testing";
import { INestApplication } from "@nestjs/common";
import request from "supertest";
import { AppModule } from "../src/app.module";

describe("HealthController", () => {
  let app: INestApplication;

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [AppModule]
    }).compile();

    app = moduleRef.createNestApplication();
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  it("returns API health", async () => {
    const response = await request(app.getHttpServer())
      .get("/health")
      .expect(200);

    expect(response.body).toEqual({
      service: "api",
      status: "ok",
      timestamp: expect.any(String)
    });
  });
});
```

- [ ] **Step 2: Run the API test to verify it fails**

Run:

```powershell
pnpm --filter api test
```

Expected: FAIL because the NestJS app and its dependencies do not exist yet.

- [ ] **Step 3: Write the minimal API implementation**

Create `apps/api/package.json`:

```json
{
  "name": "api",
  "private": true,
  "scripts": {
    "dev": "nest start --watch",
    "build": "nest build",
    "start": "node dist/main.js",
    "lint": "eslint \"{src,test}/**/*.ts\"",
    "test": "jest --runInBand",
    "prisma:generate": "prisma generate",
    "postinstall": "prisma generate"
  },
  "dependencies": {
    "@nestjs/common": "^10.4.15",
    "@nestjs/core": "^10.4.15",
    "@nestjs/platform-express": "^10.4.15",
    "@prisma/client": "^6.0.1",
    "reflect-metadata": "^0.2.2",
    "rxjs": "^7.8.1",
    "@project-management-tool/types": "workspace:*"
  },
  "devDependencies": {
    "@nestjs/cli": "^10.4.8",
    "@nestjs/testing": "^10.4.15",
    "@project-management-tool/eslint-config": "workspace:*",
    "@project-management-tool/tsconfig": "workspace:*",
    "@types/jest": "^29.5.14",
    "@types/node": "^22.10.2",
    "@types/supertest": "^6.0.3",
    "eslint": "^9.16.0",
    "jest": "^29.7.0",
    "prisma": "^6.0.1",
    "supertest": "^7.0.0",
    "ts-jest": "^29.2.5",
    "ts-node": "^10.9.2",
    "typescript": "^5.7.2"
  }
}
```

Create `apps/api/tsconfig.json`:

```json
{
  "extends": "@project-management-tool/tsconfig/nestjs.json",
  "compilerOptions": {
    "baseUrl": "."
  },
  "include": ["src/**/*.ts", "test/**/*.ts"]
}
```

Create `apps/api/tsconfig.build.json`:

```json
{
  "extends": "./tsconfig.json",
  "compilerOptions": {
    "outDir": "./dist",
    "rootDir": "./src"
  },
  "exclude": ["node_modules", "test", "dist", "**/*spec.ts"]
}
```

Create `apps/api/jest.config.ts`:

```ts
import type { Config } from "jest";

const config: Config = {
  moduleFileExtensions: ["js", "json", "ts"],
  rootDir: ".",
  testRegex: ".*\\.e2e-spec\\.ts$",
  transform: {
    "^.+\\.(t|j)s$": "ts-jest"
  },
  testEnvironment: "node"
};

export default config;
```

Create `apps/api/nest-cli.json`:

```json
{
  "collection": "@nestjs/schematics",
  "sourceRoot": "src"
}
```

Create `apps/api/.eslintrc.js`:

```js
module.exports = {
  extends: ["@project-management-tool/eslint-config/nest"]
};
```

Create `apps/api/src/main.ts`:

```ts
import { NestFactory } from "@nestjs/core";
import { AppModule } from "./app.module";
import { apiEnv } from "./platform/config/env";

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  await app.listen(apiEnv.port);
}

void bootstrap();
```

Create `apps/api/src/app.module.ts`:

```ts
import { Module } from "@nestjs/common";
import { PrismaModule } from "./platform/db/prisma.module";
import { HealthModule } from "./modules/health/health.module";

@Module({
  imports: [PrismaModule, HealthModule]
})
export class AppModule {}
```

Create `apps/api/src/platform/config/env.ts`:

```ts
export const apiEnv = {
  databaseUrl: process.env.DATABASE_URL ?? "",
  port: Number(process.env.API_PORT ?? 3001)
};
```

Create `apps/api/src/platform/db/prisma.service.ts`:

```ts
import { Injectable, OnModuleInit } from "@nestjs/common";
import { PrismaClient } from "@prisma/client";
import { apiEnv } from "../config/env";

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit {
  async onModuleInit() {
    if (apiEnv.databaseUrl) {
      await this.$connect();
    }
  }
}
```

Create `apps/api/src/platform/db/prisma.module.ts`:

```ts
import { Global, Module } from "@nestjs/common";
import { PrismaService } from "./prisma.service";

@Global()
@Module({
  providers: [PrismaService],
  exports: [PrismaService]
})
export class PrismaModule {}
```

Create `apps/api/src/platform/queue/queue.module.ts`:

```ts
import { Global, Module } from "@nestjs/common";

@Global()
@Module({})
export class QueueModule {}
```

Create `apps/api/src/modules/health/health.service.ts`:

```ts
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
```

Create `apps/api/src/modules/health/health.controller.ts`:

```ts
import { Controller, Get } from "@nestjs/common";
import { HealthService } from "./health.service";

@Controller("health")
export class HealthController {
  constructor(private readonly healthService: HealthService) {}

  @Get()
  getHealth() {
    return this.healthService.getHealth();
  }
}
```

Create `apps/api/src/modules/health/health.module.ts`:

```ts
import { Module } from "@nestjs/common";
import { HealthController } from "./health.controller";
import { HealthService } from "./health.service";

@Module({
  controllers: [HealthController],
  providers: [HealthService]
})
export class HealthModule {}
```

Create `apps/api/prisma/schema.prisma`:

```prisma
generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}
```

- [ ] **Step 4: Run the API test to verify it passes**

Run:

```powershell
pnpm --filter api test
```

Expected: PASS with one passing `/health` e2e test.

Note: if dependency installation is required to execute the test, allow `pnpm-lock.yaml` to update as part of the task.

- [ ] **Step 5: Commit**

Run:

```powershell
git add apps/api
git commit -m "feat: scaffold nest api health slice"
```

## Task 5: Add the Worker and Redis Queue Skeleton

**Files:**
- Create: `apps/worker/package.json`
- Create: `apps/worker/tsconfig.json`
- Create: `apps/worker/.eslintrc.js`
- Create: `apps/worker/src/main.ts`
- Create: `apps/worker/src/env.ts`
- Create: `apps/worker/src/queues/health.queue.ts`
- Create: `apps/worker/src/queues/health.queue.test.ts`

- [ ] **Step 1: Write the failing worker test**

Create `apps/worker/src/queues/health.queue.test.ts`:

```ts
import { createHealthQueueName } from "./health.queue";

describe("createHealthQueueName", () => {
  it("returns the queue name used by the worker", () => {
    expect(createHealthQueueName()).toBe("health-checks");
  });
});
```

- [ ] **Step 2: Run the worker test to verify it fails**

Run:

```powershell
pnpm --filter worker test
```

Expected: FAIL because the worker workspace does not exist yet.

- [ ] **Step 3: Write the minimal worker implementation**

Create `apps/worker/package.json`:

```json
{
  "name": "worker",
  "private": true,
  "scripts": {
    "dev": "tsx watch src/main.ts",
    "build": "tsc -p tsconfig.json",
    "start": "node dist/main.js",
    "lint": "eslint \"src/**/*.ts\"",
    "test": "vitest run"
  },
  "dependencies": {
    "bullmq": "^5.34.0",
    "ioredis": "^5.4.2"
  },
  "devDependencies": {
    "@project-management-tool/eslint-config": "workspace:*",
    "@project-management-tool/tsconfig": "workspace:*",
    "@types/node": "^22.10.2",
    "eslint": "^9.16.0",
    "tsx": "^4.19.2",
    "typescript": "^5.7.2",
    "vitest": "^2.1.8"
  }
}
```

Create `apps/worker/tsconfig.json`:

```json
{
  "extends": "@project-management-tool/tsconfig/nestjs.json",
  "compilerOptions": {
    "outDir": "dist"
  },
  "include": ["src/**/*.ts"]
}
```

Create `apps/worker/.eslintrc.js`:

```js
module.exports = {
  extends: ["@project-management-tool/eslint-config/nest"]
};
```

Create `apps/worker/src/env.ts`:

```ts
export const workerEnv = {
  redisUrl: process.env.REDIS_URL ?? "redis://localhost:6379"
};
```

Create `apps/worker/src/queues/health.queue.ts`:

```ts
export const createHealthQueueName = () => "health-checks";
```

Create `apps/worker/src/main.ts`:

```ts
import { Worker } from "bullmq";
import IORedis from "ioredis";
import { workerEnv } from "./env";
import { createHealthQueueName } from "./queues/health.queue";

const connection = new IORedis(workerEnv.redisUrl, {
  maxRetriesPerRequest: null
});

const worker = new Worker(
  createHealthQueueName(),
  async (job) => {
    console.log("processed job", job.name);
  },
  { connection }
);

worker.on("failed", (job, error) => {
  console.error("job failed", job?.id, error);
});
```

- [ ] **Step 4: Run the worker test to verify it passes**

Run:

```powershell
pnpm --filter worker test
```

Expected: PASS with one passing worker queue test.

- [ ] **Step 5: Commit**

Run:

```powershell
git add apps/worker
git commit -m "feat: scaffold worker queue skeleton"
```

## Task 6: Add Local Infrastructure and End-to-End Runbook

**Files:**
- Create: `infra/docker/docker-compose.yml`
- Modify: `.env.example`
- Modify: `README.md`

- [ ] **Step 1: Write the failing infrastructure verification step**

Document the expected local services in `README.md`:

```md
## Local Services

- PostgreSQL on `localhost:5432`
- Redis on `localhost:6379`
- Web on `localhost:3000`
- API on `localhost:3001`
```

- [ ] **Step 2: Run Docker Compose before creating the file**

Run:

```powershell
docker compose -f infra/docker/docker-compose.yml up -d
```

Expected: FAIL because the compose file does not exist yet.

- [ ] **Step 3: Write the local infrastructure definition**

Create `infra/docker/docker-compose.yml`:

```yaml
services:
  postgres:
    image: postgres:16
    environment:
      POSTGRES_DB: project_management_tool
      POSTGRES_USER: postgres
      POSTGRES_PASSWORD: postgres
    ports:
      - "5432:5432"
    volumes:
      - postgres_data:/var/lib/postgresql/data

  redis:
    image: redis:7
    ports:
      - "6379:6379"

volumes:
  postgres_data:
```

Update `README.md`:

```md
# Project Management Tool

## Workspace Commands

- `pnpm install`
- `pnpm dev`
- `pnpm lint`
- `pnpm test`
- `pnpm build`

## Local Services

- PostgreSQL on `localhost:5432`
- Redis on `localhost:6379`
- Web on `localhost:3000`
- API on `localhost:3001`

## Boot Sequence

1. `docker compose -f infra/docker/docker-compose.yml up -d`
2. `pnpm install`
3. `pnpm dev`
```

- [ ] **Step 4: Run the infrastructure command to verify it succeeds**

Run:

```powershell
docker compose -f infra/docker/docker-compose.yml up -d
```

Expected: PASS with Postgres and Redis containers created or started.

- [ ] **Step 5: Commit**

Run:

```powershell
git add infra/docker/docker-compose.yml README.md
git commit -m "chore: add local docker infrastructure"
```

## Task 7: Install Dependencies and Verify the Foundation End to End

**Files:**
- Modify: `apps/web/package.json`
- Modify: `apps/api/package.json`
- Modify: `apps/worker/package.json`
- Modify: `README.md`

- [ ] **Step 1: Write the failing integration target**

Add this verification checklist to `README.md`:

```md
## Foundation Verification

- `pnpm lint`
- `pnpm test`
- `pnpm build`
- `GET /health` returns `200`
```

- [ ] **Step 2: Run dependency installation and verify unresolved-tool failure disappears**

Run:

```powershell
pnpm install
```

Expected: PASS with all workspace dependencies installed.

- [ ] **Step 3: Add any missing scripts or configs revealed by install and first runs**

If any workspace is missing a script or config after install, add the minimal missing files before continuing. The acceptable fixes in this step are limited to:

Create `apps/web/vitest.config.ts` if Vitest needs explicit jsdom configuration:

```ts
import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    environment: "jsdom"
  }
});
```

Create `apps/api/jest.config.ts` if Jest needs explicit TypeScript configuration:

```ts
import type { Config } from "jest";

const config: Config = {
  moduleFileExtensions: ["js", "json", "ts"],
  rootDir: ".",
  testRegex: ".*\\.e2e-spec\\.ts$",
  transform: {
    "^.+\\.(t|j)s$": "ts-jest"
  },
  testEnvironment: "node"
};

export default config;
```

- [ ] **Step 4: Run the full foundation verification**

Run:

```powershell
pnpm lint
pnpm test
pnpm build
```

Expected:

- `pnpm lint`: PASS
- `pnpm test`: PASS
- `pnpm build`: PASS

Then run:

```powershell
pnpm --filter api dev
```

In a second terminal:

```powershell
curl http://localhost:3001/health
```

Expected:

```json
{"service":"api","status":"ok","timestamp":"<iso-date>"}
```

- [ ] **Step 5: Commit**

Run:

```powershell
git add .
git commit -m "chore: verify monorepo foundation"
```

## Self-Review

### Spec Coverage

- Repository organization: covered by Tasks 1 through 3 and Task 5
- Technology stack selection: covered by Tasks 1 through 7
- Separate web, API, and worker deployables: covered by Tasks 3, 4, and 5
- Local infrastructure with Postgres and Redis: covered by Task 6
- Shared contracts and config packages: covered by Task 2
- Platform observability baseline: partially covered by API and worker logs in Tasks 4 and 5, with deeper observability intentionally deferred
- Authentication, domain modules, issues, comments, workflows, notifications, and search: intentionally deferred to follow-on implementation plans after the foundation is stable

### Placeholder Scan

- No `TBD`, `TODO`, or unresolved placeholders remain in this plan
- All tasks reference exact file paths
- All commands include expected results

### Type Consistency

- Shared health contract is defined in `packages/types/src/health.d.ts`
- API health endpoint returns the same `HealthResponse` type
- Worker queue naming stays isolated to the worker scaffold and does not conflict with API contracts
- Shared Nest/worker TypeScript consumers require `moduleResolution: "Node"` in the shared Nest tsconfig, so the Task 2 plan reflects that corrected baseline
- Nest build consumers must define app-local emit paths in their build tsconfig instead of inheriting `outDir` from the shared Nest preset, so the Task 2 and Task 4 plan entries reflect that corrected baseline
- Shared contracts are modeled as a declaration-only package, so Task 2 and Task 4 do not depend on cross-package source path mappings during Nest builds
- Shared Nest/worker ESLint consumers require TypeScript-aware parser and plugin settings in the shared base config, so the Task 2 plan reflects that corrected baseline
