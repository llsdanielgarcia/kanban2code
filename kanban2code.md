# Kanban2Code V2 — Project Outline

_Distilled from design conversation, 2026-02-19_

---

## The Vision

A VS Code extension where a **chat interface drives everything**. You talk to an orchestrator, it assembles the right context and skills, generates task files, and executes them in a terminal you can watch and intervene in. No fire-and-forget. Human-in-the-loop by design.

**One sentence architecture:**
> The extension is a smart context assembler. The AI is a stateless function. The terminal is the executor.

---

## What Goes (Left Behind)

| What | Why |
|------|-----|
| Sidebar tree/filter UI | Never used. Chat replaces it. |
| Board webview | Deprioritized. Maybe revisit later. |
| Runner-from-kanban-view | Broken. Terminal control replaces it. |
| Accumulated spaghetti | Mental debt. Clean slate is faster. |
| Stateful webview messaging complexity | Overkill for the new model. |

---

## What Stays (Carry Over)

| What | Why |
|------|-----|
| `.kanban2code/` directory structure | Proven. Users already have it. |
| Frontmatter schema + stage model | Inbox → Plan → Code → Audit → Completed. Solid. |
| `_agents/` config files | Provider config already there. |
| `skills-index.json` | Already has framework detection + conditional skill routing. |
| `_context/skills/*.md` | All the skill files themselves. |
| `scanner.ts` | Filesystem scanning works. |
| `frontmatter.ts` | Parsing/serialization works. |
| `stage-manager.ts` | Stage transition logic works. |
| `runner-engine.ts` | Execution logic, extract and clean up. |

---

## New Architecture

### Three Layers

```
┌─────────────────────────────────────┐
│  Chat UI (VS Code Sidebar)          │  ← you talk here
│  - Conversation thread              │
│  - "Generate .md" button            │
│  - "Run" button                     │
└──────────────┬──────────────────────┘
               │
┌──────────────▼──────────────────────┐
│  Orchestrator (Stateless API Call)  │  ← reasons here
│  - Receives: history + workspace    │
│    state + available skills         │
│  - Decides: which agent, which      │
│    skills, what the task file says  │
│  - Returns: task .md or next msg    │
└──────────────┬──────────────────────┘
               │
┌──────────────▼──────────────────────┐
│  Terminal Executor                  │  ← runs here, you watch
│  - Opens VS Code terminal           │
│  - Pastes: command + task context   │
│    + selected skills                │
│  - You can see output, answer       │
│    questions, catch wrong turns     │
└─────────────────────────────────────┘
```

### Stateless Design (No Vendor Lock-in)

- Extension owns conversation history in memory
- Each API call assembles fresh: `history + workspace_state + skills → response`
- Swap the agent config file → swap the model → done
- AI landscape changes fast. This survives that.

---

## Agent Routing

Different models for different jobs:

| Role | Model Candidates | Notes |
|------|-----------------|-------|
| Orchestrator | Sonnet, Kimi K2 | Reasoning, planning. Sonnet best but pricey. K2 = "temu sonnet". |
| Planner | Haiku, MiniMax | Fast, cheap, good enough for decomposition. |
| Coder | Sonnet, Codex | Implementation. |
| Auditor | Codex-high, Opus | High accuracy, gates completion. |

Each agent config (`_agents/*.md`) defines: provider, model, endpoint, api_key env var, and which stage it handles.

---

## Skills Auto-Selection

`skills-index.json` already handles this:

1. **Framework detection** — scans workspace files + `package.json` deps
2. **Core skills** — always attached for detected framework
3. **Conditional skills** — triggered by keywords in conversation / task description

Orchestrator receives a compact skills summary. Attaches relevant skill files to the task before routing to execution agent.

---

## Workspace State (Orchestrator Context)

What the orchestrator sees on every call:

```json
{
  "tasks": [
    { "id": "...", "title": "...", "stage": "plan", "project": "...", "tags": [] }
  ],
  "projects": ["...", "..."],
  "available_skills": ["Next.js Core", "Tailwind v4", "..."],
  "available_agents": ["opus", "sonnet", "kimi", "codex"]
}
```

