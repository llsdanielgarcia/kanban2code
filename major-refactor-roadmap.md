# Major Refactor Roadmap

This document tracks planned breaking changes and major refactors for Kanban2Code.

## Active Refactors

### 1. Remove Template System

**Status:** Planned
**Priority:** High
**Reason:** Templates are passive, take up conceptual space, and don't fit the agent-driven workflow

**What Gets Removed:**
- `.kanban2code/_templates/tasks/` folder and all task templates
- `.kanban2code/_templates/stages/` folder and all stage templates
- `src/services/template.ts` service
- Template loading/resolution logic
- Template picker UI components
- Template-related messaging (RequestTemplates, TemplateContentLoaded, etc.)
- Template references in task frontmatter

**What Replaces It:**
- Agents generate task content on-demand
- Stage context embedded in agent instructions
- No UI for template selection (agents just write content)

**Migration Path:**
1. Audit all references to templates in codebase
2. Remove template service and types
3. Remove template UI components (TemplatePicker, etc.)
4. Update messaging protocol (remove template messages)
5. Update scaffolder to not create _templates folder
6. Update documentation to remove template references
7. Update ai-guide.md to emphasize agent-generated content

**Breaking Changes:**
- Existing workspaces with custom templates will need migration
- TaskEditorModal template dropdown needs removal
- Task creation modal template selection needs removal

**Files to Delete:**
- `src/services/template.ts`
- `src/webview/ui/components/TemplatePicker.tsx`
- Template-related types in `src/types/`
- Template tests

**Files to Update:**
- `src/services/scaffolder.ts` (don't create _templates)
- `src/webview/ui/components/TaskModal.tsx` (remove template picker)
- `src/webview/ui/components/TaskEditorModal.tsx` (remove template loading)
- `src/webview/messaging.ts` (remove template message types)
- `docs/architecture.md` (remove template documentation)
- `docs/user_guide.md` (remove template usage)
- `.kanban2code/_context/ai-guide.md` (update to remove template references)

**Testing:**
- Verify task creation works without templates
- Verify scaffolder doesn't create _templates folder
- Verify agents can generate appropriate content
- Verify no broken references to template system

---

## Proposed Refactors

### 2. Agent-Driven Orchestration Pipeline

**Status:** Design Phase
**Priority:** High

**Goal:**
Create specialized agents for roadmap → architecture → decomposition → execution workflow.

**Agents to Create:**

**Orchestration Agents (Meta-workflow):**
1. **Roadmapper** (Sonnet) - Idea exploration and vision document creation
2. **Architect** (Opus) - Edits roadmap to add technical design, phases, tasks, tests, files, and context
3. **Splitter** (GLM) - Reads roadmap and generates individual task markdown files

**Execution Agents (5-stage workflow):**
4. **Planner** (Sonnet/Opus) - Two responsibilities: (1) Refines/improves the task prompt, (2) Gathers necessary context (code, tests, patterns). Appends context and refined prompt to task file (stage: plan)
5. **Coder** (Codex) - General-purpose coding agent. Executes the plan and writes code. Future: project-specific variants (Ncoder for Next.js, Pcoder for Python, etc.) (stage: code)
6. **Auditor** (Codex-high) - Reviews code and assigns quality rating 1-10. Rating 8-10 = accepted for production, moves to completed. Rating <8 = needs work, moves back to code stage (stage: audit)

**Key Design Decisions:**
- Use **tags** (not checklists) to track orchestration state
  - Negative tags: `missing-architecture`, `missing-decomposition`, `missing-tests`
  - Positive tags: `architecture-ready`, `decomposition-ready`
- Each agent spawns the next task in the pipeline
- Parent/child relationships track the orchestration chain
- 5-stage model stays for execution tasks
- Meta-tasks (roadmap, architecture, decomposition) skip code/audit stages
- **Prompt Optimization Strategy:**
  - **Human prompts** - User needs to read/understand the output (readable, clear)
  - **Robot prompts** - AI-to-AI communication, optimize for AI efficiency (can be dense/technical)

**Agent Prompt Types:**
- **Roadmapper**: HUMAN (user reads vision document and needs to understand it)
- **Architect**: HUMAN (user reviews architecture decisions and technical design)
- **Splitter**: ROBOT (mechanical task file generation, user reads the output files not the process)
- **Planner**: HUMAN (user needs to understand context gathered and prompt refinement)
- **Coder**: ROBOT (user reads the code, not the reasoning; optimize for code quality)
- **Auditor**: HUMAN (user needs to understand review feedback and ratings)

**Tag Conventions:**

```yaml
# Roadmap task (Orchestration meta-task)
tags: [roadmap, p0]
# On handoff, Roadmapper adds to spawned Architect task:
tags: [architecture, p0, missing-architecture, missing-decomposition]

# Architect task (Orchestration meta-task, after handoff from Roadmapper)
tags: [architecture, p0, missing-architecture, missing-decomposition]
# On handoff, Architect removes missing-architecture, adds to spawned Splitter task:
tags: [decomposition, p0, missing-decomposition]

# Splitter task (Orchestration meta-task, after handoff from Architect)
tags: [decomposition, p0, missing-decomposition]
# Splitter generates task files, removes missing-decomposition

# Execution task (normal 5-stage workflow, generated by Splitter)
tags: [feature, p1]  # Goes through: inbox → plan → code → audit → completed
# Planner agent works on tasks in "plan" stage
# Coder agent works on tasks in "code" stage
# Auditor agent works on tasks in "audit" stage
```

**Implementation:**
- **IMPORTANT**: These agents must ship with the extension, not just live in project workspaces
- Agent files should be bundled with the extension and copied/scaffolded into new workspaces
- Create agent markdown files in `.kanban2code/_agents/`
- Document handoff protocol in ai-guide.md
- Update user guide with orchestration workflow
- Add examples of full pipeline
- Update scaffolder to include these agents in new workspaces

**Files to Create:**

Orchestration agents:
- `.kanban2code/_agents/roadmapper.md`
- `.kanban2code/_agents/architect.md`
- `.kanban2code/_agents/splitter.md`

Execution agents (5-stage workflow):
- `.kanban2code/_agents/planner.md` (works on tasks in "plan" stage)
- `.kanban2code/_agents/coder.md` (works on tasks in "code" stage)
- `.kanban2code/_agents/auditor.md` (works on tasks in "audit" stage)

**Files to Update:**
- `.kanban2code/_context/ai-guide.md` (add orchestration section)
- `docs/user_guide.md` (add orchestration workflow guide)
- `docs/architecture.md` (document agent pipeline)

---

## Future Considerations

### 3. Workflow Automation

**Status:** Future
**Priority:** Medium

Once manual orchestration workflow is validated, consider:
- Automatic task spawning (agents create follow-up tasks)
- "Gather context" CLI command
- Backend agent activation triggers
- Workflow templates (multi-step pipelines)

**Wait until:** Manual workflow is proven and patterns are clear.

### 4. Board Layout Improvements

**Status:** Ideas
**Priority:** Low

Potential improvements:
- Visual distinction for meta-tasks vs execution tasks
- Tag-based coloring for orchestration states
- Filter presets for "incomplete orchestration work"

---

## Notes

- **Philosophy:** Don't over-engineer for rare operations. Orchestration happens once per feature; use simple tags.
- **Manual first:** Validate workflows manually before automating.
- **Model specialization:** Leverage different model strengths (Sonnet for conversation, Opus for architecture, GLM for cheap tasks, Codex for coding).
