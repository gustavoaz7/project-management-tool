# Project Management Tool

## Workspace Commands

- `pnpm install`
- `pnpm dev`
- `pnpm lint`
- `pnpm test`
- `pnpm build`
- `pnpm format`

## Local Services

- PostgreSQL on `localhost:5432`
- Redis on `localhost:6379`
- Web on `localhost:3000`
- API on `localhost:3001`

## Boot Sequence

1. `docker compose -f infra/docker/docker-compose.yml up -d`
2. `pnpm install`
3. `pnpm dev`
