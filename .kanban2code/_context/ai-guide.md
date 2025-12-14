# Kanban2Code AI Guide

> This guide teaches AI agents how to create, manage, and work with tasks in Kanban2Code.

## Quick Start

To create a task, write a markdown file with YAML frontmatter in the `.kanban2code/` directory:

```markdown
---
stage: inbox
tags: [feature, frontend]
agent: opus
contexts: []
---

# Implement Dark Mode Toggle

## Goal

Add a dark mode toggle to the settings panel.

## Acceptance Criteria

- [ ] Toggle switch is visible in settings
- [ ] Theme persists across sessions
- [ ] All components respect theme changes
```

---

## 1. System Overview

### What is Kanban2Code?

Kanban2Code is a VS Code extension for managing development tasks using markdown files with YAML frontmatter. Tasks flow through stages (inbox → plan → code → audit → completed) and are assigned to AI agents for manual orchestration.

### Core Concepts

| Concept | Description |
|---------|-------------|
| **Task** | A markdown file describing work to be done |
| **Stage** | The workflow state of a task (inbox, plan, code, audit, completed) |
| **Agent** | An AI assigned to work on a task (opus, codex, sonnet, glm, gemini) |
| **Tag** | A label for categorization (feature, bug, high, frontend, etc.) |
| **Context** | A shared knowledge file that tasks can reference |
| **Project** | A folder grouping related tasks |
| **Phase** | A subfolder within a project for sequenced work |

### Directory Structure

```
.kanban2code/
├── config.json           # Configuration file
├── _context/             # Shared context files
│   ├── ai-guide.md       # This document
│   └── audit-phase1.md   # Phase audit documents
├── _templates/           # Task templates
│   └── tasks/            # Task template files
├── project-name/         # Project folder
│   ├── phase-1-setup/    # Phase folder
│   │   ├── task1.1_design.md
│   │   └── task1.2_implement.md
│   └── standalone-task.md
└── standalone-task.md    # Tasks outside projects
```

---

## 2. File Format Specification

### Task File Structure

Every task file is a markdown file with:
1. **YAML Frontmatter**: Metadata between `---` delimiters
2. **Markdown Body**: Task content starting with an H1 title

```markdown
---
stage: inbox
tags: [feature]
agent: opus
contexts: []
---

# Task Title (H1 heading)

## Goal
What needs to be done.

## Background
Why this task exists.

## Scope
- What's included
- What's excluded

## Files to Modify
- `src/file.ts` - Description of changes

## Acceptance Criteria
- [ ] Criterion 1
- [ ] Criterion 2

## Testing Requirements
How to verify the task is complete.

## Notes
Additional information.
```

---

## 3. Frontmatter Schema

### Required Fields

| Field | Type | Description |
|-------|------|-------------|
| `stage` | string | Current workflow stage. Must be one of: `inbox`, `plan`, `code`, `audit`, `completed` |

### Optional Fields

| Field | Type | Default | Description |
|-------|------|---------|-------------|
| `tags` | string[] | `[]` | Task categorization labels |
| `agent` | string | none | Assigned AI agent |
| `contexts` | string[] | `[]` | Referenced context file paths |
| `parent` | string | none | ID of parent task (for subtasks) |
| `order` | number | none | Sort order within stage |
| `created` | string | none | ISO date string (YYYY-MM-DD) |

### Frontmatter Examples

**Minimal frontmatter:**
```yaml
---
stage: inbox
---
```

**Complete frontmatter:**
```yaml
---
stage: code
tags: [feature, high, frontend, ui]
agent: opus
contexts: [architecture.md, design-system.md]
parent: epic-auth
order: 1
created: 2024-01-15
---
```

### Important Notes

- `project` and `phase` are **inferred from the file path**, not set in frontmatter
- Unknown fields in frontmatter are preserved but ignored
- Invalid `stage` values default to `inbox`

---

