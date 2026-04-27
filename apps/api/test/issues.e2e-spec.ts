import { INestApplication, ValidationPipe } from "@nestjs/common";
import { Test } from "@nestjs/testing";
import request from "supertest";
import { AppModule } from "../src/app.module";
import { PrismaService } from "../src/platform/db/prisma.service";

describe("IssuesController", () => {
  let app: INestApplication;

  const prismaMock = {
    project: {
      findUnique: jest.fn()
    },
    issue: {
      create: jest.fn()
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

  it("creates an issue for an existing project", async () => {
    prismaMock.project.findUnique.mockResolvedValue({ id: "proj_123" });
    prismaMock.issue.create.mockResolvedValue({
      id: "issue_123",
      projectId: "proj_123",
      title: "Ship issue creation",
      description: "Add the first project issue endpoint.",
      status: "BACKLOG",
      priority: "HIGH",
      createdAt: "2026-04-28T09:00:00.000Z",
      updatedAt: "2026-04-28T09:00:00.000Z"
    });

    const response = await request(app.getHttpServer())
      .post("/projects/proj_123/issues")
      .send({
        title: "  Ship issue creation  ",
        description: "  Add the first project issue endpoint.  ",
        priority: "HIGH"
      })
      .expect(201);

    expect(prismaMock.project.findUnique).toHaveBeenCalledWith({
      where: { id: "proj_123" },
      select: { id: true }
    });
    expect(prismaMock.issue.create).toHaveBeenCalledWith({
      data: {
        projectId: "proj_123",
        title: "Ship issue creation",
        description: "Add the first project issue endpoint.",
        priority: "HIGH"
      }
    });
    expect(response.body).toMatchObject({
      id: "issue_123",
      projectId: "proj_123",
      title: "Ship issue creation",
      status: "BACKLOG",
      priority: "HIGH"
    });
  });

  it("returns 404 when the project does not exist", async () => {
    prismaMock.project.findUnique.mockResolvedValue(null);

    const response = await request(app.getHttpServer())
      .post("/projects/missing-project/issues")
      .send({
        title: "Missing project issue"
      })
      .expect(404);

    expect(response.body.message).toBe("Project missing-project was not found.");
    expect(prismaMock.issue.create).not.toHaveBeenCalled();
  });

  it("returns 400 for an empty title", async () => {
    await request(app.getHttpServer())
      .post("/projects/proj_123/issues")
      .send({
        title: ""
      })
      .expect(400);

    expect(prismaMock.project.findUnique).not.toHaveBeenCalled();
    expect(prismaMock.issue.create).not.toHaveBeenCalled();
  });
});