Built by scanning `.md` files live — not cached, not a memory file that can drift. Truth comes from the filesystem.

---

## Chat UI Flows

### Flow 1: Conversation → Task File
```
You: "I want to add a dashboard to the admin panel"
Orchestrator: detects Next.js + Tailwind → selects relevant skills
             → asks clarifying questions if needed
             → proposes task structure
You: [approve / refine]
→ "Generate .md" → creates task file with frontmatter + context
```

### Flow 2: Task File → Execution
```
You: [press Run on a task]
Extension: assembles command (agent CLI + task + skills)
         → opens VS Code terminal
         → pastes command
You: watch it run, answer questions, intervene if needed
```

### Flow 3: Orchestrator Awareness
```
You: "plan all my inbox tasks"
Orchestrator: sees workspace state (5 inbox tasks)
            → processes each, generates plan files
            → queues terminal runs or reports back
```

---

## Build Order

1. **Provider adapter layer** — clean interface: send(messages, model, endpoint) → response. Plugs into existing `_agents/` config files.
2. **Workspace state assembler** — JSON snapshot from filesystem scan. Feed to orchestrator.
3. **Chat UI** — simple message thread in sidebar webview. "Generate .md" + "Run" buttons.
4. **Orchestrator integration** — wire chat → provider adapter → response rendering.
5. **Skill auto-selection** — consume `skills-index.json`, attach to API calls.
6. **Terminal executor** — VS Code terminal API, paste command, stay visible.
7. **Task file generator** — orchestrator output → write `.md` with correct frontmatter.
8. **Carry over** — port scanner, frontmatter, stage-manager, runner-engine cleanly.

---

## What Success Looks Like

- You open VS Code, open the Kanban2Code sidebar
- You type "build a dark mode toggle"
- The orchestrator detects React/Tailwind, attaches the right skills, asks one clarifying question
- You click "Generate .md" — task file created
- You click "Run" — terminal opens, agent starts working, you watch
- You see it heading the wrong direction — you type a correction in the terminal
- Task completes, stage moves to audit automatically
- You move to the next task

---

## Roadmap

> Development sequence for Kanban2Code V2. Each phase has a single clear goal, lists every file involved (existing to port vs. new to create), and defines what "done" means before moving on.

---

### Phase 0 — Clean Slate Bootstrap

**Goal:** New repo skeleton compiles, extension activates in VS Code, nothing more.

**Why first:** Everything else depends on the build pipeline working. Don't carry over build tech debt.

**Files to create (new):**
- `package.json` — strip old commands, old webview contributors; keep core VS Code extension manifest, Bun scripts, esbuild
- `tsconfig.json` — copy from v1, verify paths
- `build.ts` — copy from v1, trim board bundle references
- `vitest.config.ts` — copy from v1
- `vitest.e2e.config.ts` — copy from v1
- `.vscodeignore` — copy from v1
- `.prettierrc` — copy from v1
- `eslint.config.mjs` — copy from v1
- `src/extension.ts` — stub only: `activate()` logs "Kanban2Code V2 activated", `deactivate()` is empty
- `src/webview/ui/main.tsx` — stub: renders `<div>Loading...</div>`
- `src/webview/ui/vscodeApi.ts` — **port from v1** (`src/webview/ui/vscodeApi.ts`), singleton pattern must be preserved

**Done when:** `bun run build` succeeds, extension loads in Extension Development Host, Output Channel shows activation message.

---

### Phase 1 — Port Core Types and Services

**Goal:** All battle-tested backend logic lives in the new repo. No UI yet. Tests pass.

**Why second:** These are the foundation every later phase sits on. Port them cleanly once, never touch again.

**Files to port (copy + verify, no rewrites):**

_Types:_
- `src/types/task.ts` — Task, Stage, frontmatter shape
- `src/types/provider.ts` — ProviderConfig, ProviderSafetySchema, PromptStyle
- `src/types/config.ts` — KanbanConfig, DEFAULT_CONFIG
- `src/types/errors.ts` — KanbanError, FileSystemError, StageTransitionError, etc.
- `src/types/filters.ts` — FilterState, tag taxonomy, color utilities
- `src/types/context.ts` — ContextFile, ContextConfig
- `src/types/copy.ts` — CopyOptions, CopyResult
- `src/types/gray-matter.d.ts` — declaration file