## 4. Stage Definitions

### Workflow Stages

| Stage | Order | Description | Typical Actions |
|-------|-------|-------------|-----------------|
| `inbox` | 0 | New tasks awaiting triage | Review, assign agent, add details |
| `plan` | 1 | Tasks being planned/designed | Design solution, break into subtasks |
| `code` | 2 | Tasks in active development | Write code, implement features |
| `audit` | 3 | Tasks under review | Review code, verify acceptance criteria |
| `completed` | 4 | Finished tasks | Archive after 7 days |

### Allowed Transitions

```
inbox ──────► plan ──────► code ──────► audit ──────► completed
  │            │            │            │              │
  │            │            │            │              │
  └──► completed◄───────────┘◄───────────┘              │
                                                        │
  ◄─────────────────────────────────────────────────────┘
                     (reopen)
```

| From Stage | Can Transition To |
|------------|-------------------|
| inbox | plan, completed |
| plan | inbox, code, completed |
| code | plan, audit, completed |
| audit | code, completed |
| completed | inbox |

### When to Transition

- **inbox → plan**: When ready to design the solution
- **plan → code**: When design is complete and implementation begins
- **code → audit**: When implementation is complete and ready for review
- **audit → completed**: When review passes all acceptance criteria
- **Any → completed**: For tasks that are cancelled or won't be done
- **completed → inbox**: To reopen a completed task

---

## 5. Agent System

### Available Agents

| Agent | Primary Use | Secondary Use | Best For |
|-------|-------------|---------------|----------|
| `opus` | Planning, Architecture, UI, Design | Auditing, Code Review | Complex planning, UI work, architecture decisions |
| `codex` | Backend, API, Logic, Coding | Auditing | Backend implementation, API design, code auditing |
| `sonnet` | Quick tasks, Context creation, Roadmap reading | - | Fast context files, reading existing code |
| `glm` | Task splitting, Simple context | Miscellaneous | Breaking down large tasks, simple documentation |
| `gemini` | UI | - | Alternative for UI work |

### Agent Selection Guidelines

1. **Planning/Architecture tasks**: Use `opus`
2. **Backend/API implementation**: Use `codex`
3. **UI/Frontend implementation**: Use `opus` or `gemini`
4. **Quick documentation/context**: Use `sonnet`
5. **Task splitting/breakdown**: Use `glm`
6. **Code auditing/review**: Use `codex` (primary) or `opus` (secondary)

### Agent Assignment

Set the agent in frontmatter:
```yaml
---
stage: plan
agent: opus
---
```

---

## 6. Tag Taxonomy

### Tag Categories

#### Type Tags (What kind of work)
| Tag | Description |
|-----|-------------|
| `feature` | New functionality |
| `bug` | Bug fix |
| `refactor` | Code improvement without behavior change |
| `spike` | Research or investigation |
| `docs` | Documentation work |
| `test` | Test creation or improvement |
| `design` | Design work |
| `security` | Security-related task |
| `config` | Configuration changes |
| `audit` | Code review or audit |

#### Priority Tags (How urgent)
| Tag | Description |
|-----|-------------|
| `critical` | Must be done immediately |
| `high` | Important, should be done soon |
| `medium` | Normal priority |
| `low` | Nice to have, do when time permits |

#### Domain Tags (What area)
| Tag | Description |
|-----|-------------|
| `frontend` | Frontend/client-side |
| `backend` | Backend/server-side |
| `api` | API development |
| `database` | Database-related |
| `infra` | Infrastructure |
| `devops` | DevOps/deployment |
| `ui` | User interface |
| `ux` | User experience |

#### Component Tags (What module)
| Tag | Description |
|-----|-------------|
| `core` | Core functionality |
| `auth` | Authentication |
| `ui` | UI components |
| `utils` | Utilities |
| `services` | Services |
| `types` | Type definitions |
| `config` | Configuration |
| `extension` | Extension code |
| `webview` | Webview components |

