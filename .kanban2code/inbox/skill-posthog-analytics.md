---
stage: completed
agent: auditor
tags:
  - docs
  - low
  - context
contexts: []
---

# Create Skill Guide: PostHog Analytics

## Goal
Document PostHog integration patterns to ensure clear separation between client and server tracking.

## Acceptance Criteria
- [x] Document client-side provider initialization.
- [x] Detail server-side tracking setup using `posthog-node`.
- [x] Provide patterns for page view auto-tracking.
- [x] Define standard custom event structures for core workflows.

## Notes
The guide must emphasize the separation of environments to avoid runtime errors.

# PostHog Analytics (Next.js App Router) — Summary

## Key Rules

- Keep client and server tracking totally separate:
  - Client: `posthog-js` + `@posthog/react` in `'use client'` only.
  - Server: `posthog-node` in server-only modules only.
- Enforce separation with `import 'server-only'` (and optionally `import 'client-only'`).
- Server tracking must run in Node runtime (not Edge); set `export const runtime = 'nodejs'` when needed.
- Choose one pageview strategy:
  - preferred: modern defaults-based SPA auto-tracking
  - fallback: manual `$pageview` + `$pageleave` with `sendBeacon`
- Always flush server events in short-lived runtimes (`flushAt: 1`, `flushInterval: 0`, `shutdown()`).
- Standardize event naming (`[object] [verb]`) and always include core properties like `source: 'client'|'server'`.

## Canonical Skill

Full AI-skill version lives at:
`_context/skills/skill-posthog-analytics.md`

## Audit
.kanban2code/_context/skills/skill-posthog-analytics.md
.kanban2code/_context/skills-index.json
.kanban2code/inbox/skill-posthog-analytics.md

# PostHog Analytics Skill Guide (Next.js App Router)

Goal: integrate PostHog in a Next.js **App Router** codebase while keeping **client tracking** and **server tracking** totally separate (so you don’t hit “window is not defined”, Edge runtime issues, or accidental bundling of server code into the client).

---

## 0) The non-negotiable rule: split client vs server

**Client tracking (browser)**

* Uses **`posthog-js`** + **`@posthog/react`**
* Must live in **Client Components** (`'use client'`) because it needs browser APIs. PostHog’s Next.js docs explicitly call this out for App Router. ([PostHog][1])

**Server tracking (Node.js runtime)**

* Uses **`posthog-node`**
* Must live in **server-only** modules and execute in a **Node.js runtime** (not Edge). PostHog’s Node SDK docs note Node.js 20+ and the SDK batching/flush behavior. ([PostHog][2])

**Enforce it (highly recommended):**

* In server analytics modules: `import 'server-only'` to cause a build-time error if someone imports it into a Client Component. ([Next.js][3])
* (Optional) In client analytics modules: `import 'client-only'` for the reverse protection. ([Next.js][3])

---

## 1) Environment variables

**Client (safe to expose):**

```bash
NEXT_PUBLIC_POSTHOG_KEY=phc_...
NEXT_PUBLIC_POSTHOG_HOST=https://us.i.posthog.com
```

PostHog’s Next.js docs use these exact names and emphasize the `NEXT_PUBLIC_` prefix for client availability. ([PostHog][1])

**Server (recommended to keep distinct names for clarity):**

```bash
POSTHOG_SERVER_KEY=phc_...         # can be the same project key, just not NEXT_PUBLIC_
POSTHOG_SERVER_HOST=https://us.i.posthog.com
```

Why bother with separate names if the key is the same? Because it reduces “environment poisoning” mistakes (importing the wrong module, or relying on an env var that becomes empty in the client bundle). Next.js explicitly warns about this class of problem and recommends `server-only` to prevent it. ([Next.js][3])

---

## 2) Client-side setup (App Router): Provider initialization

### Install

```bash
pnpm add posthog-js @posthog/react
# or npm/yarn/bun
```

(Aligned with PostHog’s Next.js + SPA guidance.) ([PostHog][1])

### `app/providers.tsx`

This is the standard App Router pattern: a Client Component that initializes PostHog and provides context. ([PostHog][1])

