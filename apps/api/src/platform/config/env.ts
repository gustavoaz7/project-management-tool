export const apiEnv = {
  databaseUrl: process.env.DATABASE_URL ?? "",
  port: Number(process.env.API_PORT ?? 3001)
};
