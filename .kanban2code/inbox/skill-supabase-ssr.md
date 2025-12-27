---
stage: audit
agent: auditor
tags:
  - docs
  - high
  - security
contexts: []
---

# Create Skill Guide: Supabase Authentication (SSR)

## Goal
Author a security-focused skill guide for `@supabase/ssr` to prevent the use of deprecated auth helpers.

## Acceptance Criteria
- [x] Explicitly forbid `@supabase/auth-helpers-nextjs`.
- [x] Document the distinction between `createBrowserClient` and `createServerClient`.
- [x] Provide the pattern for cookie handling in Server Components (catching `setAll` errors).
- [x] Define the session refresh logic required for `proxy.ts`.
- [x] Explain the coordination between RLS policies and Drizzle schema definitions.

## Security Note
This is a critical post-incident hardening document. It must ensure all server-side client initializations strictly follow the latest SSR documentation to prevent session leakage.

# Supabase Authentication (SSR) — Summary

## Key Rules

- Forbidden: `@supabase/auth-helpers-nextjs` (don’t install/import; don’t mix with `@supabase/ssr`).
- Use two clients: `createBrowserClient` (Client Components) vs `createServerClient` (server-only).
- Server client must be per-request (no module singleton).
- In Server Components, `cookies.setAll()` can throw; wrap in try/catch.
- `proxy.ts` is required to refresh sessions and keep cookies consistent per request; update both request and response cookies.
- Never rely on `getSession()` for server-side protection; use `getUser()` for high-trust checks.
- RLS + schema must evolve together: policies often depend on `auth.uid()` and columns like `user_id`/`tenant_id`.

## Canonical Skill

Full AI-skill version lives at:
`_context/skills/skill-supabase-ssr.md`

## Audit
.kanban2code/_context/skills/skill-supabase-ssr.md
.kanban2code/_context/skills-index.json
.kanban2code/inbox/skill-supabase-ssr.md

---

## Non‑negotiables

### 1) `@supabase/auth-helpers-nextjs` is forbidden

Do not install it, do not import it, do not keep it around “just in case”.

* Supabase has consolidated the deprecated auth-helpers packages into `@supabase/ssr`. ([GitHub][1])
* Supabase docs also warn you **must not** use both `auth-helpers-nextjs` and `@supabase/ssr` in the same app because it can cause auth issues. ([Supabase][2])

**Required action**

```bash
npm uninstall @supabase/auth-helpers-nextjs
npm install @supabase/supabase-js @supabase/ssr
```

(If you’re migrating, follow the same uninstall/install intent even if your package manager differs.) ([Supabase][2])

---

## Why SSR auth needs special handling

With SSR, the server must be able to read the user session. That means **tokens must be stored in cookies**, not just local storage. Supabase’s SSR tooling uses **PKCE by default** and is configured to store/retrieve session data via cookies. ([Supabase][3])

**Key constraint:** Next.js Server Components can’t reliably write cookies, so you must run a **Proxy** step early in the request lifecycle to refresh tokens and keep cookies consistent. ([Supabase][4])

---

## The two Supabase clients you must use

Supabase SSR expects **two separate client creators**:

* **`createBrowserClient`** → Client Components (runs in the browser)
* **`createServerClient`** → Server Components, Server Actions, Route Handlers (runs on the server and requires cookie plumbing)

Supabase explicitly documents this split. ([Supabase][5])

### 1) Client Component client (`createBrowserClient`)

**File:** `lib/supabase/client.ts`

```ts
import { createBrowserClient } from '@supabase/ssr';

export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!
  );
}
```

This matches Supabase’s recommended pattern for the browser client. ([Supabase][2])

### 2) Server Component client (`createServerClient`) + Server Component cookie safety

**File:** `lib/supabase/server.ts`

This is the critical Server Components pattern: implement `cookies.getAll()` and `cookies.setAll()` and **catch `setAll` errors** (because Server Components may throw when attempting to set cookies). Supabase explicitly recommends this try/catch approach and notes it can be ignored if you have a Proxy refreshing sessions. ([Supabase][2])