_Core:_
- `src/core/constants.ts` — STAGES, folder names, PROVIDERS_FOLDER
- `src/core/rules.ts` — stage transition rules, validation logic

_Utils:_
- `src/utils/text.ts` — text processing helpers

_Workspace:_
- `src/workspace/state.ts` — WorkspaceState, kanban root detection
- `src/workspace/validation.ts` — ensureSafePath, workspace detection

_Services:_
- `src/services/scanner.ts` — loadAllTasks, getOrderedTasksForStage
- `src/services/frontmatter.ts` — parseTaskFile, stringifyTaskFile
- `src/services/stage-manager.ts` — getDefaultAgentForStage, stage transition logic
- `src/services/task-content.ts` — load/save task file content + relocation
- `src/services/task-watcher.ts` — debounced filesystem watcher
- `src/services/projects.ts` — listProjects, listPhases, createProject
- `src/services/archive.ts` — archiveTask, archiveProject
- `src/services/delete-task.ts` — deleteTaskById
- `src/services/copy.ts` — copyTaskContext to clipboard
- `src/services/fs-move.ts` — atomic file move helper
- `src/services/scaffolder.ts` — scaffold new workspace
- `src/services/config.ts` — load/validate `.kanban2code/config.json`
- `src/services/logging.ts` — createModuleLogger, log levels, Output Channel
- `src/services/error-recovery.ts` — handleError, withRecovery, createRecoverableOperation
- `src/services/prompt-builder.ts` — buildRunnerPrompt, XML assembly
- `src/services/context.ts` — load context files from `_context/`
- `src/services/provider-service.ts` — listAvailableProviders, resolveProviderConfig, full CRUD

_Assets:_
- `src/assets/providers.ts` — BUNDLED_PROVIDERS (auto-generated, copy as-is)
- `src/assets/agents.ts` — BUNDLED_AGENTS
- `src/assets/contexts.ts` — BUNDLED_CONTEXTS
- `src/assets/seed-content.ts` — seed files for scaffolding

_Port tests alongside each service:_
- `tests/setup.ts`, `tests/vscode-stub.ts`
- `tests/frontmatter.test.ts`
- `tests/scanner.test.ts` (task-loading.test.ts)
- `tests/stage-manager.test.ts`
- `tests/archive.test.ts`
- `tests/scaffolder.test.ts`
- `tests/config-service.test.ts`
- `tests/logging.test.ts`
- `tests/errors.test.ts`
- `tests/tag-taxonomy.test.ts`
- `tests/validation.test.ts`
- `tests/rules.test.ts`
- `tests/delete-task.test.ts`
- `tests/task-content.test.ts`
- `tests/task-watcher.test.ts`
- `tests/context-service.test.ts`
- `tests/copy-service.test.ts`
- `tests/prompt-builder.test.ts`
- `tests/error-recovery.test.ts`

**Done when:** `bun run test` passes for all ported tests. No UI, no runner yet.

---

### Phase 2 — Port Runner

**Goal:** The execution engine lives in the new repo and all adapters work.

**Why its own phase:** The runner is self-contained and complex. Isolating it makes verification easier.

**Files to port:**
- `src/runner/cli-adapter.ts` — CliAdapter interface, CliResponse, CliCommandResult
- `src/runner/adapter-factory.ts` — getAdapterForCli (claude, codex, kimi, kilo)
- `src/runner/adapters/claude-adapter.ts` — Claude CLI adapter
- `src/runner/adapters/codex-adapter.ts` — Codex/OpenAI adapter
- `src/runner/adapters/kimi-adapter.ts` — Kimi K2 adapter
- `src/runner/adapters/kilo-adapter.ts` — GLM/ZAI adapter via kilo CLI
- `src/runner/output-parser.ts` — parseAuditRating, parseAuditVerdict, parseFilesChanged, parseStageTransition
- `src/runner/runner-state.ts` — RunnerState, queue management
- `src/runner/runner-log.ts` — RunnerLog, RunnerStageRecord, per-run markdown reports
- `src/runner/git-ops.ts` — git operations helper
- `src/runner/runner-engine.ts` — EventEmitter-based engine, runTask, stop, event types

