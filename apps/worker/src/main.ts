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
