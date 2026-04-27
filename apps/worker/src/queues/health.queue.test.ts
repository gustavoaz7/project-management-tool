import { describe, expect, it } from "vitest";
import { createHealthQueueName } from "./health.queue";

describe("createHealthQueueName", () => {
  it("returns the queue name used by the worker", () => {
    expect(createHealthQueueName()).toBe("health-checks");
  });
});