_Port runner tests:_
- `tests/runner-log.test.ts`
- `tests/runner-engine.test.ts`
- `tests/e2e/setup.ts`
- `tests/e2e/core-workflows.test.ts`

**Done when:** `bun run test` still fully green. Runner engine can be imported without errors.

---

### Phase 3 — Workspace Snapshot Service

**Goal:** A single function that returns a clean JSON snapshot of everything the orchestrator needs to know.

**Why now:** The orchestrator can't work without this. Build and test it in isolation before wiring it to anything.

**Files to create (new):**
- `src/services/workspace-snapshot.ts`
  - `buildWorkspaceSnapshot(kanbanRoot: string): Promise<WorkspaceSnapshot>`
  - Calls `loadAllTasks()` from scanner — tasks with id, title, stage, project, tags, agent
  - Calls `listAvailableProviders()` from provider-service — available agent names
  - Reads `skills-index.json` — available skill names + descriptions (compact, not full file content)
  - Calls `listProjects()` from projects — active project/phase names
  - Returns `WorkspaceSnapshot` type (defined in same file or `src/types/snapshot.ts`)

**WorkspaceSnapshot shape:**
```ts
interface WorkspaceSnapshot {
  tasks: { id: string; title: string; stage: Stage; project?: string; phase?: string; tags: string[]; agent?: string }[];
  projects: string[];
  providers: { id: string; name: string; model: string }[];
  skills: { name: string; description: string; framework: string }[];
  generatedAt: string;
}
```

**Files to create (new):**
- `src/types/snapshot.ts` — WorkspaceSnapshot interface
- `tests/workspace-snapshot.test.ts` — unit test against a temp workspace

**Done when:** `buildWorkspaceSnapshot()` returns correct data from a fixture workspace, test passes.

---

### Phase 4 — Skill Auto-Selector

**Goal:** Given conversation text and the current workspace, return the right skill files to attach to the orchestrator call.

**Why now:** Needed by orchestrator. Needs workspace snapshot as input (Phase 3 dependency).

**How it works:**
1. Read `skills-index.json`
2. Detect frameworks from workspace (`package.json` deps + file patterns from `framework_detection`)
3. Always include `core_skills` for detected frameworks
4. Score `conditional_skills` by keyword overlap with conversation text
5. Return ordered list of skill file paths to read and attach

**Files to create (new):**
- `src/services/skill-selector.ts`
  - `detectFrameworks(workspaceRoot: string): Promise<string[]>`
  - `selectSkills(opts: { kanbanRoot: string; workspaceRoot: string; conversationText: string }): Promise<SelectedSkill[]>`
  - `loadSkillContents(kanbanRoot: string, skills: SelectedSkill[]): Promise<string>` — reads and concatenates skill .md files
- `src/types/skill.ts` — SelectedSkill interface, SkillsIndex schema matching `skills-index.json`
- `tests/skill-selector.test.ts` — unit tests for framework detection, keyword matching, ordering

**Done when:** Given a Next.js workspace and "add dashboard with caching", returns `nextjs-core-skills.md` + `skill-caching-data-fetching.md` in the right order.

---

### Phase 5 — Orchestrator Service

**Goal:** A stateless function that takes conversation + context → calls configured provider API → returns response. No CLI, no spawning. Direct HTTP.

**Why direct API (not CLI):** The chat interface needs streaming responses to feel alive. CLI adapters capture full output after the process exits — too slow for chat. Execution (run button) still uses CLI via terminal.

**Two separate paths, forever separate:**
- **Chat path:** Orchestrator → direct API call → stream tokens to UI
- **Execution path:** Terminal executor → CLI runner → visible terminal (Phase 7)

**Provider support (implement in order of priority):**
1. Anthropic (`@anthropic-ai/sdk`) — `claude-sonnet-4-6`, `claude-haiku-4-5`, `claude-opus-4-6`
2. OpenAI (`openai` SDK) — covers Codex models
3. Moonshot (HTTP, OpenAI-compatible) — covers Kimi K2
4. MiniMax (HTTP, OpenAI-compatible) — Phase 11

