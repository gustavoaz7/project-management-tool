import { INestApplication, ValidationPipe } from "@nestjs/common";
import { Test } from "@nestjs/testing";
import request from "supertest";
import { AppModule } from "../src/app.module";
import { PrismaService } from "../src/platform/db/prisma.service";

describe("IssuesController", () => {
  let app: INestApplication;

  const prismaMock = {
    $transaction: jest.fn(),
    project: {
      findUnique: jest.fn()
    },
    issue: {
      create: jest.fn(),
      findMany: jest.fn(),
      findFirst: jest.fn(),
      update: jest.fn()
    },
    issueComment: {
      create: jest.fn(),
      findMany: jest.fn()
    },
    activityEvent: {
      create: jest.fn(),
      findMany: jest.fn()
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
    prismaMock.$transaction.mockImplementation(async (callback: (tx: typeof prismaMock) => unknown) =>
      callback(prismaMock)
    );
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
    prismaMock.activityEvent.create.mockResolvedValue({
      id: "event_123",
      issueId: "issue_123",
      type: "ISSUE_CREATED",
      actorName: null,
      summary: "Issue created.",
      createdAt: "2026-04-28T09:00:00.000Z"
    });

    const response = await request(app.getHttpServer())
      .post("/projects/proj_123/issues")
      .set("Content-Type", "application/json")
      .send(
        JSON.stringify({
          title: "  Ship issue creation  ",
          description: "  Add the first project issue endpoint.  ",
          priority: "HIGH"
        })
      )
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
    expect(prismaMock.$transaction).toHaveBeenCalled();
    expect(prismaMock.activityEvent.create).toHaveBeenCalledWith({
      data: {
        issueId: "issue_123",
        type: "ISSUE_CREATED",
        actorName: null,
        summary: "Issue created."
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
      .set("Content-Type", "application/json")
      .send(
        JSON.stringify({
          title: "Missing project issue"
        })
      )
      .expect(404);

    expect(response.body.message).toBe("Project missing-project was not found.");
    expect(prismaMock.issue.create).not.toHaveBeenCalled();
  });

  it("returns 400 for a whitespace-only title", async () => {
    await request(app.getHttpServer())
      .post("/projects/proj_123/issues")
      .set("Content-Type", "application/json")
      .send(
        JSON.stringify({
          title: "   "
        })
      )
      .expect(400);

    expect(prismaMock.project.findUnique).not.toHaveBeenCalled();
    expect(prismaMock.issue.create).not.toHaveBeenCalled();
  });

  it("lists issues for an existing project ordered by most recent update", async () => {
    prismaMock.project.findUnique.mockResolvedValue({ id: "proj_123" });
    prismaMock.issue.findMany.mockResolvedValue([
      {
        id: "issue_2",
        projectId: "proj_123",
        title: "Newest issue",
        description: null,
        status: "IN_PROGRESS",
        priority: "HIGH",
        createdAt: "2026-04-29T09:00:00.000Z",
        updatedAt: "2026-04-30T10:00:00.000Z"
      },
      {
        id: "issue_1",
        projectId: "proj_123",
        title: "Older issue",
        description: "Already there.",
        status: "BACKLOG",
        priority: "MEDIUM",
        createdAt: "2026-04-28T09:00:00.000Z",
        updatedAt: "2026-04-29T10:00:00.000Z"
      }
    ]);

    const response = await request(app.getHttpServer())
      .get("/projects/proj_123/issues")
      .expect(200);

    expect(prismaMock.project.findUnique).toHaveBeenCalledWith({
      where: { id: "proj_123" },
      select: { id: true }
    });
    expect(prismaMock.issue.findMany).toHaveBeenCalledWith({
      where: { projectId: "proj_123" },
      orderBy: [{ updatedAt: "desc" }, { createdAt: "desc" }]
    });
    expect(response.body).toHaveLength(2);
    expect(response.body[0]).toMatchObject({
      id: "issue_2",
      title: "Newest issue"
    });
  });

  it("filters issues by status and priority when query params are provided", async () => {
    prismaMock.project.findUnique.mockResolvedValue({ id: "proj_123" });
    prismaMock.issue.findMany.mockResolvedValue([
      {
        id: "issue_2",
        projectId: "proj_123",
        title: "Newest issue",
        description: null,
        status: "IN_PROGRESS",
        priority: "HIGH",
        createdAt: "2026-04-29T09:00:00.000Z",
        updatedAt: "2026-04-30T10:00:00.000Z"
      }
    ]);

    const response = await request(app.getHttpServer())
      .get("/projects/proj_123/issues?status=IN_PROGRESS&priority=HIGH")
      .expect(200);

    expect(prismaMock.issue.findMany).toHaveBeenCalledWith({
      where: {
        projectId: "proj_123",
        status: "IN_PROGRESS",
        priority: "HIGH"
      },
      orderBy: [{ updatedAt: "desc" }, { createdAt: "desc" }]
    });
    expect(response.body).toHaveLength(1);
    expect(response.body[0]).toMatchObject({
      id: "issue_2",
      status: "IN_PROGRESS",
      priority: "HIGH"
    });
  });

  it("rejects an invalid issue list status filter", async () => {
    await request(app.getHttpServer())
      .get("/projects/proj_123/issues?status=NOT_A_STATUS")
      .expect(400);

    expect(prismaMock.project.findUnique).not.toHaveBeenCalled();
    expect(prismaMock.issue.findMany).not.toHaveBeenCalled();
  });

  it("returns issue details scoped to the project", async () => {
    prismaMock.issue.findFirst.mockResolvedValue({
      id: "issue_123",
      projectId: "proj_123",
      title: "Ship issue detail endpoint",
      description: "Expose a focused issue read path.",
      status: "TODO",
      priority: "HIGH",
      createdAt: "2026-04-28T09:00:00.000Z",
      updatedAt: "2026-04-30T10:00:00.000Z"
    });

    const response = await request(app.getHttpServer())
      .get("/projects/proj_123/issues/issue_123")
      .expect(200);

    expect(prismaMock.issue.findFirst).toHaveBeenCalledWith({
      where: {
        id: "issue_123",
        projectId: "proj_123"
      }
    });
    expect(response.body).toMatchObject({
      id: "issue_123",
      projectId: "proj_123",
      title: "Ship issue detail endpoint",
      status: "TODO",
      priority: "HIGH"
    });
  });

  it("returns 404 when the issue does not exist in the project", async () => {
    prismaMock.issue.findFirst.mockResolvedValue(null);

    const response = await request(app.getHttpServer())
      .get("/projects/proj_123/issues/missing-issue")
      .expect(404);

    expect(response.body.message).toBe("Issue missing-issue was not found in project proj_123.");
  });

  it("updates an issue when the requested transition is allowed", async () => {
    prismaMock.issue.findFirst.mockResolvedValue({
      id: "issue_123",
      projectId: "proj_123",
      title: "Ship issue detail endpoint",
      description: "Expose a focused issue read path.",
      status: "TODO",
      priority: "MEDIUM",
      createdAt: "2026-04-28T09:00:00.000Z",
      updatedAt: "2026-04-30T10:00:00.000Z"
    });
    prismaMock.issue.update.mockResolvedValue({
      id: "issue_123",
      projectId: "proj_123",
      title: "Ship editable issue endpoint",
      description: "Expose a focused issue read path.",
      status: "IN_PROGRESS",
      priority: "HIGH",
      createdAt: "2026-04-28T09:00:00.000Z",
      updatedAt: "2026-05-01T10:00:00.000Z"
    });
    prismaMock.activityEvent.create.mockResolvedValue({
      id: "event_789",
      issueId: "issue_123",
      type: "ISSUE_UPDATED",
      actorName: null,
      summary: "Issue updated.",
      createdAt: "2026-05-01T10:00:00.000Z"
    });

    const response = await request(app.getHttpServer())
      .patch("/projects/proj_123/issues/issue_123")
      .set("Content-Type", "application/json")
      .send(
        JSON.stringify({
          title: "  Ship editable issue endpoint  ",
          status: "IN_PROGRESS",
          priority: "HIGH"
        })
      )
      .expect(200);

    expect(prismaMock.issue.findFirst).toHaveBeenCalledWith({
      where: {
        id: "issue_123",
        projectId: "proj_123"
      }
    });
    expect(prismaMock.issue.update).toHaveBeenCalledWith({
      where: {
        id: "issue_123"
      },
      data: {
        title: "Ship editable issue endpoint",
        status: "IN_PROGRESS",
        priority: "HIGH"
      }
    });
    expect(prismaMock.$transaction).toHaveBeenCalled();
    expect(prismaMock.activityEvent.create).toHaveBeenCalledWith({
      data: {
        issueId: "issue_123",
        type: "ISSUE_UPDATED",
        actorName: null,
        summary: "Issue updated."
      }
    });
    expect(response.body).toMatchObject({
      id: "issue_123",
      title: "Ship editable issue endpoint",
      status: "IN_PROGRESS",
      priority: "HIGH"
    });
  });

  it("rejects an invalid status transition", async () => {
    prismaMock.issue.findFirst.mockResolvedValue({
      id: "issue_123",
      projectId: "proj_123",
      title: "Ship editable issue endpoint",
      description: null,
      status: "BACKLOG",
      priority: "MEDIUM",
      createdAt: "2026-04-28T09:00:00.000Z",
      updatedAt: "2026-04-30T10:00:00.000Z"
    });

    const response = await request(app.getHttpServer())
      .patch("/projects/proj_123/issues/issue_123")
      .set("Content-Type", "application/json")
      .send(
        JSON.stringify({
          status: "DONE"
        })
      )
      .expect(400);

    expect(response.body.message).toBe("Issue issue_123 cannot transition from BACKLOG to DONE.");
    expect(prismaMock.issue.update).not.toHaveBeenCalled();
  });

  it("adds a comment to an issue and appends an activity event", async () => {
    prismaMock.issue.findFirst.mockResolvedValue({
      id: "issue_123",
      projectId: "proj_123",
      title: "Ship editable issue endpoint",
      description: null,
      status: "IN_PROGRESS",
      priority: "HIGH",
      createdAt: "2026-04-28T09:00:00.000Z",
      updatedAt: "2026-04-30T10:00:00.000Z"
    });
    prismaMock.issueComment.create.mockResolvedValue({
      id: "comment_123",
      issueId: "issue_123",
      authorName: "Gustavo",
      body: "Let's track the discussion on the issue.",
      createdAt: "2026-05-02T10:00:00.000Z",
      updatedAt: "2026-05-02T10:00:00.000Z"
    });
    prismaMock.activityEvent.create.mockResolvedValue({
      id: "event_456",
      issueId: "issue_123",
      type: "COMMENT_ADDED",
      actorName: "Gustavo",
      summary: "Comment added by Gustavo.",
      createdAt: "2026-05-02T10:00:00.000Z"
    });

    const response = await request(app.getHttpServer())
      .post("/projects/proj_123/issues/issue_123/comments")
      .set("Content-Type", "application/json")
      .send(
        JSON.stringify({
          authorName: "  Gustavo  ",
          body: "  Let's track the discussion on the issue.  "
        })
      )
      .expect(201);

    expect(prismaMock.issueComment.create).toHaveBeenCalledWith({
      data: {
        issueId: "issue_123",
        authorName: "Gustavo",
        body: "Let's track the discussion on the issue."
      }
    });
    expect(prismaMock.$transaction).toHaveBeenCalled();
    expect(prismaMock.activityEvent.create).toHaveBeenCalledWith({
      data: {
        issueId: "issue_123",
        type: "COMMENT_ADDED",
        actorName: "Gustavo",
        summary: "Comment added by Gustavo."
      }
    });
    expect(response.body).toMatchObject({
      id: "comment_123",
      issueId: "issue_123",
      authorName: "Gustavo",
      body: "Let's track the discussion on the issue."
    });
  });

  it("lists issue comments in chronological order", async () => {
    prismaMock.issue.findFirst.mockResolvedValue({
      id: "issue_123",
      projectId: "proj_123",
      title: "Ship editable issue endpoint",
      description: null,
      status: "IN_PROGRESS",
      priority: "HIGH",
      createdAt: "2026-04-28T09:00:00.000Z",
      updatedAt: "2026-04-30T10:00:00.000Z"
    });
    prismaMock.issueComment.findMany.mockResolvedValue([
      {
        id: "comment_123",
        issueId: "issue_123",
        authorName: "Gustavo",
        body: "First comment.",
        createdAt: "2026-05-02T10:00:00.000Z",
        updatedAt: "2026-05-02T10:00:00.000Z"
      },
      {
        id: "comment_456",
        issueId: "issue_123",
        authorName: "Ana",
        body: "Second comment.",
        createdAt: "2026-05-03T11:00:00.000Z",
        updatedAt: "2026-05-03T11:00:00.000Z"
      }
    ]);

    const response = await request(app.getHttpServer())
      .get("/projects/proj_123/issues/issue_123/comments")
      .expect(200);

    expect(prismaMock.issueComment.findMany).toHaveBeenCalledWith({
      where: { issueId: "issue_123" },
      orderBy: [{ createdAt: "asc" }, { id: "asc" }]
    });
    expect(response.body).toHaveLength(2);
    expect(response.body[0]).toMatchObject({
      id: "comment_123",
      authorName: "Gustavo"
    });
    expect(response.body[1]).toMatchObject({
      id: "comment_456",
      authorName: "Ana"
    });
  });

  it("lists issue activity in chronological order", async () => {
    prismaMock.issue.findFirst.mockResolvedValue({
      id: "issue_123",
      projectId: "proj_123",
      title: "Ship editable issue endpoint",
      description: null,
      status: "IN_PROGRESS",
      priority: "HIGH",
      createdAt: "2026-04-28T09:00:00.000Z",
      updatedAt: "2026-04-30T10:00:00.000Z"
    });
    prismaMock.activityEvent.findMany.mockResolvedValue([
      {
        id: "event_123",
        issueId: "issue_123",
        type: "ISSUE_CREATED",
        actorName: null,
        summary: "Issue created.",
        createdAt: "2026-04-28T09:00:00.000Z"
      },
      {
        id: "event_456",
        issueId: "issue_123",
        type: "COMMENT_ADDED",
        actorName: "Gustavo",
        summary: "Comment added by Gustavo.",
        createdAt: "2026-05-02T10:00:00.000Z"
      }
    ]);

    const response = await request(app.getHttpServer())
      .get("/projects/proj_123/issues/issue_123/activity")
      .expect(200);

    expect(prismaMock.activityEvent.findMany).toHaveBeenCalledWith({
      where: { issueId: "issue_123" },
      orderBy: [{ createdAt: "asc" }, { id: "asc" }]
    });
    expect(response.body).toHaveLength(2);
    expect(response.body[0]).toMatchObject({
      id: "event_123",
      type: "ISSUE_CREATED"
    });
    expect(response.body[1]).toMatchObject({
      id: "event_456",
      type: "COMMENT_ADDED",
      actorName: "Gustavo"
    });
  });
});
