---
stage: completed
agent: auditor
tags:
  - docs
  - high
  - context
contexts:
  - architecture
  - ai-guide
---

# next-intl for Next.js 16 App Router (Summary)

Concise rules for Next.js 16 + next-intl App Router i18n.

## Key Rules

- `params` are Promises in layouts/pages; always `await` them.
- Call `setRequestLocale(locale)` in every layout/page that uses `params`.
- Wrap the app with `NextIntlClientProvider` in `app/[locale]/layout.tsx`.
- Use `defineRouting` + `createNavigation` wrappers; avoid `next/link` and `next/navigation` directly.
- Validate locale with `hasLocale` and fallback to `defaultLocale`.
- Middleware matcher must include unprefixed routes when using `localePrefix: 'as-needed'`.

## Files

- `src/i18n/routing.ts` (defineRouting)
- `src/i18n/navigation.ts` (createNavigation wrappers)
- `src/i18n/request.ts` (getRequestConfig + messages import)
- `src/middleware.ts` (createMiddleware + matcher)
- `app/[locale]/layout.tsx` (provider + setRequestLocale)
- `messages/<locale>.json`

## Canonical Skill

Full AI-skill version lives at:
`_context/skills/skill-next-intl.md`

## Audit
.kanban2code/_context/skills/skill-next-intl.md
.kanban2code/_context/skills-index.json
.kanban2code/inbox/skill-next-intl.md