**Files to create (new):**
- `src/orchestrator/orchestrator.ts`
  - `sendMessage(opts: OrchestratorCallOptions): AsyncIterable<string>` — streams response tokens
  - Assembles system prompt: workspace snapshot + selected skills + persona instructions
  - Calls the right SDK based on provider field in the active orchestrator config
  - No conversation history stored internally — caller passes full history
- `src/orchestrator/anthropic-client.ts` — Anthropic SDK wrapper, streaming
- `src/orchestrator/openai-client.ts` — OpenAI SDK wrapper, streaming (also covers Moonshot via baseURL override)
- `src/orchestrator/system-prompt-builder.ts`
  - `buildOrchestratorSystemPrompt(snapshot: WorkspaceSnapshot, skills: string): string`
  - Injects: workspace state, available providers, persona ("you are the orchestrator for a dev workflow...")
  - Teaches the orchestrator the task .md format so it can propose valid files
- `src/types/orchestrator.ts`
  - `OrchestratorCallOptions` — history, snapshot, skills, active provider config
  - `ChatMessage` — role: 'user' | 'assistant', content: string
- `tests/orchestrator.test.ts` — unit test with mocked SDK responses

**Done when:** `sendMessage()` with a mocked Anthropic client streams tokens correctly. System prompt contains workspace task list and skill summaries.

---

### Phase 6 — Task File Generator

**Goal:** When the orchestrator proposes a task, one function writes the `.md` file with correct frontmatter and returns the file path.

**Why its own phase:** This is a critical correctness boundary. The generated file must parse correctly with `frontmatter.ts`, be in the right location, and have valid stage/agent values.

**How it works:**
1. Orchestrator response contains a structured task proposal (title, description, stage, agent, tags, project/phase)
2. The orchestrator is prompted to return proposals in a parseable block (e.g., fenced YAML block)
3. Generator parses the block, validates fields, picks the location (inbox vs. project/phase), writes the file

**Files to create (new):**
- `src/services/task-generator.ts`
  - `parseTaskProposal(responseText: string): TaskProposal | null` — extracts structured block from orchestrator response
  - `generateTaskFile(kanbanRoot: string, proposal: TaskProposal): Promise<string>` — writes .md, returns relative path
  - Uses `stringifyTaskFile()` from `src/services/frontmatter.ts`
  - Uses `ensureSafePath()` from `src/workspace/validation.ts`
- `src/types/task-proposal.ts`
  - `TaskProposal` — title, description (markdown body), stage, agent, tags, project?, phase?
- `tests/task-generator.test.ts` — parse proposal from mock response, verify written file has correct frontmatter

**Done when:** Parsing a mock orchestrator response produces a valid `.md` file that `parseTaskFile()` reads back without errors.

---

### Phase 7 — Terminal Executor

**Goal:** One command opens a VS Code terminal, pastes the correct CLI invocation for a given task, and stays visible so the user watches and intervenes.

**Why now:** This replaces the broken hidden runner. Must work before any UI ships.

**How it works:**
1. Read task file (frontmatter to get agent/provider)
2. Resolve provider config via `provider-service.ts`
3. Build CLI command via `adapter-factory.ts` + `cli-adapter.buildCommand()`
4. Build the full prompt string via `prompt-builder.ts` (task content + skill files)
5. Open terminal: `vscode.window.createTerminal({ name: taskTitle })`
6. Send command: `terminal.sendText(command)` — terminal becomes interactive
7. Show terminal: `terminal.show()`

**Files to create (new):**
- `src/services/terminal-executor.ts`
  - `executeTaskInTerminal(kanbanRoot: string, taskId: string, workspaceRoot: string): Promise<void>`
  - Handles prompt size limits (warn if prompt exceeds safe threshold)
  - Names terminal after task title for easy identification
  - Optionally reuses existing terminal with same name
- `tests/terminal-executor.test.ts` — mock vscode.window.createTerminal, verify sendText called with correct command

**Done when:** Triggering `executeTaskInTerminal()` in Extension Development Host opens a named terminal with the correct `claude --prompt "..."` command pasted in.

---

