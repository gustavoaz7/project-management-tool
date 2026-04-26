# Project Management Tool Design

## Goal

Build a production-realistic internal-workflow issue tracking platform that maximizes breadth of learning across backend, data, infrastructure, deployment, and operations, while keeping frontend complexity secondary.

The product starts as a single-company platform with many teams and projects. The architecture should be organization-aware from day one so it can evolve into a true multi-tenant SaaS later without a major redesign.

## Product Scope

### In Scope for the First Serious Version

- Authentication and session management
- One organization in practice, with organization-aware domain modeling
- Teams and projects
- Project-scoped issue tracking
- Comments
- Labels
- Workflow states and issue transitions
- Activity feed
- Asynchronous notifications
- Basic issue filtering and search
- Deployment pipeline, logging, and operational visibility

### Explicitly Out of Scope for V1

- Billing
- Marketplace or plugin ecosystem
- Advanced automation rules
- Attachments-heavy document features
- Global realtime collaboration
- Microservices
- Full tenant self-service provisioning
- Public API platform

## Product Direction

The recommended product is a B2B internal-workflow issue tracker in the category of Linear, Jira, or Asana-style software, but intentionally narrower in feature scope.

This direction was chosen because it provides a strong learning surface across:

- Domain modeling
- Authentication and authorization
- Relational schema design
- Background jobs
- Search and filtering
- Deployment and observability
- Event and activity modeling
- Future tenant isolation

## Architecture Overview

The recommended architecture is a modular monolith backend with separate web, API, and worker deployables.

```text
                +------------------+
                |   Next.js Web    |
                +------------------+
                          |
                          v
                +------------------+
                |   API Backend    |
                +------------------+
                   |      |      |
                   |      |      |
                   v      v      v
              +------+ +------+ +------+
              | PG   | |Redis | |Logs  |
              +------+ +------+ +------+
                          |
                          v
                +------------------+
                | Background Worker|
                +------------------+
```

### Architectural Principles

- Start with a modular monolith, not microservices
- Keep business modules explicit and bounded
- Use PostgreSQL as the source of truth
- Use Redis-backed background jobs for side effects
- Keep core business writes ACID within the database transaction boundary
- Treat notifications and other side effects as eventually consistent
- Add observability from the beginning
- Make the data model organization-aware from day one

## Domain Model

The system should include an `organization` entity from the start, even though phase 1 operates as a single-company system in practice.

### Core Entities

- Organization
- User
- Organization membership
- Team
- Team membership
- Project
- Project membership
- Workflow state
- Issue
- Comment
- Label
- Activity event
- Notification

### Relationship Shape

```text
Organization
  -> Teams
  -> Users
  -> Projects
  -> Roles / Memberships

Project
  -> Issues
  -> Labels
  -> Workflow states
  -> Activity events

Issue
  -> Comments
  -> Assignee
  -> Reporter
  -> Status
  -> Priority
  -> Due dates
  -> History
```

### Initial Table Set

- organizations
- users
- organization_memberships
- teams
- team_memberships
- projects
- project_memberships
- workflow_states
- issues
- issue_comments
- labels
- issue_labels
- activity_events
- notifications

### Modeling Decisions

- All major operational tables should carry `organization_id`
- Memberships should be explicit join tables
- Workflow states should belong to a project or team scope, not be globally shared
- Activity events should be append-only
- Notifications should be derived from committed events rather than acting as the primary record of business activity

## Module Boundaries

The codebase should be organized by business capability first, with optional internal layering inside each module.

Recommended shape:

```text
src/
  modules/
    identity/
    organizations/
    teams/
    projects/
    issues/
    comments/
    workflows/
    activity/
    notifications/
    search/
  platform/
    db/
    cache/
    queue/
    auth/
    observability/
    config/
  app/
    http/
    jobs/
```

This is preferred over a single global `controllers/ services/ repositories/ utils/` structure because domain-first organization keeps feature behavior, rules, and persistence closer together and avoids turning global `services` and `utils` directories into catch-all folders.

Each module may still use local layering internally, for example:

```text
modules/issues/
  issue.controller.ts
  issue.service.ts
  issue.repository.ts
  issue.policies.ts
  issue.events.ts
```

### Ownership Expectations

- HTTP handlers should delegate to explicit use cases
- Modules should own their business rules
- Cross-module collaboration should happen through explicit interfaces or events
- Shared platform code should remain infrastructural, not business-domain oriented

## Authentication and Authorization

Authentication and authorization must be treated as separate concerns.

```text
Authentication = who are you?
Authorization = what are you allowed to do?
```

### Recommended Authentication Shape

- Session-based authentication for the web app
- Email/password initially, with optional external identity provider later
- API tokens only after the core product is stable

### Recommended Authorization Shape

- Backend-enforced RBAC
- Organization-aware access context
- Team and project membership checks
- Per-action policy evaluation

### Initial Roles

Organization roles:

- org_admin
- member

Project roles:

- project_admin
- contributor
- viewer

### Policy Design

Authorization rules should not be scattered as inline role checks throughout handlers.

Prefer explicit domain policies such as:

```text
issues.canEditIssue(user, issue, membership)
issues.canTransitionIssue(user, issue, membership, workflow)
projects.canManageProject(user, membership)
```

### Request Pattern

```text
HTTP request
  -> authenticate session
  -> load resource context
  -> evaluate policy
  -> execute use case
  -> write audit or activity event
```

## Data Consistency Model

The design uses ACID transactions for core business writes and eventual consistency for side effects.

### ACID Boundary

Operations such as the following should happen in a single PostgreSQL transaction:

- Update issue state
- Insert activity event
- Insert outbox or job record

```text
API request
  -> begin transaction
  -> update issue
  -> insert activity_event
  -> insert outbox_job
  -> commit
```

This gives atomicity, consistency, isolation, and durability for the authoritative business state.

### Eventual Consistency Boundary

The following should happen outside the synchronous request transaction:

- Send notifications
- Update search index
- Fan out websocket updates later
- Push analytics or audit stream downstream

The system is therefore ACID for core data changes within Postgres, but not globally ACID across asynchronous workers and external effects.

## Request and Data Flow

The design splits work into synchronous and asynchronous paths.

### Synchronous Path

- Validate input
- Load resource context
- Check permissions
- Enforce business rules
- Persist core state changes
- Append activity event

### Asynchronous Path

- Send notifications
- Perform later search indexing
- Publish later realtime events
- Run analytics or derived processing

### Typical Write Flow

```text
Client
  -> API handler
  -> use case
  -> DB transaction
      - update issue
      - insert activity_event
      - insert outbox/job record
  -> commit
  -> return response
Worker
  -> reads queued job
  -> sends notifications
  -> retries on transient failure
```

### Failure Handling Principles

- Request-time failures should be explicit and predictable
- Background jobs should be retryable
- Job handlers should be idempotent where practical
- Activity history should reflect only successful committed changes
- Logs should include correlation identifiers for tracing requests across async boundaries

### Concurrency

Use optimistic locking on key mutable records such as issues to teach realistic conflict handling without introducing unnecessary distributed complexity.

## Data Storage and Query Design

### Primary Storage

- PostgreSQL as the system of record
- Redis for queueing and selected caching
- Object storage only when attachments or exports require it

### Data Design Principles

- Normalize operational data
- Use foreign keys aggressively
- Add timestamps to all key tables
- Use soft delete only where product behavior truly requires recoverability
- Keep activity and audit streams append-only
- Add indexes around actual query patterns

### Likely Early Indexes

- issues(project_id, status, updated_at)
- issues(assignee_id, status)
- issues(reporter_id)
- activity_events(issue_id, created_at)
- project_memberships(project_id, user_id)
- team_memberships(team_id, user_id)

### Read and Write Philosophy

- Writes should be authoritative, transactional, and rule-heavy
- Reads may use query shapes optimized for UI use cases
- Dedicated read queries per screen are acceptable and preferred over forcing all access through generic repository abstractions

## Repository Organization

The project should use a Turborepo-based monorepo.

### Recommended Layout