### Using Tags

```yaml
---
stage: code
tags: [feature, high, frontend, ui]
---
```

Use multiple tags from different categories for better organization.

---

## 7. Context System

### What are Context Files?

Context files are shared knowledge documents that multiple tasks can reference. They contain:
- Architecture decisions
- Design patterns
- Domain knowledge
- Code conventions
- Previous audit findings

### Context File Location

All context files live in `.kanban2code/_context/`:
```
.kanban2code/_context/
├── ai-guide.md          # This document
├── architecture.md      # System architecture
├── audit-phase1.md      # Phase 1 audit findings
└── design-system.md     # UI design conventions
```

### Referencing Contexts

Use the `contexts` field in frontmatter:
```yaml
---
stage: code
contexts: [architecture.md, design-system.md]
---
```

Context paths are relative to `.kanban2code/_context/`.

### When to Create Context Files

Create a context file when:
- Knowledge will be reused across multiple tasks
- An audit reveals important findings
- Architecture decisions need documentation
- A phase completes and learnings should be preserved

### Context Update Workflow

1. Complete a task or phase
2. Identify reusable knowledge
3. Create or update context file in `_context/`
4. Reference the context in future tasks

---

## 8. File Naming Conventions

### General Rules

- Use **kebab-case** for all file names
- Use `.md` extension for all tasks
- Keep names descriptive but concise

### Task Files

```
# Standalone task
implement-dark-mode.md

# Numbered task in a phase
task1.1_design-config-schema.md
task1.2_implement-config-file.md
task2.1_create-api-endpoint.md
```

### Project Folders

```
# Project folder
my-project/

# Phase folder within project
phase-1-configuration-system/
phase-2-ai-documentation/
```

### File Path Examples

```
.kanban2code/
├── quick-fix.md                              # Simple standalone task
├── my-project/                               # Project folder
│   ├── phase-1-setup/                        # Phase 1
│   │   ├── task1.1_design.md
│   │   └── task1.2_implement.md
│   └── phase-2-features/                     # Phase 2
│       └── task2.1_add-feature.md
└── another-project/
    └── standalone-task.md                    # Task in project, no phase
```

---

## 9. Task Body Sections

### Required Sections

#### Title (H1)
The first H1 heading becomes the task title:
```markdown
# Implement User Authentication
```

#### Goal
What needs to be accomplished:
```markdown
## Goal

Add user authentication with email/password login and session management.
```

#### Acceptance Criteria
Checklist of requirements (use `- [ ]` for unchecked items):
```markdown
## Acceptance Criteria

- [ ] Users can register with email/password
- [ ] Users can log in with credentials
- [ ] Sessions persist across browser refreshes
- [ ] Invalid credentials show error message
```

### Recommended Sections

#### Background
Why this task exists:
```markdown
## Background

Users currently cannot save preferences because there's no authentication system.
```

#### Scope
What's in and out of scope:
```markdown
## Scope

**In scope:**
- Email/password authentication
- Session management

**Out of scope:**
- OAuth providers (future task)
- Two-factor authentication
```

#### Files to Modify/Create
List of affected files:
```markdown
## Files to Modify

- `src/auth/login.ts` - Add login handler
- `src/auth/session.ts` - Create session management

## Files to Create

- `src/auth/register.ts` - Registration handler
```

#### Testing Requirements
How to verify completion:
```markdown
## Testing Requirements

- Unit tests for auth handlers
- Integration test for login flow
- Manual testing of error states
```

#### Notes
Additional information:
```markdown
## Notes

Consider using bcrypt for password hashing. Reference: https://example.com/docs
```

---

## 10. Task Templates

### Available Template Types

When creating tasks, follow these patterns based on task type:

