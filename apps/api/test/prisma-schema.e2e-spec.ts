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
});
