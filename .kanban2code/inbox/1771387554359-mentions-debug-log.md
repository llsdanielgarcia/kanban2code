---
stage: code
tags:
  - debug
  - mentions
  - changelog
contexts:
  - architecture
  - skills/react-core-skills
  - skills/skill-vitest-playwright-testing
skills: []
agent: coder
---

# @-Mentions Feature — Debug & Change Log

Tracking record of all files created or modified for the @-mention feature and the bugs found + fixed during testing.

---

## Files Created

### `src/webview/ui/components/MentionsTextarea.tsx` (new)
Wraps the plain `<textarea>` with @-mention autocomplete behaviour.

- Detects `@` trigger via `findMentionTrigger` — finds the last `@` before cursor that isn't preceded by a word character (`/[a-zA-Z0-9_/\\]/`)
- Manages dropdown state: open/close, position, selected index, search results
- 150ms debounced `SearchFiles` message to extension host with a `requestId` for race-condition safety
- Keyboard navigation: ArrowUp/Down, Enter/Tab to select, Escape to dismiss
- `selectFile()` replaces `@query` at cursor with the chosen file path
- Dual dismissal: `onBlur` (200ms timeout) + `document` click-outside listener
- Shows "No files found" state when query is non-empty but returns no matches

---

## Files Modified

### `src/webview/ui/components/TaskModal.tsx`
- Replaced content `<textarea>` with `<MentionsTextarea />` in the create-task form
- Passes `value`, `onChange`, `placeholder`, `rows` props

### `src/webview/ui/components/TaskEditorModal.tsx`
- Added `mentionFilesRef`, `mentionSearchResolveRef`, `mentionSearchTimeoutRef`, `mentionSearchRequestIdRef` refs
- Registered a Monaco `CompletionItemProvider` with `triggerCharacters: ['@']` inside `onMount`
- Provider reads text up to cursor, finds last `@`, extracts query, fires `SearchFiles` via a 150ms-debounced Promise bridge
- `FilesSearched` response resolves the promise and returns `CompletionItem[]` to Monaco
- Range set to replace `@query` with bare file path on selection

### `src/webview/SidebarProvider.ts`
- Added `SearchFiles` message handler (case in `_handleWebviewMessage`)
- `vscode.workspace.findFiles` with exclusion patterns: `node_modules`, `.git`, `dist`, `out`, `.kanban2code`, `coverage`, `.next`, `build`
- Fuzzy scorer: consecutive match +3, word-boundary match +2, other +1; filtered by `score > 0`, sorted descending, sliced to 20

### `src/webview/messaging.ts`
- Added `'SearchFiles'` to `WebviewToHostMessageTypes`
- Added `'FilesSearched'` to `HostToWebviewMessageTypes`

### `src/webview/ui/styles/main.css`
- Added `.mentions-textarea-wrapper`, `.mentions-dropdown`, `.mentions-dropdown-item`, `.mentions-dropdown-item.selected`, `.mentions-file-icon`, `.mentions-file-path`, `.mentions-dropdown-empty` styles
- Uses VSCode CSS variables (`--vscode-editorWidget-background`, `--vscode-list-activeSelectionBackground`, etc.) for automatic theme matching

---

## Bugs Found & Fixed During Testing

### Bug 1 — Dropdown never appeared on `@` alone
**File:** `src/webview/SidebarProvider.ts:415`

**Root cause:** The guard `if (!root || !query)` treated an empty string as falsy and returned `{ files: [] }` immediately — so typing just `@` (query = `""`) always got back zero results.

**Fix:** Changed to `if (!root)` only, allowing empty queries through.

---

### Bug 2 — Empty query still returned no files after Bug 1 fix
**File:** `src/webview/SidebarProvider.ts:437`

**Root cause:** The fuzzy scorer iterates `queryChars = "".split("")` which is `[]`. The `for` loop never ran, every file kept `score = 0`, and `.filter(item => item.score > 0)` wiped the entire list.

**Fix:** Added a branch before scoring:
```ts
const scoredFiles = queryChars.length === 0
  ? allPaths.slice(0, 20)          // empty query → return first 20 files
  : allPaths.map(...).filter(...); // non-empty → fuzzy score + rank
```

---

## Build & Install

After fixing bugs, extension was rebuilt and reinstalled:
```
bun run package        # production build
bunx @vscode/vsce package  # → kanban2code-1.0.0.vsix
code --install-extension kanban2code-1.0.0.vsix --force
```