```ts
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';

export function createClient() {
  const cookieStore = cookies();

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) => {
              cookieStore.set(name, value, options);
            });
          } catch {
            // Called from a Server Component where cookies can't be set.
            // Safe to ignore IF your Proxy is refreshing sessions.
          }
        },
      },
    }
  );
}
```

([Supabase][2])

**Hard rule:** never create a server client as a module-level singleton. Always build it per-request via a function like above. (Otherwise you risk “sticky” cookie state bleeding across requests.)

---

## Proxy session refresh logic (`proxy.ts`) — required

### What Next.js expects

Next.js now uses a **`proxy.ts` / `proxy.js`** convention (middleware renamed). The file must export a single `proxy` function (or default export), and you can scope it with `config.matcher`. ([Next.js][6])

### What Supabase expects the Proxy to do

Supabase’s SSR guidance for the Proxy is:

* Refresh expired tokens by calling an auth method in the Proxy (Supabase docs describe using `getClaims()` for this flow). ([Supabase][4])
* Write refreshed cookies into:

  * `request.cookies` (so downstream Server Components don’t try to refresh again)
  * `response.cookies` (so the browser replaces old tokens) ([Supabase][4])

### Root Proxy file

**File:** `proxy.ts` (project root)

```ts
import type { NextRequest } from 'next/server';
import { updateSession } from '@/lib/supabase/proxy';

export async function proxy(request: NextRequest) {
  return updateSession(request);
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
};
```

This matches the Proxy shape Next.js expects and the matcher approach Supabase shows in its SSR migration guidance. ([Next.js][6])

### Supabase session updater

**File:** `lib/supabase/proxy.ts`

Below is the **cookie-safe** update pattern:

* `cookies.getAll()` reads from the incoming request
* `cookies.setAll()` updates *both*:

  * `request.cookies` (important for SSR continuity)
  * `supabaseResponse.cookies` (important so browser gets the new cookies)

Supabase also warns: if you create a new `NextResponse`, you must copy cookies over, otherwise the browser/server go out of sync and sessions break. ([Supabase][2])

```ts
import { createServerClient } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';

export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          // Make cookies visible to the rest of this request (Server Components, etc.)
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));

          // Re-create response and attach cookies for the browser
          supabaseResponse = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) => {
            supabaseResponse.cookies.set(name, value, options);
          });
        },
      },
    }
  );

  // IMPORTANT: call your auth check immediately after createServerClient.
  // Supabase warns that logic inserted in-between can cause hard-to-debug auth issues.
  // (Docs show this warning with getUser; the same principle applies to the method you use.)
  // :contentReference[oaicite:14]{index=14}

  // Preferred by current SSR client guidance for Proxy flow:
  const { data } = await supabase.auth.getClaims(); // refresh + validate JWT signature/exp
  // Alternatively (stricter server validation): await supabase.auth.getUser()

  return supabaseResponse;
}
```

#### `getClaims()` vs `getUser()` for hardening

Supabase guidance spans both approaches:

* Proxy flow described as using `getClaims()` for refresh/validation. ([Supabase][4])
* Other Supabase Next.js material emphasizes `getUser()` is safer than `getSession()` because it revalidates with the Auth server. ([Supabase][7])
* Supabase also notes `getClaims()` is local JWT validation and **does not** confirm server-side logout/revocation; `getUser()` is the stronger check when you truly need that guarantee. ([Supabase][3])

**Practical rule for post-incident hardening**

* Use `getClaims()` in the Proxy for fast “is this JWT genuine + unexpired?” gating.
* Use `getUser()` for sensitive, high-trust server actions where you must confirm the session is still valid server-side.

### Never use `getSession()` for server-side protection

Supabase explicitly warns against trusting `supabase.auth.getSession()` in server code like the Proxy because it isn’t guaranteed to revalidate the token, and cookies can be spoofed. ([Supabase][7])

---

## Using the clients correctly in your app

### Client Component (browser)