### Phase 8 — New Messaging Protocol

**Goal:** A lean, typed message contract between the extension host and the chat webview. No legacy board/filter/tree messages.

**Why its own phase:** Getting this right before building the UI prevents the class of bugs v1 had (race conditions, message loss, API acquired twice).

**Message types needed:**

_Host → Webview:_
- `InitState` — kanban root exists, workspace snapshot, active orchestrator provider
- `StreamChunk` — token from orchestrator streaming response
- `MessageComplete` — orchestrator response finished
- `TaskGenerated` — task file was written, here's the path + title
- `WorkspaceUpdated` — filesystem changed, here's new snapshot
- `Error` — something failed, here's the message

_Webview → Host:_
- `RequestState` — webview mounted, send me InitState (keep ready handshake from v1)
- `SendMessage` — user sent a chat message, here's the text
- `GenerateTask` — user clicked "Generate .md", here's the confirmed proposal
- `RunTask` — user clicked "Run", here's the task file path
- `CancelStream` — user cancelled an in-progress orchestrator response

**Files to create (new):**
- `src/webview/messaging.ts` — full rewrite. Keep `createEnvelope`/`validateEnvelope` pattern from v1, new message types only.

**Files to port (keep):**
- `src/webview/ui/vscodeApi.ts` — already ported in Phase 0, no changes needed

**Done when:** All message types have Zod schemas, round-trip test passes, no `any` types.

---

### Phase 9 — Chat Webview UI

**Goal:** The sidebar shows a working chat interface. User types, sees streamed responses, can click "Generate .md" and "Run".

**Component breakdown:**

```
SidebarProvider.ts (host)
  └── App.tsx
        ├── Chat.tsx                    ← main container
        │     ├── WorkspaceBar.tsx      ← collapsible: task counts by stage
        │     ├── ChatHistory.tsx       ← scrollable message list
        │     │     └── ChatMessage.tsx ← user bubble / assistant bubble
        │     │           └── TaskProposalCard.tsx  ← when assistant proposes a task
        │     │                 ├── [Generate .md] button
        │     │                 └── [Edit] inline before generating
        │     └── ChatInput.tsx         ← textarea + send button + provider selector
        └── EmptyState.tsx              ← when no kanban workspace found
```

**Files to create (new):**
- `src/webview/SidebarProvider.ts` — rewrite. Handles `RequestState` → `InitState`, `SendMessage` → orchestrator → stream chunks, `GenerateTask` → task-generator, `RunTask` → terminal-executor, `task-watcher` events → `WorkspaceUpdated`
- `src/webview/ui/App.tsx` — rewrite. Chat-only. No board toggle, no filter state. Receives `InitState`, renders `<Chat />` or `<EmptyState />`
- `src/webview/ui/components/Chat.tsx` — conversation state (array of ChatMessage), streams incoming tokens into last assistant message
- `src/webview/ui/components/ChatMessage.tsx` — renders user vs assistant bubble, parses assistant message for task proposal blocks, renders `<TaskProposalCard />` when found
- `src/webview/ui/components/TaskProposalCard.tsx` — displays proposed task (title, stage, agent, tags), "Generate .md" button sends `GenerateTask`, shows confirmation when file created
- `src/webview/ui/components/WorkspaceBar.tsx` — counts tasks per stage (inbox: 3, plan: 1, code: 2...), collapses to a single line, click to expand list
- `src/webview/ui/components/ChatInput.tsx` — auto-resizing textarea, Shift+Enter for newline, Enter to send, provider selector dropdown (shows available orchestrators)
- `src/webview/ui/components/EmptyState.tsx` — **port from v1** (`src/webview/ui/components/EmptyState.tsx`), "Create Kanban Workspace" button
- `src/webview/ui/hooks/useChat.ts` — chat state: messages array, streaming state, send handler, cancel handler

**Files to port (keep with minor updates):**
- `src/webview/ui/components/Icons.tsx` — port from v1, keep useful icons, add new ones as needed

