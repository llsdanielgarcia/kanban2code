---
stage: audit
agent: auditor
tags:
  - docs
  - medium
  - context
contexts: []
---

# Create Skill Guide: Database ORM (Drizzle)

## Goal
Create a Drizzle ORM skill guide to prevent agents from mixing in Prisma or TypeORM patterns.

## Acceptance Criteria
- [ ] Document schema definition using `$type<>()` for type overrides.
- [ ] Define PostgreSQL driver configuration with connection pooling.
- [ ] Specify migration script patterns: `db:push` (dev) and `db:generate` (prod).
- [ ] Detail index definitions within the table callback.
- [ ] Provide patterns for JSONB column handling.

## Notes
Ensure the guide is strictly Drizzle-specific.

# Skill Guide: Database ORM (Drizzle) — Summary

Concise rules for PostgreSQL + Drizzle ORM. No Prisma or TypeORM patterns.

## Key Rules

- Schema is TypeScript `pgTable` + column builders.
- Indexes and constraints are defined in the `pgTable` callback.
- Use `jsonb(...).$type<T>()` for compile-time typing only (no runtime validation).
- Use a single shared `pg.Pool` and pass it to `drizzle({ client: pool })`.
- Dev uses `db:push`. Prod uses `db:generate` + `db:migrate`.
- Advanced indexes (GIN/where/using) may need custom SQL migrations.

## Canonical Skill

Full AI-skill version lives at:
`_context/skills/skill-drizzle-orm.md`

## Audit
.kanban2code/_context/skills/skill-drizzle-orm.md
.kanban2code/_context/skills-index.json
.kanban2code/inbox/skill-drizzle-orm.md