Previous `kanban2code-1.0.0.vsix` moved to `archive/` before rebuild.

## Regression Hardening Pass (2026-02-19)

### Source Updates

#### `src/webview/SidebarProvider.ts`
- Kept empty-query handling enabled for `SearchFiles`.
- Hardened deterministic ordering by sorting `allPaths` before empty-query fallback and fuzzy scoring.

#### `src/webview/KanbanPanel.ts`
- Added the same deterministic sorting as `SidebarProvider` to maintain host parity for shared mention UI behavior.

#### `src/webview/ui/components/MentionsTextarea.tsx`
- Added `closeDropdown()` helper to centralize dismissal cleanup.
- Dismissal now clears pending debounce timeout and invalidates `requestId`, preventing stale `FilesSearched` responses from mutating dropdown state.
- `debouncedSearch()` now invalidates the prior request immediately before scheduling the next one.
- Added unmount timeout cleanup.

#### `src/webview/ui/components/TaskEditorModal.tsx`
- Added `cancelPendingMentionSearch()` for Monaco mention completion flow.
- Invalidates pending request/timer/resolve state on:
  - modal close
  - non-trigger cases (`no @`, word-prefixed `@`, queries containing spaces)
  - superseded completion requests
- Ensures stale `FilesSearched` payloads cannot resolve the active completion pipeline.

### Regression Test Coverage Added/Updated

#### `tests/webview-host-mentions.test.ts` (new)
- Added host-level tests for `SearchFiles` empty-query behavior in both:
  - `SidebarProvider`
  - `KanbanPanel`
- Verifies deterministic sorted first-20 result behavior and `requestId` propagation in `FilesSearched`.

#### `tests/webview.test.ts`
- Added explicit envelope schema coverage for:
  - Host -> webview: `FilesSearched`
  - Webview -> host: `SearchFiles`

#### `tests/webview/task-modal-create-project.test.tsx`
- Added mention insertion regression:
  - typing `@` sends `SearchFiles` with empty query
  - stale `FilesSearched` response is ignored by `requestId`
  - valid response selection replaces active mention token with file path

#### `tests/webview/task-editor-modal.test.tsx`
- Extended Monaco mock to register completion providers.
- Added completion regressions for:
  - requestId correlation (stale response ignored, matching response resolved)
  - active `@query` replacement range correctness
  - non-trigger and space-query ignore behavior

### Verification

Executed:
```bash
bun run test -- tests/webview-host-mentions.test.ts tests/webview.test.ts tests/webview/task-modal-create-project.test.tsx tests/webview/task-editor-modal.test.tsx
```

Result:
- 4 test files passed
- 28 tests passed
- 0 failures

This verifies empty-query behavior, host parity, envelope contract coverage, and mention insertion/requestId safety.

## Refined Prompt
Objective: Finalize the @-mentions debug task by converting this log into an implementation-ready regression hardening pass with verified file/test coverage.

Implementation approach:
1. Reconcile documented changes against current source so the change log reflects the real mention pipeline in both webview hosts (`SidebarProvider` and `KanbanPanel`) and both editors (`MentionsTextarea` and Monaco in `TaskEditorModal`).
2. Add focused regression tests for empty-query search behavior, message contract coverage (`SearchFiles`/`FilesSearched`), and mention insertion flow safety, then update this task log with exact fixes and verification steps.

Key decisions:
- Treat empty `@` query as valid search input: preserves expected UX where typing `@` immediately shows candidates.
- Keep requestId correlation as the race-condition guard: stale async responses must never update active suggestion state.
- Maintain parity between sidebar host and board host search handlers: shared UI components rely on identical host-side behavior.

Edge cases:
- `@` preceded by word characters (`a@`, `foo/bar@`) should not trigger.
- Empty query must return deterministic results instead of zero-score filtering to empty.
- Monaco completion should ignore queries containing spaces and only replace the active `@query` range.
- Dropdown/no-results states should not remain visible after blur/click-outside or stale search responses.

## Context