```text
project-management-tool/
  apps/
    web/                -> Next.js frontend
    api/                -> NestJS backend API
    worker/             -> background jobs and async processing
  packages/
    types/              -> shared contracts and DTOs
    config/             -> shared config helpers
    eslint-config/      -> shared linting rules
    tsconfig/           -> shared TypeScript base configs
    ui/                 -> optional shared UI package
  infra/
    docker/
    terraform/          -> later, when deployment matures
  docs/
    superpowers/specs/
  scripts/
  turbo.json
  package.json
  pnpm-workspace.yaml
```

### Repository Principles

- Keep web, API, and worker as separate deployable applications
- Share contracts and tooling, not backend implementation internals
- Treat `packages/ui` as optional rather than mandatory
- Avoid creating large catch-all shared packages
- Preserve explicit ownership boundaries between applications

This monorepo approach is preferred because it keeps the whole system easy to evolve together while still preserving realistic deployable boundaries.

## Technology Stack

### Recommended Stack

- Frontend: Next.js
- API backend: NestJS
- Language: TypeScript
- Database: PostgreSQL
- ORM and migrations: Prisma
- Queue: Redis plus BullMQ
- Local infrastructure: Docker Compose
- Deployed infrastructure: managed Postgres, managed Redis, container-based app deployment

### Rationale

This stack is recommended because it is production-realistic, widely transferable, and exposes the right concepts without requiring excessive setup or premature complexity.

NestJS is the selected API framework for this project because it provides strong modular structure, explicit architectural conventions, and a good fit for the modular monolith shape. It supports the learning goal of understanding a production-style backend organized around modules, controllers, services, validation, and dependency boundaries.

## Runtime Topology

The intended deployed shape is:

```text
[web app]
[api app]
[worker app]
   |
   +--> postgres
   +--> redis
   +--> logs/metrics/traces
```

This enables:

- Independent runtime concerns for UI, API, and workers
- Learning background execution and retry semantics
- Easier future scaling and deployment separation
- Clear operational boundaries without moving to microservices

## Environments and Delivery

### Required Environments

- local
- dev
- staging
- production

### What Each Environment Teaches

Local:

- Docker Compose setup
- seed data
- fast developer iteration

Dev:

- shared integration testing
- feature validation

Staging:

- production-like configuration
- deployment verification
- migration rehearsal

Production:

- monitoring
- backups
- rollback discipline

### Deployment Progression

Stage 1:

- local Docker Compose with web, API, worker, Postgres, and Redis

Stage 2:

- deploy web and API to a managed container platform
- use managed Postgres and Redis
- add CI/CD for build, test, and deploy

Stage 3:

- add staging and production separation
- add safer migration workflow
- add error tracking and basic metrics

## Path to Multi-Tenancy

The project should not implement true tenant isolation in V1, but it should be designed to support it later.

### Day-One Preparations

- Include `organization_id` on major domain tables
- Scope authorization and queries through organization, team, and project membership
- Carry organization context in the authenticated request model

### Evolution Path

Phase 1:

- one organization in practice
- organization-aware schema and permissions

Phase 2:

- multiple organizations in one shared database
- logical tenant isolation enforced in the application layer

Phase 3:

- tenant-aware provisioning
- tenant-scoped settings
- tenant admin capabilities

Phase 4:

- optional stronger physical isolation
- separate schemas or databases for selected tenants if needed

This phased approach preserves learning value while avoiding premature overengineering.

## Recommended First Milestone

The first real implementation milestone should include:

- authentication and session handling
- organization bootstrap
- teams
- projects
- issue CRUD
- workflow-based issue status transitions
- comments
- activity feed
- async notifications
- basic filtering and search
- deployment pipeline
- structured logging and baseline metrics

## Final Recommendation

Build an internal-workflow issue tracker as a modular monolith with separate web, API, and worker deployables, PostgreSQL as the system of record, Redis-backed background jobs for side effects, backend-enforced RBAC, and an organization-aware schema that prepares the system for future multi-tenant SaaS evolution.

This project is well aligned with the learning goal of broadening from frontend expertise into backend architecture, systems design, infrastructure, deployment, and operational thinking with production realism.