```tsx
// app/providers.tsx
'use client'

import { useEffect } from 'react'
import posthog from 'posthog-js'
import { PostHogProvider as PHProvider } from '@posthog/react'

export function PostHogProvider({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    posthog.init(process.env.NEXT_PUBLIC_POSTHOG_KEY!, {
      api_host: process.env.NEXT_PUBLIC_POSTHOG_HOST,
      // ✅ Recommended modern defaults (includes SPA navigation handling)
      defaults: '2025-11-30',
    })
  }, [])

  return <PHProvider client={posthog}>{children}</PHProvider>
}
```

### Wrap `app/layout.tsx`

```tsx
// app/layout.tsx
import './globals.css'
import { PostHogProvider } from './providers'

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <PostHogProvider>{children}</PostHogProvider>
      </body>
    </html>
  )
}
```

Good news: wrapping your app in a PostHog provider **does not force everything to become client-rendered**—Next.js creates a boundary between server and client code. ([PostHog][1])

---

## 3) Page view tracking patterns (App Router)

You’ve got two legit options. Pick one and standardize it.

### Pattern A (recommended): “just work” auto-tracking for SPA navigation

PostHog recommends using updated defaults like `defaults: '2025-11-30'` (or `capture_pageview: 'history_change'`) to capture SPA navigation via the browser History API. ([PostHog][4])

**What you do:**

* Keep `defaults: '2025-11-30'` in `posthog.init(...)`.
* Do **not** manually fire `$pageview` events unless you have a specific reason.

This automatically handles both `$pageview` and `$pageleave` in modern setups. ([PostHog][1])

---

### Pattern B (fallback / legacy): manual pageview + pageleave in a Client Component

PostHog notes manual capture via `useEffect` used to be recommended, but now the defaults-based approach is preferred. Still, if you *must* do manual, make sure you also capture `$pageleave`. ([PostHog][1])

**1) Disable auto pageviews**

```tsx
posthog.init(process.env.NEXT_PUBLIC_POSTHOG_KEY!, {
  api_host: process.env.NEXT_PUBLIC_POSTHOG_HOST,
  capture_pageview: false,
})
```

(Also note: initializing outside `useEffect` with a `window` check can trigger hydration/mismatch warnings—PostHog calls this out.) ([PostHog][1])

**2) Add a `PostHogPageView` component**

```tsx
// app/PostHogPageView.tsx
'use client'

import { usePathname, useSearchParams } from 'next/navigation'
import { useEffect } from 'react'
import { usePostHog } from '@posthog/react'

export function PostHogPageView() {
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const posthog = usePostHog()

  useEffect(() => {
    if (!posthog || !pathname) return

    const qs = searchParams?.toString()
    const url = window.location.origin + pathname + (qs ? `?${qs}` : '')

    posthog.capture('$pageview', { $current_url: url })
  }, [pathname, searchParams, posthog])

  return null
}
```

**3) Also capture `$pageleave` reliably**

```tsx
// app/PostHogPageLeave.tsx
'use client'

import { useEffect } from 'react'
import posthog from 'posthog-js'

export function PostHogPageLeave() {
  useEffect(() => {
    const handlePageLeave = () => {
      posthog.capture('$pageleave', null, { transport: 'sendBeacon' })
    }

    const event = 'onpagehide' in window ? 'pagehide' : 'unload'
    window.addEventListener(event, handlePageLeave)
    return () => window.removeEventListener(event, handlePageLeave)
  }, [])

  return null
}
```

This matches PostHog’s guidance to use `sendBeacon` and `pagehide/unload` for better reliability. ([PostHog][1])

---

## 4) Server-side setup (App Router): `posthog-node`

### Install

```bash
pnpm add posthog-node
```

([PostHog][1])

### Create a server-only helper

Use a factory function (works well in serverless/short-lived Next.js executions) and flush immediately.

PostHog’s Next.js docs recommend `flushAt: 1`, `flushInterval: 0`, and calling `await client.shutdown()` when done because server functions can be short-lived. ([PostHog][1])

```ts
// lib/posthog-server.ts
import 'server-only'
import { PostHog } from 'posthog-node'

export function PostHogServer() {
  return new PostHog(process.env.POSTHOG_SERVER_KEY!, {
    host: process.env.POSTHOG_SERVER_HOST!,
    flushAt: 1,
    flushInterval: 0,
  })
}
```