#### Bug Report
```markdown
---
stage: inbox
tags: [bug]
agent: codex
---

# Fix: [Brief description of bug]

## Goal

Fix the bug where [describe the buggy behavior].

## Background

**Current behavior:** [What happens now]
**Expected behavior:** [What should happen]
**Steps to reproduce:**
1. Step 1
2. Step 2

## Files to Modify

- `src/file.ts` - [What needs to change]

## Acceptance Criteria

- [ ] Bug no longer occurs
- [ ] Existing tests pass
- [ ] No regression in related functionality

## Testing Requirements

- Add test case for this bug
- Verify fix in development environment
```

#### Feature
```markdown
---
stage: inbox
tags: [feature]
agent: opus
---

# Add [Feature Name]

## Goal

Implement [feature] to allow users to [capability].

## Background

[Why this feature is needed]

## Scope

**In scope:**
- [Item 1]
- [Item 2]

**Out of scope:**
- [Item 3]

## Files to Create

- `src/features/new-feature.ts` - Main feature implementation

## Files to Modify

- `src/index.ts` - Add feature export

## Acceptance Criteria

- [ ] Feature works as described
- [ ] Unit tests added
- [ ] Documentation updated

## Testing Requirements

- Unit tests for new code
- Integration tests for feature flow
```

#### Refactor
```markdown
---
stage: inbox
tags: [refactor]
agent: codex
---

# Refactor [Component/Module]

## Goal

Improve code quality of [component] without changing behavior.

## Background

[Why refactoring is needed - technical debt, complexity, etc.]

## Scope

- [What will be refactored]
- [What will NOT be changed]

## Files to Modify

- `src/module.ts` - [Refactoring changes]

## Acceptance Criteria

- [ ] All existing tests pass
- [ ] No behavior changes
- [ ] Code follows project conventions
- [ ] Complexity reduced

## Testing Requirements

- Run existing test suite
- Manual smoke test of affected functionality
```

#### Spike/Research
```markdown
---
stage: inbox
tags: [spike]
agent: sonnet
---

# Spike: [Research Topic]

## Goal

Research and document findings on [topic].

## Background

[Why this research is needed]

## Questions to Answer

1. [Question 1]
2. [Question 2]
3. [Question 3]

## Scope

- [What to research]
- [What's out of scope]

## Deliverables

- [ ] Summary document with findings
- [ ] Recommendation for next steps
- [ ] Proof of concept (if applicable)

## Time Box

[Suggested time limit for research]

## Notes

[Resources, links, starting points]
```

#### Documentation
```markdown
---
stage: inbox
tags: [docs]
agent: sonnet
---

# Document [Topic]

## Goal

Create documentation for [topic].

## Background

[Why documentation is needed]

## Scope

- [What to document]
- [Target audience]

## Files to Create

- `docs/topic.md` - Main documentation file

## Acceptance Criteria

- [ ] Documentation is clear and complete
- [ ] Examples are included
- [ ] Follows documentation style guide

## Notes

[Reference materials, existing docs to update]
```

#### Test
```markdown
---
stage: inbox
tags: [test]
agent: codex
---

# Add Tests for [Component]

## Goal

Improve test coverage for [component].

## Background

[Current coverage status, why more tests needed]

## Scope

- [What to test]
- [What's already covered]

## Files to Create

- `tests/component.test.ts` - New test file

## Acceptance Criteria

- [ ] Coverage increased to [X]%
- [ ] All edge cases covered
- [ ] Tests are maintainable

## Testing Requirements

- Run `npm test` to verify all tests pass
- Check coverage report
```

#### UI Component
```markdown
---
stage: inbox
tags: [feature, ui, frontend]
agent: opus
---

# Create [Component Name] Component

## Goal

Build a reusable UI component for [purpose].

## Background

[Design requirements, user needs]

## Design Specifications

- [Visual requirements]
- [Interaction patterns]
- [Accessibility requirements]

## Files to Create

- `src/components/ComponentName.tsx` - Component implementation
- `src/components/ComponentName.css` - Styles

## Acceptance Criteria

- [ ] Matches design specifications
- [ ] Responsive across breakpoints
- [ ] Accessible (keyboard nav, screen readers)
- [ ] Props are well-typed

## Testing Requirements

- Visual testing
- Interaction testing
- Accessibility audit
```