```tsx
'use client';

import { createClient } from '@/lib/supabase/client';

export function SignOutButton() {
  const supabase = createClient();

  return (
    <button
      onClick={async () => {
        await supabase.auth.signOut();
      }}
    >
      Sign out
    </button>
  );
}
```

### Server Component / Server Action / Route Handler (server)

```ts
import { createClient } from '@/lib/supabase/server';

export default async function Page() {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser(); // or getClaims(), depending on need
  // ...
}
```

---

## RLS + Drizzle coordination (don’t treat them as separate worlds)

This is where “auth hardening” often fails: your **app types** can look correct while your **database security** is wrong (or vice versa).

### 1) RLS is the enforcement layer, always

Supabase is explicit:

* RLS must be enabled on tables in exposed schemas (typically `public`). ([Supabase][8])
* With RLS enabled and no policies, access becomes “default deny.” ([Supabase][8])
* Policies commonly use `auth.uid()` to bind rows to the authenticated user. ([Supabase][8])

**Implication for Drizzle:** your Drizzle schema must include the columns your RLS policies rely on (usually `user_id` / `owner_id`), with correct types and constraints.

### 2) Your Drizzle schema should mirror RLS-critical columns and constraints

Supabase recommends creating user-facing profile tables in `public`, referencing `auth.users`, enabling RLS, and using `on delete cascade`. ([Supabase][9])

**Important constraint:** Supabase warns to only reference **primary keys** on Supabase-managed tables like `auth.users`, because other objects can change. ([Supabase][9])

So in Drizzle, model this explicitly (example table shape):

* `id` (uuid) primary key
* `id` references `auth.users(id)` (via SQL migration or Drizzle migration SQL)
* RLS enabled + policies created in migrations

### 3) Keep RLS + schema changes in the same migration “unit”

If you add a new table (or a new “tenant_id/user_id” column) without adding/updating policies immediately, you’ve created a security gap.

Drizzle supports managing RLS concepts (policies/roles) and notes it works with Supabase, including linking policies to existing provider tables. ([Drizzle ORM][10])

**Recommended practice**

* In the same PR that adds/changes a table in Drizzle:

  * add/adjust RLS policies
  * add/adjust indexes needed by policy predicates (`user_id`, `tenant_id`)
  * add/adjust foreign keys referencing `auth.users(id)` where applicable ([Supabase][9])

### 4) Make sure your runtime query path actually supplies an authenticated context

Supabase notes that when unauthenticated, `auth.uid()` returns `null`. ([Supabase][8])

**Inference (and the part people miss):** if your app queries your database without a real user auth context (no valid access token), RLS policies using `auth.uid()` won’t match and will deny or behave unexpectedly. That’s why the SSR cookie + Proxy refresh flow matters: it keeps the authenticated context consistent across server rendering and browser navigation.

---

## Post‑incident hardening checklist

* [ ] **No auth-helpers packages** anywhere in the dependency tree. ([GitHub][1])
* [ ] `createBrowserClient` only in Client Components; `createServerClient` only on the server. ([Supabase][5])
* [ ] Server client implements `cookies.getAll/setAll` with **try/catch around `setAll`**. ([Supabase][2])
* [ ] `proxy.ts` exists and runs (Next.js Proxy convention), with a matcher that avoids static assets. ([Next.js][6])
* [ ] Proxy updates both `request.cookies` and `response.cookies`. ([Supabase][4])
* [ ] Proxy does **not** rely on `getSession()` for server-side protection. ([Supabase][7])
* [ ] If you cache SSR responses (CDN/edge), include at least the refresh-token cookie in the cache key or you can serve the wrong user’s data. ([Supabase][3])
* [ ] RLS enabled on exposed tables + policies shipped alongside schema changes. ([Supabase][8])

---

If you want, paste your current `lib/supabase/*.ts` + `proxy.ts` and I’ll point out any session-leak footguns (like a server client created at module scope, cookie copying mistakes, or auth checks that accidentally trust `getSession()`).