### Use it in a Route Handler

```ts
// app/api/projects/route.ts
import { NextResponse } from 'next/server'
import { PostHogServer } from '@/lib/posthog-server'

export const runtime = 'nodejs' // ensure Node runtime if your project uses Edge in places

export async function POST(req: Request) {
  const posthog = PostHogServer()

  try {
    const { projectId } = await req.json()
    const userId = 'user_123' // get from your auth/session

    posthog.capture({
      distinctId: userId,
      event: 'project created',
      properties: {
        project_id: projectId,
        source: 'server',
      },
    })
  } finally {
    await posthog.shutdown()
  }

  return NextResponse.json({ ok: true })
}
```

**Why the `runtime` line?** Next.js supports Node.js vs Edge runtimes; Edge has a smaller subset of Node APIs and npm package support. If a route runs at the Edge, `posthog-node` may break. ([Next.js][5])

### Use it in a Server Action

```ts
// app/actions/createProject.ts
'use server'

import { PostHogServer } from '@/lib/posthog-server'

export async function createProjectAction() {
  const posthog = PostHogServer()

  try {
    const userId = 'user_123'
    const projectId = 'proj_abc'

    posthog.capture({
      distinctId: userId,
      event: 'project created',
      properties: { project_id: projectId, source: 'server' },
    })
  } finally {
    await posthog.shutdown()
  }
}
```

### Setting person properties on the server

In `posthog-node`, you can attach `$set` and `$set_once` in event properties to update person profiles. ([PostHog][2])

```ts
posthog.capture({
  distinctId: userId,
  event: 'user signed up',
  properties: {
    signup_method: 'email',
    $set: { email, name },
    $set_once: { signup_at: new Date().toISOString() },
    source: 'server',
  },
})
```

### Alias (optional, but useful)

If you need to link multiple distinct IDs to a single user, PostHog supports `alias`. ([PostHog][2])

---

## 5) Standard custom event structures (core workflows)

### Naming convention

Use PostHog’s recommended **`[object] [verb]`** naming style (lowercase, space-separated): e.g. `project created`, `user signed up`, `invite sent`. ([PostHog][2])

### Common properties (include on *every* custom event)

These make your data consistent across client + server:

* `source`: `'client' | 'server'` (so you can audit duplication and trust level)
* `app`: `'web'`
* `router`: `'app'`
* `env`: e.g. `'development' | 'preview' | 'production'`
* `request_id` / `trace_id`: if you have it (server-side)
* Domain IDs: `user_id`, `org_id`, `project_id`, etc (depending on the event)

### Core workflow event specs

Here’s a solid starter pack (edit names/props to match your domain):

| Event name               | Canonical source | Required properties     | Optional properties                         |
| ------------------------ | ---------------: | ----------------------- | ------------------------------------------- |
| `user signed up`         |           server | `signup_method`         | `plan`, `invite_token`, `$set`, `$set_once` |
| `user logged in`         |           server | `login_method`          | `mfa_enabled`                               |
| `user logged out`        |           client | *(none)*                | `reason`                                    |
| `onboarding started`     |           client | `variant`               | `referrer`                                  |
| `onboarding completed`   |           server | `duration_ms`           | `steps_completed`                           |
| `project created`        |           server | `project_id`            | `template`, `team_size`                     |
| `invite sent`            |           server | `invitee_role`          | `invitee_email_domain`                      |
| `checkout started`       |           client | `plan`                  | `billing_cycle`                             |
| `subscription purchased` |           server | `plan`, `billing_cycle` | `amount`, `currency`, `provider`            |
| `payment failed`         |           server | `provider`              | `error_code`                                |

### Type-safe event definitions (optional but great in TS)

Create one shared schema and two environment-specific wrappers.

**`lib/analytics/events.ts` (shared)**