#### Security Review
```markdown
---
stage: inbox
tags: [security, audit]
agent: codex
---

# Security Review: [Area]

## Goal

Audit [area] for security vulnerabilities.

## Background

[Why security review is needed]

## Review Scope

- [Files/components to review]
- [Types of vulnerabilities to check]

## Checklist

- [ ] Input validation
- [ ] Authentication/authorization
- [ ] Data sanitization
- [ ] Secure dependencies
- [ ] Sensitive data handling

## Acceptance Criteria

- [ ] All findings documented
- [ ] Critical issues addressed
- [ ] Recommendations provided

## Deliverables

- Security findings report
- Remediation recommendations
```

#### Design Task
```markdown
---
stage: inbox
tags: [design]
agent: opus
---

# Design [Feature/System]

## Goal

Create design for [feature/system].

## Background

[Context and requirements]

## Design Requirements

- [Requirement 1]
- [Requirement 2]

## Deliverables

- [ ] Architecture diagram
- [ ] API design
- [ ] Data model
- [ ] Implementation plan

## Acceptance Criteria

- [ ] Design addresses all requirements
- [ ] Trade-offs documented
- [ ] Approved by stakeholders
```

#### Roadmap
```markdown
---
stage: inbox
tags: [planning]
agent: opus
---

# Roadmap: [Project/Feature]

## Goal

Create implementation roadmap for [project/feature].

## Background

[Project context and goals]

## Phases

### Phase 1: [Name]
- Task 1.1: [Description]
- Task 1.2: [Description]

### Phase 2: [Name]
- Task 2.1: [Description]

## Dependencies

- [Dependency 1]
- [Dependency 2]

## Acceptance Criteria

- [ ] All phases defined
- [ ] Dependencies identified
- [ ] Tasks are appropriately sized
```

---

## 11. Good vs Bad Examples

### Good Example

```markdown
---
stage: code
tags: [feature, high, frontend, ui]
agent: opus
contexts: [design-system.md]
---

# Add Dark Mode Toggle to Settings

## Goal

Implement a toggle switch in the settings panel that allows users to switch between light and dark themes.

## Background

Users have requested dark mode support. The design system already defines dark theme colors.

## Scope

**In scope:**
- Toggle switch component
- Theme persistence in localStorage
- CSS variables for theme colors

**Out of scope:**
- System preference detection (future task)
- Per-component theme overrides

## Files to Modify

- `src/components/Settings.tsx` - Add toggle switch
- `src/styles/theme.css` - Add dark theme variables

## Files to Create

- `src/hooks/useTheme.ts` - Theme management hook

## Acceptance Criteria

- [ ] Toggle switch is visible in settings
- [ ] Clicking toggle switches theme immediately
- [ ] Theme persists across page refreshes
- [ ] All components respect theme colors

## Testing Requirements

- Unit test for useTheme hook
- Visual test for toggle component
- Manual test theme persistence

## Notes

Use CSS custom properties for theme switching. Reference: design-system.md
```

### Bad Example (with issues marked)

```markdown
---
stage: wip              # ❌ Invalid stage - should be 'code'
tags: dark-mode         # ❌ Tags should be an array: [feature, ui]
agent: claude           # ❌ Invalid agent - should be 'opus', 'codex', etc.
---

dark mode               # ❌ Missing H1 heading - should be "# Dark Mode"

add dark mode           # ❌ No Goal section

                        # ❌ No Acceptance Criteria
                        # ❌ No scope definition
                        # ❌ No files listed
```

### Common Mistakes to Avoid

