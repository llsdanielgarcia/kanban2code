---
stage: audit
agent: auditor
tags:
  - docs
  - high
  - security
contexts:
  - architecture
  - ai-guide
---

# Create Skill Guide: HTTP Security Headers

## Goal
Author a security hardening guide for HTTP headers in Next.js.

## Acceptance Criteria
- [x] Define a robust `Content-Security-Policy` (CSP) baseline pattern.
- [x] Document configurations for `X-Frame-Options`, `X-Content-Type-Options`, and `Referrer-Policy`.
- [x] Detail `Permissions-Policy` setup.
- [x] Provide the implementation pattern for `next.config.ts` using the `headers()` function.

## Context
Critical post-incident hardening documentation.

# Next.js HTTP security headers — Summary

## Key Rules

- Prefer CSP `frame-ancestors` for clickjacking prevention; keep `X-Frame-Options` for legacy defense.
- Don’t ship `unsafe-eval`/`unsafe-inline` in production.
- Nonce-based CSP requires a per-request nonce (not a static `next.config.ts` string).
- `next.config.*` `headers()` works only when you have a server runtime; static export must set headers at the host/CDN.

## Baseline Headers (Defaults)

- `X-Content-Type-Options: nosniff`
- `Referrer-Policy: strict-origin-when-cross-origin`
- `Permissions-Policy: camera=(), microphone=(), geolocation=(), payment=(), usb=(), browsing-topics=()`
- `X-Frame-Options: DENY` (or `SAMEORIGIN` if needed)
- `Content-Security-Policy: ...` (either static baseline or nonce-based)

## Canonical Skill

Full AI-skill version lives at:
`_context/skills/skill-http-security-headers.md`

## Audit
.kanban2code/_context/skills/skill-http-security-headers.md
.kanban2code/_context/skills-index.json
.kanban2code/inbox/skill-http-security-headers.md