**Files to delete (do not port):**
- All of `src/webview/ui/components/` not listed above — Sidebar.tsx, TaskTree.tsx, TreeNode.tsx, TreeSection.tsx, FilterBar.tsx, QuickFilters.tsx, QuickViews.tsx, Board.tsx, BoardHeader.tsx, BoardHorizontal.tsx, BoardSwimlane.tsx, Column.tsx, Swimlane.tsx, TaskCard.tsx, TaskItem.tsx, TaskModal.tsx, TaskEditorModal.tsx, TaskContextMenu.tsx, MoveModal.tsx, AgentModal.tsx, AgentPicker.tsx, ContextModal.tsx, ContextMenu.tsx, ContextPicker.tsx, SkillPicker.tsx, LocationPicker.tsx, ProjectModal.tsx, LayoutToggle.tsx, KeyboardHelp.tsx, SidebarActions.tsx, SidebarToolbar.tsx, BoardHeader.tsx, MentionsTextarea.tsx
- `src/webview/KanbanPanel.ts` — board panel gone
- `src/webview/viewRegistry.ts` — no longer needed

**Webview component tests (new):**
- `tests/webview/chat.test.tsx` — render Chat, send message, verify message appears
- `tests/webview/task-proposal-card.test.tsx` — render proposal, click Generate, verify message sent
- `tests/webview/workspace-bar.test.tsx` — render with snapshot, verify counts

**Done when:** Extension Development Host shows the chat sidebar. Typing a message sends `SendMessage`. Streamed tokens appear in the assistant bubble. "Generate .md" button appears when orchestrator proposes a task.

---

### Phase 10 — Extension Entry Point + Command Registration

**Goal:** `extension.ts` is clean, minimal, wires everything together. Commands work from the Command Palette.

**Why last among the core phases:** Depends on all services, the orchestrator, and the UI being ready.

**Commands to register (minimal set):**

| Command ID | Title | What it does |
|---|---|---|
| `kanban2code.createWorkspace` | Create Kanban Workspace | Runs scaffolder |
| `kanban2code.runTask` | Run Task in Terminal | Opens file picker → terminal executor |
| `kanban2code.newTask` | New Task (Chat) | Focuses sidebar, pre-fills chat prompt |
| `kanban2code.openSettings` | Open Settings | Opens `_providers/` folder or config.json |

**Files to rewrite:**
- `src/extension.ts` — activate: detect workspace, start task watcher, register commands, create SidebarProvider. No runner engine wired here (runner is terminal-driven now). Clean, under 150 lines.
- `src/commands/index.ts` — registerCommands(context, kanbanRoot), one function per command, imports from services.

**Files to delete (do not port):**
- `src/services/migration.ts` — agents→modes migration no longer relevant
- `src/services/mode-service.ts` — modes replaced by providers

**Done when:** All four commands appear in Command Palette and execute without errors. Task watcher fires, workspace snapshot rebuilds, sidebar receives `WorkspaceUpdated`.

---

### Phase 11 — MiniMax Adapter + Provider Expansion

**Goal:** MiniMax works as an execution provider. Kimi K2 confirmed working end-to-end.

**Why after core:** Provider additions don't block the main flow. Get the flow right first.

**Files to create (new):**
- `src/runner/adapters/minimax-adapter.ts` — MiniMax CLI or API adapter
- `src/assets/providers.ts` — add `minimax.md` entry (update build.ts to pick it up)
- `.kanban2code/_providers/minimax.md` — provider config file for dogfooding workspace

**Files to update:**
- `src/runner/adapter-factory.ts` — add `'minimax'` case
- `src/orchestrator/openai-client.ts` — MiniMax is OpenAI-compatible, add `baseURL` branch for `provider: minimax`

**Done when:** A task runs end-to-end via MiniMax in the terminal. Kimi K2 runs end-to-end via terminal.

---

### Phase 12 — E2E Integration and Hardening

**Goal:** The full loop works. Every seam is tested. Error states handled gracefully.

**Integration scenarios to verify:**