### File Tree (scoped)
Source: `docs/architecture.md` (Directory Structure)
```
src/
└── webview/
    ├── SidebarProvider.ts                       # <- modify
    ├── KanbanPanel.ts                           # <- read-only reference
    ├── messaging.ts                             # <- modify
    └── ui/
        ├── components/
        │   ├── MentionsTextarea.tsx             # <- modify
        │   ├── TaskModal.tsx                    # <- modify
        │   ├── TaskEditorModal.tsx              # <- modify
        │   ├── Sidebar.tsx                      # <- read-only reference
        │   └── Board.tsx                        # <- read-only reference
        └── styles/
            └── main.css                         # <- modify
tests/
├── webview/task-modal-create-project.test.tsx  # <- modify
├── webview/task-editor-modal.test.tsx          # <- modify
└── webview.test.ts                              # <- modify
```

### Architecture Excerpts
Source: `docs/architecture.md > Webview Messaging Architecture`
- Messages use versioned envelope `{ version: 1, type, payload }` defined in `src/webview/messaging.ts` and zod-validated.
- Ready handshake pattern: webview sends `RequestState` on mount, host responds with `InitState` to avoid race conditions.
- Helper API: `createEnvelope`/`createMessage` for typed envelopes, `validateEnvelope` for incoming data.

Source: `docs/architecture.md > Task Editing Flow (Split-Panel Editor)`
- `TaskEditorModal.tsx` is the split-panel editor (metadata + Monaco markdown editor).
- Edit flow depends on `RequestFullTaskData` / `FullTaskDataLoaded` and `SaveTaskWithMetadata` / `TaskMetadataSaved`.

Source: `docs/architecture.md > Two-Webview Model`
- Sidebar host: `src/webview/SidebarProvider.ts`.
- Board host: `src/webview/KanbanPanel.ts`.
- Both hosts load the same React bundle and must support shared message flows.

### Skill Excerpts
Source: `.kanban2code/_context/skills/react-core-skills.md` (`## 3. Golden Rules`, `## 4. Critical Patterns`)
- Component files use `PascalCase.tsx`; variables/functions use `camelCase`.
- Keep hooks at top level; no conditional hook calls.
- Avoid `any`; preserve explicit prop/state types.
- CSS class naming stays `kebab-case`.

Source: `.kanban2code/_context/skills/skill-vitest-playwright-testing.md` (`## 2. Golden Rules`, `## 3. Vitest Baseline`)
- Unit/component tests stay in `*.test.ts` / `*.test.tsx`.
- Keep jsdom-based webview tests using shared setup/mocks.
- Separate messaging/schema unit coverage from UI interaction coverage.
- Prefer focused regression tests that pin previously broken behavior.

### Code Excerpts
- `src/webview/ui/components/MentionsTextarea.tsx:42-52`
```ts
const atIndex = beforeCursor.lastIndexOf('@');
if (atIndex === -1) return null;
const afterAt = beforeCursor.substring(atIndex + 1);
if (afterAt.includes(' ') || afterAt.includes('\n')) return null;
const charBeforeAt = atIndex > 0 ? beforeCursor[atIndex - 1] : ' ';
const wordCharRegex = /[a-zA-Z0-9_/\\]/;
if (wordCharRegex.test(charBeforeAt)) return null;
return { start: atIndex, query: afterAt };
```
Why it matters: this trigger contract defines when suggestions are allowed and directly controls bug reproduction around `@` detection.

- `src/webview/ui/components/TaskModal.tsx:373-382` and `src/webview/ui/styles/main.css:2096-2105`
```tsx
<MentionsTextarea
  id="task-content"
  value={formData.content}
  onChange={(content) => setFormData((prev) => ({ ...prev, content }))}
  placeholder="Task description or notes... (type @ to mention files)"
  rows={4}
/>
```
```css
.mentions-dropdown {
  min-width: 250px;
  max-width: 400px;
  max-height: 200px;
  overflow-y: auto;
  background: var(--vscode-editorWidget-background);
}
```
Why it matters: create-task mention UX depends on both component wiring and themed dropdown styling.

- `src/webview/ui/components/TaskEditorModal.tsx:499-513`
```ts
triggerCharacters: ['@'],
provideCompletionItems: async (model, position) => {
  const textUntilPosition = model.getValueInRange({ ... });
  const atIndex = textUntilPosition.lastIndexOf('@');
  if (atIndex === -1) return { suggestions: [] };
  const charBeforeAt = atIndex > 0 ? textUntilPosition[atIndex - 1] : ' ';
  const wordCharRegex = /[a-zA-Z0-9_/\\]/;
  if (wordCharRegex.test(charBeforeAt)) return { suggestions: [] };
  const query = textUntilPosition.substring(atIndex + 1);
  if (query.includes(' ')) return { suggestions: [] };
```
Why it matters: edit-task mention behavior is separate from textarea logic and must be tested independently.

