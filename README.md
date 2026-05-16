# Project Management Tool

## Requirements

- Node.js `20.x`
- pnpm `10.x`

## Workspace Commands

- `pnpm install`
- `pnpm dev`
- `pnpm lint`
- `pnpm typecheck`
- `pnpm test`
- `pnpm build`

## Local Services

- PostgreSQL on `localhost:5432`
- Redis on `localhost:6379`
- Web on `localhost:3000`
- API on `localhost:3001`

## Boot Sequence

1. `docker compose -f infra/docker/docker-compose.yml up -d`
2. `pnpm install`
3. `pnpm dev`

## Verification

- `pnpm lint`
- `pnpm typecheck`
- `pnpm test`
- `pnpm build`
- `GET /health` returns `200`

## CI

- Pull requests run `lint`, `typecheck`, `test`, and `build` as separate jobs in GitHub Actions.
- Direct pushes to `main` should be blocked with branch protection so CI passes before merge.
