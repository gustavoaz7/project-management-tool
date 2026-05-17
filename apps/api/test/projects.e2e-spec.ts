import { INestApplication, ValidationPipe } from "@nestjs/common";
import { Test } from "@nestjs/testing";
import request from "supertest";
import { AppModule } from "../src/app.module";
import { PrismaService } from "../src/platform/db/prisma.service";

describe("ProjectsController", () => {
  let app: INestApplication;

  const prismaMock = {
    project: {
      findUnique: jest.fn()
    }
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

  it("returns a project with its team summary", async () => {
    prismaMock.project.findUnique.mockResolvedValue({
      id: "proj_123",
      organizationId: "org_123",
      teamId: "team_123",
      name: "Roadmap",
      key: "RDM",
      description: "Quarterly planning project.",
      createdAt: "2026-04-28T09:00:00.000Z",
      updatedAt: "2026-04-30T10:00:00.000Z",
      team: {
        id: "team_123",
        name: "Platform"
      }
    });

    const response = await request(app.getHttpServer()).get("/projects/proj_123").expect(200);

    expect(prismaMock.project.findUnique).toHaveBeenCalledWith({
      where: { id: "proj_123" },
      select: {
        id: true,
        organizationId: true,
        teamId: true,
        name: true,
        key: true,
        description: true,
        createdAt: true,
        updatedAt: true,
        team: {
          select: {
            id: true,
            name: true
          }
        }
      }
    });
    expect(response.body).toMatchObject({
      id: "proj_123",
      name: "Roadmap",
      key: "RDM",
      team: {
        id: "team_123",
        name: "Platform"
      }
    });
  });

  it("returns 404 when the project does not exist", async () => {
    prismaMock.project.findUnique.mockResolvedValue(null);

    const response = await request(app.getHttpServer()).get("/projects/missing-project").expect(404);

    expect(response.body.message).toBe("Project missing-project was not found.");
  });
});