1. **Invalid stage values**: Use only `inbox`, `plan`, `code`, `audit`, `completed`
2. **Tags as string instead of array**: Use `tags: [feature, ui]` not `tags: feature, ui`
3. **Missing H1 title**: Always start body with `# Task Title`
4. **No acceptance criteria**: Always include checkboxes for verification
5. **Vague scope**: Be specific about what's in and out of scope
6. **Missing agent**: Assign an appropriate agent for the task type
7. **Wrong agent for task type**: Match agent capabilities to task needs

---

## 12. Advanced Patterns

### Task Hierarchies (Parent-Child)

Use the `parent` field to create subtasks:

```yaml
# Parent task: epic-auth.md
---
stage: plan
tags: [feature, high]
---
# Epic: User Authentication

## Goal
Implement complete user authentication system.
```

```yaml
# Child task: auth-login.md
---
stage: inbox
parent: epic-auth
tags: [feature]
---
# Implement Login Form
```

### Phase Organization

Group related tasks in phase folders:

```
project/
├── phase-1-foundation/
│   ├── task1.1_setup.md
│   └── task1.2_config.md
├── phase-2-features/
│   ├── task2.1_feature-a.md
│   └── task2.2_feature-b.md
└── phase-3-polish/
    └── task3.1_cleanup.md
```

### Cross-References

Reference other tasks in the body:

```markdown
## Background

This task depends on the completion of `task1.2_config.md`.

## Related Tasks

- `auth-login.md` - Login implementation
- `auth-session.md` - Session management
```

### Batch Task Creation

When creating multiple related tasks, maintain consistent naming and numbering:

```
task1.1_design-api.md
task1.2_implement-endpoints.md
task1.3_add-tests.md
task1.4_document-api.md
```

---

## 13. Best Practices

### Task Granularity

- **Too large**: "Implement the entire application" - break down into phases
- **Too small**: "Add semicolon to line 42" - combine with related changes
- **Just right**: "Implement user login form with validation"

### Writing Acceptance Criteria

Good criteria are:
- **Specific**: "Login button is disabled when email is empty"
- **Testable**: Can be verified as pass/fail
- **Complete**: Cover all requirements

Bad criteria:
- **Vague**: "It works correctly"
- **Untestable**: "Code is well-written"
- **Incomplete**: Missing edge cases

### Context Management

- Create context files for knowledge that will be reused
- Update context files when significant decisions are made
- Reference relevant contexts in task frontmatter
- Keep context files focused and up-to-date

### Stage Transitions

- Move to `plan` only when ready to design
- Move to `code` only when design is complete
- Move to `audit` only when implementation is complete
- Move to `completed` only when acceptance criteria are met

---

## 14. Validation and Error Handling

### What the Extension Validates

1. **Frontmatter syntax**: Must be valid YAML
2. **Stage value**: Must be a valid stage name
3. **File location**: Must be in `.kanban2code/` directory

### What Defaults to Safe Values

- Invalid stage → defaults to `inbox`
- Missing tags → defaults to `[]`
- Missing contexts → defaults to `[]`
- Missing agent → no default (unassigned)

### Fixing Invalid Tasks

If a task fails to parse:
1. Check YAML syntax (proper indentation, quotes)
2. Verify stage is valid
3. Ensure tags/contexts are arrays
4. Check for special characters that need quoting

---

## Summary

1. **Create tasks** as markdown files with YAML frontmatter in `.kanban2code/`
2. **Use valid stages**: inbox, plan, code, audit, completed
3. **Assign appropriate agents**: opus for planning/UI, codex for backend, sonnet for quick tasks
4. **Tag tasks** for organization: type, priority, domain, component
5. **Reference contexts** for shared knowledge
6. **Follow naming conventions**: kebab-case, numbered tasks in phases
7. **Include required sections**: Title (H1), Goal, Acceptance Criteria
8. **Transition stages** as work progresses through the workflow