```ts
export type AnalyticsEvent =
  | { event: 'user signed up'; properties: { signup_method: 'email' | 'oauth'; plan?: string } }
  | { event: 'user logged in'; properties: { login_method: 'email' | 'oauth' } }
  | { event: 'project created'; properties: { project_id: string; template?: string } }
  | { event: 'invite sent'; properties: { invitee_role: string } }
  | { event: 'subscription purchased'; properties: { plan: string; billing_cycle: 'monthly' | 'annual' } }
```

**`lib/analytics/client.ts`**

```ts
'use client'
import 'client-only'
import { usePostHog } from '@posthog/react'
import type { AnalyticsEvent } from './events'

export function useAnalytics() {
  const posthog = usePostHog()

  return {
    capture: (e: AnalyticsEvent) => {
      posthog?.capture(e.event, {
        ...e.properties,
        source: 'client',
        app: 'web',
        router: 'app',
      })
    },
  }
}
```

**`lib/analytics/server.ts`**

```ts
import 'server-only'
import type { AnalyticsEvent } from './events'
import { PostHogServer } from '@/lib/posthog-server'

export async function captureServerEvent(distinctId: string, e: AnalyticsEvent) {
  const posthog = PostHogServer()
  try {
    posthog.capture({
      distinctId,
      event: e.event,
      properties: {
        ...e.properties,
        source: 'server',
        app: 'web',
        router: 'app',
      },
    })
  } finally {
    await posthog.shutdown()
  }
}
```

---

## 6) Autocapture vs custom events (how to avoid noise)

PostHog can autocapture pageviews/pageleaves and common DOM interactions by default. If you want a “cleaner” dataset, disable or filter autocapture and rely on your custom workflow events. ([PostHog][6])

---

## 7) Quick checklist (matches your acceptance criteria)

* ✅ Client provider initialized in App Router (`app/providers.tsx` + `app/layout.tsx`). ([PostHog][1])
* ✅ Server tracking uses `posthog-node` with `flushAt: 1`, `flushInterval: 0`, and `shutdown()` to flush. ([PostHog][1])
* ✅ Pageviews: use `defaults: '2025-11-30'` (recommended) or manual `$pageview` + `$pageleave` fallback. ([PostHog][4])
* ✅ Standard custom event naming + properties defined (use `[object] [verb]`). ([PostHog][2])
* ✅ Separation enforced with `server-only` / `client-only`. ([Next.js][3])
* ✅ If needed, force Node runtime for server tracking (`export const runtime = 'nodejs'`). ([Next.js][5])

---

If you tell me what your “core workflows” are (auth provider, billing provider like Stripe, key entities like “workspace/project/document”, etc.), I can tailor the event list + required properties so the team has a plug-and-play spec.

[1]: https://posthog.com/docs/libraries/next-js "Next.js - Docs - PostHog"
[2]: https://posthog.com/docs/libraries/node "Node.js - Docs - PostHog"
[3]: https://nextjs.org/docs/app/getting-started/server-and-client-components "Getting Started: Server and Client Components | Next.js"
[4]: https://posthog.com/tutorials/single-page-app-pageviews "Tracking pageviews in single-page apps (SPA) - PostHog"
[5]: https://nextjs.org/docs/13/app/building-your-application/rendering/edge-and-nodejs-runtimes "Rendering: Edge and Node.js Runtimes | Next.js"
[6]: https://posthog.com/docs/product-analytics/capture-events "Capturing events - Docs - PostHog"

---

## Review

**Rating: 9/10**

**Verdict: ACCEPTED**

### Summary
The skill guide is complete, well-structured, and covers all acceptance criteria with clear client/server separation patterns and practical code examples.

### Findings

#### Blockers
*(none)*

#### High Priority
*(none)*

#### Medium Priority
*(none)*

#### Low Priority / Nits
- [ ] Inbox file contains more detail than canonical skill (type-safe wrappers, event table) — intentional per conventions

### Test Assessment
- Coverage: Adequate (documentation task)
- Missing tests: N/A

### What's Good
- Clear client/server separation with `server-only`/`client-only` enforcement
- Modern defaults-based pageview tracking preferred over manual
- Server flush pattern correctly emphasizes `shutdown()` for serverless
- Standard event naming convention with required properties
- Comprehensive type-safe wrapper examples

### Recommendations
- Consider promoting type-safe event wrapper pattern to canonical skill in future iteration
