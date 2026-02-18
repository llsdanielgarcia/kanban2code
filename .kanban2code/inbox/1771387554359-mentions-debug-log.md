---
stage: plan
tags:
  - debug
  - mentions
  - changelog
contexts: []
skills: []
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
