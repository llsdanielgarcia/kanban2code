---
stage: completed
agent: auditor
tags:
  - docs
  - medium
  - test
contexts: []
---

# Create Skill Guide: Testing Stack (Vitest & Playwright)

## Goal
Define the testing framework and conventions in a skill guide to ensure consistent test generation.

## Acceptance Criteria
- [x] Document Vitest configuration with the React plugin.
- [x] Detail Playwright E2E setup.
- [x] Define file naming conventions: `*.test.ts` (unit) and `tests/*.spec.ts` (E2E).
- [x] Provide mocking patterns for Supabase and Next.js headers/cookies.
- [x] Specify coverage configuration requirements.

## Notes
This guide resolves a high-priority blocker identified in the roadmap review.

# Skill Guide: Testing Stack (Vitest + Playwright) — Summary

## Key Rules

- Vitest: unit/component tests in `*.test.ts` / `*.test.tsx` (React uses TSX).
- Playwright: E2E tests in `tests/*.spec.ts`.
- Keep runners isolated: Vitest excludes `tests/**`; Playwright uses `testDir: "tests"`.
- Vitest config uses `@vitejs/plugin-react` + `jsdom` + `vite-tsconfig-paths`.
- Use `vitest.setup.ts` for `@testing-library/jest-dom/vitest` and shared mocks.
- Mock `next/headers` (`cookies()` / `headers()`) in unit tests when code depends on request scope.
- Prefer mocking your own Supabase wrapper module; avoid mocking Supabase internals unless required.
- Coverage must define provider + reporters + include/exclude + thresholds; run via `vitest run --coverage.enabled`.

## Canonical Skill

Full AI-skill version lives at:
`_context/skills/skill-vitest-playwright-testing.md`

## Audit
.kanban2code/_context/skills/skill-vitest-playwright-testing.md
.kanban2code/_context/skills-index.json
.kanban2code/inbox/skill-vitest-playwright-testing.md
