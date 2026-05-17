import { INestApplication, ValidationPipe } from "@nestjs/common";
import { Test } from "@nestjs/testing";
import request from "supertest";
import { AppModule } from "../src/app.module";
import { PrismaService } from "../src/platform/db/prisma.service";

describe("BootstrapController", () => {
  let app: INestApplication;

  const prismaMock = {
    $transaction: jest.fn()
  };

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [AppModule]
    })
      .overrideProvider(PrismaService)
      .useValue(prismaMock)
      .compile();

    app = moduleRef.createNestApplication();
    app.useGlobalPipes(
      new ValidationPipe({
        transform: true,
        whitelist: true
      })
    );
    await app.init();
  });

  beforeEach(() => {
    jest.clearAllMocks();
  });

  afterAll(async () => {
    await app.close();
  });

  it("bootstraps an organization, team, and project", async () => {
    prismaMock.$transaction.mockImplementation(async (callback) =>
      callback({
        organization: {
          create: jest.fn().mockResolvedValue({
            id: "org_123",
            name: "Acme Inc."
          })
        },
        team: {
          create: jest.fn().mockResolvedValue({
            id: "team_123",
            name: "Platform",
            organizationId: "org_123"
          })
        },
        project: {
          create: jest.fn().mockResolvedValue({
            id: "proj_123",
            name: "Roadmap",
            key: "RDM",
            organizationId: "org_123",
            teamId: "team_123"
          })
        }
      })
    );

    const response = await request(app.getHttpServer())
      .post("/bootstrap/workspace")
      .set("Content-Type", "application/json")
      .send(
        JSON.stringify({
          organizationName: "  Acme Inc.  ",
          teamName: "  Platform  ",
          projectName: "  Roadmap  ",
          projectKey: "  rdm  "
        })
      )
      .expect(201);

    expect(prismaMock.$transaction).toHaveBeenCalledTimes(1);
    expect(response.body).toEqual({
      organization: {
        id: "org_123",
        name: "Acme Inc."
      },
      team: {
        id: "team_123",
        name: "Platform",
        organizationId: "org_123"
      },
      project: {
        id: "proj_123",
        name: "Roadmap",
        key: "RDM",
        organizationId: "org_123",
        teamId: "team_123"
      }
    });
  });

  it("rejects a blank project key", async () => {
    await request(app.getHttpServer())
      .post("/bootstrap/workspace")
      .set("Content-Type", "application/json")
      .send(
        JSON.stringify({
          organizationName: "Acme Inc.",
          teamName: "Platform",
          projectName: "Roadmap",
          projectKey: "   "
        })
      )
      .expect(400);

    expect(prismaMock.$transaction).not.toHaveBeenCalled();
  });
});