- `src/webview/SidebarProvider.ts:429-439`
```ts
const files = await vscode.workspace.findFiles(
  new vscode.RelativePattern(root, '**/*'),
  `{${excludePatterns.join(',')}}`,
  500,
);
const queryLower = (query ?? '').toLowerCase();
const queryChars = queryLower.split('');
const allPaths = files.map((uri) => vscode.workspace.asRelativePath(uri, false));
const scoredFiles = queryChars.length === 0
  ? allPaths.slice(0, 20)
  : allPaths.map(...).filter(...);
```
Why it matters: this is the root cause/fix area for the empty-query regressions.

- `src/webview/messaging.ts:66-71`
```ts
// File search for @-mentions
'SearchFiles',
] as const;
```
Why it matters: the mention request type is part of envelope validation and must stay synchronized with host/webview handlers (with `FilesSearched` in host-to-webview types).

### Dependency Graph
- `src/webview/ui/components/MentionsTextarea.tsx` -> imports `src/webview/messaging.ts`; consumed by `src/webview/ui/components/TaskModal.tsx`.
- `src/webview/ui/components/TaskModal.tsx` -> consumed by `src/webview/ui/components/Sidebar.tsx` and `src/webview/ui/components/Board.tsx` (consumers not listed in task `## Files`).
- `src/webview/ui/components/TaskEditorModal.tsx` -> consumed by `src/webview/ui/components/Sidebar.tsx` and `src/webview/ui/components/Board.tsx` (consumers not listed).
- `src/webview/messaging.ts` -> consumed by `MentionsTextarea.tsx`, `TaskModal.tsx`, `TaskEditorModal.tsx`, `SidebarProvider.ts`, `KanbanPanel.ts`, `src/webview/ui/App.tsx`, and `src/webview/ui/hooks/useTaskData.ts` (several consumers not listed).
- `src/webview/ui/styles/main.css` <- imported by `src/webview/ui/App.tsx` (consumer not listed).
- `src/webview/SidebarProvider.ts` <- imported by `src/extension.ts`, `src/commands/index.ts`, and `src/webview/viewRegistry.ts` (consumers not listed).

### Patterns to Follow
- Keep message payloads envelope-based via `createMessage`/`createEnvelope`; no raw object posts.
- Keep requestId matching on both send and receive paths for async file search.
- Keep search behavior mirrored in `SidebarProvider` and `KanbanPanel` to avoid context-specific drift.
- Keep mention trigger regex logic aligned between textarea and Monaco provider.
- Keep mention CSS on VS Code theme tokens (no hardcoded colors outside existing style system).

### Test Patterns
- `tests/webview/task-modal-create-project.test.tsx` uses jsdom + Testing Library with `acquireVsCodeApi` mock and `postMessage` assertions; follow same pattern for textarea mention interactions.
- `tests/webview/task-editor-modal.test.tsx` dispatches host envelopes via `window.dispatchEvent(new MessageEvent(...))`; follow this for Monaco-related mention message flow tests.
- `tests/webview.test.ts` validates messaging schemas/types; extend this file for `SearchFiles`/`FilesSearched` envelope coverage.
- `tests/webview-host-runner.test.ts` shows direct host message-handler invocation style; mirror this approach for host-side `SearchFiles` behavior assertions.

### Gotchas
- Empty query scoring: without explicit `queryChars.length === 0` handling, fuzzy filter collapses to no results.
- Host parity risk: updating only one host (`SidebarProvider` or `KanbanPanel`) causes feature breakage depending on active surface.
- Stale response risk: if requestId checks are bypassed, delayed search responses overwrite newer results.
- Monaco range replacement must target the active `@query` span only; wrong range can clobber surrounding markdown text.

### Scope Boundaries
- Do not redesign the core mention feature architecture already accepted in `1771384892178-mentioning.md`; this task is regression hardening and logging accuracy.
- Do not expand into unrelated provider/runner work; limit changes to mention flow, message contracts, and tests directly tied to this bug log.
- Keep `1771387472993-test-mentions.md` as exploratory notes; production fixes and final verification belong in this task file and corresponding source/tests.
