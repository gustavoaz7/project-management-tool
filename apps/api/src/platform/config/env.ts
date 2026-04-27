export const apiEnv = {
  databaseUrl: process.env.DATABASE_URL ?? "",
  redisUrl: process.env.REDIS_URL ?? "redis://localhost:6379",
  port: Number(process.env.API_PORT ?? 3001)
};
