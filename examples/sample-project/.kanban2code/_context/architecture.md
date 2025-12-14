---
name: Architecture
description: Sample architecture context for the example project
scope: global
---

# Architecture (Sample Project)

## Overview

This sample project is intentionally small: it exists to demonstrate the Kanban2Code workflow (tasks + stages + context files + config).

## Tech Stack

- TypeScript
- Node.js
- Vitest

## Repo Structure (Example)

```
src/
  api/
  ui/
tests/
.kanban2code/
  inbox/
  projects/
  phase-1-example/
  _context/
  config.json
```

## Conventions

- Tasks are markdown files with YAML frontmatter and a `# Title` heading.
- Keep tasks small and measurable; include explicit acceptance criteria.
- Use `contexts:` to reference stable design/architecture docs when prompting an AI agent.

## Decisions

- Prefer simple modules with clear input/output contracts.
- Add tests for new parsing/validation logic.

