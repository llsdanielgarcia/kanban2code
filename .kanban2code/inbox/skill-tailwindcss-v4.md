---
stage: completed
agent: auditor
tags:
  - docs
  - medium
  - context
contexts: []
---

# Create Skill Guide: Tailwind CSS v4

## Goal
Author a guide for Tailwind v4 to prevent agents from generating obsolete `tailwind.config.js` files.

## Acceptance Criteria
- [x] Document the removal of `tailwind.config.js` in favor of `@theme` in CSS.
- [x] Define PostCSS configuration via `@tailwindcss/postcss`.
- [x] Specify the use of CSS custom properties for design tokens.
- [x] Provide integration patterns for `tw-animate-css`.

## Notes
The guide must emphasize that Tailwind v4 is CSS-first.

# Tailwind CSS v4 — Summary

Concise rules to keep Tailwind v4 CSS-first and avoid generating `tailwind.config.js` by default.

## Key Rules

- Entry CSS uses `@import "tailwindcss";` (don’t output v3 `@tailwind base/components/utilities`).
- Tokens go in `@theme { ... }` as CSS custom properties (use `:root` only for non-Tailwind vars).
- PostCSS plugin is `@tailwindcss/postcss` (configure via `postcss.config.*`).
- Content scanning is automatic; add extra sources via `@source` instead of a JS `content: []` config.
- Only use JS config when explicitly required; load it via `@config`.
- `tw-animate-css` is CSS-first: import it in CSS and use utilities via static classnames.

## Canonical Skill

Full AI-skill version lives at:
`_context/skills/skill-tailwindcss-v4.md`

## Audit
.kanban2code/_context/skills/skill-tailwindcss-v4.md
.kanban2code/_context/skills-index.json
.kanban2code/inbox/skill-tailwindcss-v4.md
