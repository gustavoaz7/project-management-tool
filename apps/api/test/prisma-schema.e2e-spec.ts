import { readFileSync } from "node:fs";
import { join } from "node:path";

describe("Prisma schema", () => {
  it("scopes the optional project team relation to the same organization", () => {
    const schemaPath = join(__dirname, "..", "prisma", "schema.prisma");
    const schema = readFileSync(schemaPath, "utf8");

    expect(schema).toContain("@@unique([id, organizationId])");
    expect(schema).toContain(
      "team           Team?        @relation(fields: [teamId, organizationId], references: [id, organizationId], onDelete: Restrict)"
    );
  });

  it("models issue comments and activity as issue-owned records", () => {
    const schemaPath = join(__dirname, "..", "prisma", "schema.prisma");
    const schema = readFileSync(schemaPath, "utf8");

    expect(schema).toContain("comments    IssueComment[]");
    expect(schema).toContain("activity    ActivityEvent[]");
    expect(schema).toContain("model IssueComment {");
    expect(schema).toContain("authorName String");
    expect(schema).toContain("model ActivityEvent {");
    expect(schema).toContain("type       ActivityEventType");
    expect(schema).toContain('COMMENT_ADDED');
  });
});
