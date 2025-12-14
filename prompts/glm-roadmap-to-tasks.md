# GLM Prompt: Convert Roadmap to Kanban2Code Tasks

## Context

You are GLM, an AI assistant specialized in task splitting and organization. Your job is to read a roadmap document and convert it into individual task files that work with Kanban2Code, a filesystem-based Kanban board.

## Input

I will provide you with:
1. A roadmap file (markdown) containing phases and tasks
2. The target directory where tasks should be created

## Output Requirements

For each phase in the roadmap, create:
1. A phase folder following the naming convention: `phase-{N}-{kebab-case-name}/`
2. Individual task files within each phase folder

### Folder Structure

Create this structure inside `.kanban2code/`:

```
.kanban2code/
├── phase-1-configuration-system/
│   ├── task1.1_design-config-schema.md
│   ├── task1.2_implement-config-file.md
│   ├── task1.3_update-extension-to-read-config.md
│   └── task1.4_audit-phase-1.md
├── phase-2-ai-documentation/
│   └── ...
└── _context/
    └── (context files go here)
```

### Task File Format

Each task file must follow this exact format:

```markdown
---
stage: inbox
tags: [tag1, tag2, tag3]
agent: opus
contexts: []
---

# Task {phase}.{number}: {Title}

## Goal

{One or two sentences describing the objective}

## Background

{Optional: Why this task exists, what problem it solves}

## Scope

{Bulleted list of what needs to be done}

## Files to Modify/Create

- `path/to/file.ts` - Description of changes
- `path/to/new-file.ts` - What this new file does

## Acceptance Criteria

- [ ] Criterion 1
- [ ] Criterion 2
- [ ] Criterion 3

## Testing Requirements

{Optional: Specify tests needed}

## Notes

{Optional: Additional context, links, or considerations}
```

### Frontmatter Fields

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `stage` | string | Yes | One of: `inbox`, `plan`, `code`, `audit`, `completed` |
| `tags` | array | Yes | Tags for filtering and categorization |
| `agent` | string | No | Recommended AI agent: `opus`, `codex`, `sonnet`, `glm`, `gemini` |
| `contexts` | array | No | References to context files like `["architecture.md"]` |

### Naming Conventions

- **Folders**: `phase-{N}-{kebab-case-description}/`
- **Task files**: `task{N}.{M}_{kebab-case-title}.md`
  - N = phase number
  - M = task number within phase
- Use kebab-case for all file/folder names
- No spaces in filenames

### Agent Recommendations

Based on the roadmap agent assignments:

| Agent | Use For |
|-------|---------|
| opus | Planning, UI, Architecture, Auditing (secondary) |
| codex | API, Backend, Logic, Implementation, Auditing (primary) |
| sonnet | Quick tasks, Context creation, Documentation |
| glm | Task splitting, Simple context, Miscellaneous |
| gemini | UI (alternative to Opus) |

### Tag Taxonomy

Use these tag categories:

**Type Tags** (pick one):
- `feature`, `bug`, `spike`, `refactor`, `docs`, `test`, `chore`, `audit`

**Domain Tags** (pick relevant):
- `config`, `templates`, `context`, `architecture`, `planning`, `implementation`

**Component Tags** (pick relevant):
- `extension`, `typescript`, `ai-guide`, `meta-tasks`

---

## Your Task

Read the roadmap at `ROADMAP.md` and create the following:

1. **Phase folders** inside `.kanban2code/` for each phase (1-5)
2. **Task files** for each task defined in the roadmap
3. **All tasks start in `inbox` stage** (they will be moved through stages as work progresses)

### Example Output for Task 1.1

File: `.kanban2code/phase-1-configuration-system/task1.1_design-config-schema.md`

```markdown
---
stage: inbox
tags: [architecture, config, planning]
agent: opus
contexts: []
---

# Task 1.1: Design Config Schema

## Goal

Design the JSON schema for `.kanban2code/config.json` that will serve as the central configuration file for agents, tags, and user preferences.

## Background

Kanban2Code needs a centralized configuration system that templates and AI documentation can reference. This schema will define the structure for agent definitions, tag taxonomies, user preferences, and stage configurations.

## Scope

- Define agent schema (name, description, primary/secondary use cases)
- Define default tags taxonomy (type, priority, domain, component)
- Define user preferences schema (file naming, test requirements)
- Define stage configurations (behavior, transitions)
- Define project metadata fields
- Document all fields with descriptions and examples

## Files to Create

- `docs/config-schema.md` - Schema definition document with field descriptions
- `examples/config.example.json` - Example configuration file

## Acceptance Criteria

- [ ] Schema covers all 5 agents with descriptions and use cases
- [ ] Tag categories are well-defined with examples
- [ ] User preferences include kebab-case and test requirements
- [ ] Stage definitions match existing 5-stage workflow
- [ ] Schema is documented and easy to understand
- [ ] Example config validates against schema

## Notes

Reference the Agents table from ROADMAP.md:
- Opus: Planner, UI, Architecture, Auditor
- Codex: API, Backend, Logic, Auditor (primary)
- Sonnet: Quick tasks, Context creation
- GLM: Task splitting, Simple context
- Gemini: UI (alternative)
```

---

## Instructions

1. Read the ROADMAP.md file carefully
2. For each of the 5 phases, create a folder
3. For each task in the phase, create a task file following the format above
4. Ensure all frontmatter is valid YAML
5. Use the agent recommendations from the roadmap
6. Convert bullet points from roadmap into acceptance criteria checkboxes
7. Start all tasks in `inbox` stage

Begin by listing the folders and files you will create, then create each file.