1. **Happy path:** Chat → orchestrator proposes task → Generate .md → Run → terminal opens with correct command → task .md updated by agent → task watcher fires → workspace bar updates
2. **Skill selection:** "add caching to the dashboard" → orchestrator system prompt contains `skill-caching-data-fetching.md` content
3. **Workspace awareness:** "plan all my inbox tasks" → orchestrator system prompt lists all 5 inbox tasks → proposes a plan for each
4. **Wrong direction:** Agent in terminal asks a question → user types answer in terminal → agent continues (this is just terminal UX, verify it doesn't break anything)
5. **No workspace:** Sidebar shows EmptyState, "Create Workspace" button scaffolds correctly
6. **Provider swap:** Change orchestrator provider from sonnet to kimi in settings → next chat message uses kimi

**Files to create (new):**
- `tests/e2e/chat-flow.test.ts` — end-to-end test: chat message → task file generated
- `tests/e2e/terminal-executor.test.ts` — verify terminal command string correctness
- `tests/integration/skill-selector.test.ts` — full skill selection from fixture workspace
- `tests/integration/workspace-snapshot.test.ts` — full snapshot from fixture workspace

**Hardening checklist:**
- [ ] Streaming response cancelled cleanly when user closes sidebar
- [ ] Task generator rejects malformed proposals gracefully (shows error in chat, not crash)
- [ ] Terminal executor warns if prompt exceeds 50k characters
- [ ] Skills not found (missing file) logs warning, continues without that skill
- [ ] Provider API key missing → clear error message in chat bubble, not silent failure
- [ ] Task watcher debounce prevents snapshot rebuild storm during fast file writes

**Done when:** All scenarios above work manually. `bun run test` + `bun run test:e2e` fully green. `bun run typecheck` clean. `bun run build` produces valid VSIX.

---

### Phase 13 — Dogfooding and Iteration

**Goal:** Use Kanban2Code V2 to build Kanban2Code V2 features. Find what's missing by using it daily.

**What to watch for:**
- Which orchestrator model actually performs best for planning (sonnet vs kimi)
- Prompt quality: is the system prompt giving the orchestrator enough context to ask the right questions?
- Skill file quality: are the conditional skills triggering on the right conversations?
- Terminal UX: is the command format working cleanly for each provider?
- Workspace bar: is the task count summary actually useful or just noise?

**Likely follow-up features (don't build now, collect here):**
- Board view (read-only at minimum) — was useful for overview, may want back
- Conversation persistence — save chat history to `.kanban2code/_chat/` so it survives VS Code restarts
- Bulk task operations — "run all plan-stage tasks" queues multiple terminals
- Orchestrator personas — different system prompts for different conversation modes (planning vs debugging vs reviewing)
- Cost tracking — display token usage + USD cost per orchestrator call in the chat bubble footer
- Provider health check — ping configured provider on activation, warn if unreachable

---

### Phase Summary

| Phase | Goal | New Files | Ported Files | Blocks |
|-------|------|-----------|--------------|--------|
| 0 | Bootstrap | extension stub, build | vscodeApi.ts | nothing |
| 1 | Core services | — | 30+ services, types, tests | P0 |
| 2 | Runner | — | 10 runner files + tests | P1 |
| 3 | Workspace snapshot | workspace-snapshot.ts, snapshot.ts | — | P1 |
| 4 | Skill selector | skill-selector.ts, skill.ts | — | P3 |
| 5 | Orchestrator service | orchestrator/, system-prompt-builder | — | P3, P4 |
| 6 | Task file generator | task-generator.ts, task-proposal.ts | frontmatter.ts (already) | P5 |
| 7 | Terminal executor | terminal-executor.ts | provider-service, adapter-factory (already) | P2 |
| 8 | Messaging protocol | messaging.ts (rewrite) | — | P0 |
| 9 | Chat UI | Chat, ChatMessage, ChatInput, WorkspaceBar, TaskProposalCard, SidebarProvider, App | EmptyState, Icons | P5, P6, P7, P8 |
| 10 | Extension entry point | extension.ts (rewrite), commands/index.ts | — | P9 |
| 11 | MiniMax + providers | minimax-adapter.ts | adapter-factory (update) | P7 |
| 12 | E2E hardening | e2e tests | — | P10 |
| 13 | Dogfood | — | — | P12 |

**Critical path:** P0 → P1 → P2 → P3 → P4 → P5 → P6 → P7 → P8 → P9 → P10 → ship

Phases 11–13 are parallel or post-launch work.
