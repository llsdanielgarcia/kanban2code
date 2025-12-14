# Kanban2Code - Configuration & Templates Roadmap

## Overview

This roadmap covers the final phase of Kanban2Code development: creating a comprehensive configuration system, AI documentation, and default templates to reduce repetitive work across projects.

### Goals
- Create a centralized configuration system for agents, tags, and preferences
- Provide AI-readable documentation so AIs can create tasks directly
- Include batteries-included templates that users trim down rather than build up
- Minimize file proliferation while maintaining context continuity

### Agents Reference

| Agent | Primary Use | Secondary Use |
|-------|-------------|---------------|
| Opus | Planner, UI, Architecture | Auditor |
| Codex | API, Backend, Logic, Coding | Auditor (primary) |
| Sonnet | Quick tasks, Context creation, Roadmap reading | - |
| GLM | Task splitting, Simple context | Miscellaneous |
| Gemini | UI (alternative to Opus) | - |

### Stages
`inbox` → `plan` → `code` → `audit` → `completed`

---

## Phase 1: Configuration System

Create the central JSON configuration file that all templates and AI documentation reference.

### Task 1.1: Design Config Schema
- **Agent**: Opus
- **Tags**: [architecture, config, planning]
- **Description**: Design the JSON schema for `.kanban2code/config.json`
- **Requirements**:
  - Agent definitions (name, description, primary/secondary use cases)
  - Default tags taxonomy (type, priority, domain, component)
  - User preferences (file naming, test requirements, etc.)
  - Stage configurations (behavior, transitions)
  - Project metadata fields
- **Output**: Schema definition document

### Task 1.2: Implement Config File
- **Agent**: Codex
- **Tags**: [config, implementation]
- **Description**: Create the actual `config.json` file based on schema
- **Requirements**:
  - All 5 agents configured with descriptions
  - Tag categories defined
  - User preferences set (kebab-case, tests when needed)
  - Stage definitions
- **Output**: `.kanban2code/config.json`

### Task 1.3: Update Extension to Read Config
- **Agent**: Codex
- **Tags**: [extension, config, typescript]
- **Description**: Modify extension to load and use config.json
- **Requirements**:
  - Load config on extension activation
  - Fall back to defaults if config missing
  - Expose config values to relevant components
  - Support project-level overrides
- **Output**: Updated extension code

### Task 1.4: Audit Phase 1
- **Agent**: Codex
- **Tags**: [audit]
- **Description**: Review configuration system implementation
- **Requirements**:
  - Verify config loads correctly
  - Check fallback behavior
  - Validate schema completeness
  - Run tests
- **Output**: Update `audit-phase1.md`

---

## Phase 2: AI Documentation

Create comprehensive documentation that AIs read to understand how to work with Kanban2Code.

### Task 2.1: Create AI Guide Structure
- **Agent**: Opus
- **Tags**: [documentation, planning]
- **Description**: Plan the structure of the AI guide document
- **Requirements**:
  - How Kanban2Code works (brief overview)
  - File format specification
  - Frontmatter schema with all fields
  - Stage definitions and transitions
  - Context system explanation
  - User preferences and conventions
  - Examples of well-formed tasks
- **Output**: Outline document

### Task 2.2: Write AI Guide
- **Agent**: Opus
- **Tags**: [documentation, ai-guide]
- **Description**: Write the complete AI guide document
- **Requirements**:
  - Clear, parseable format for AIs
  - Reference config.json for agent definitions
  - Include file path conventions
  - Provide task creation examples
  - Document tag taxonomy
  - Explain context file update workflow
- **Output**: `.kanban2code/_context/ai-guide.md`

### Task 2.3: Create Task Examples
- **Agent**: Sonnet
- **Tags**: [documentation, examples]
- **Description**: Create example tasks that demonstrate proper formatting
- **Requirements**:
  - One example per task template type
  - Show frontmatter variations
  - Demonstrate context references
  - Include good and bad examples
- **Output**: Examples section in AI guide

### Task 2.4: Audit Phase 2
- **Agent**: Codex
- **Tags**: [audit]
- **Description**: Review AI documentation for completeness and accuracy
- **Requirements**:
  - Verify all fields documented
  - Check examples are valid
  - Test AI can parse and follow guide
  - Validate against actual extension behavior
- **Output**: Update `audit-phase2.md`

---

## Phase 3: Default Templates

Create all task templates that users can select from and customize.

### Task 3.1: Create Core Task Templates
- **Agent**: Opus
- **Tags**: [templates, tasks]
- **Description**: Create the 10 default task templates
- **Templates to create**:
  1. `bug-report.md` - Bug reporting with reproduction steps
  2. `feature.md` - Feature implementation task
  3. `refactor.md` - Code refactoring task
  4. `spike-research.md` - Research/investigation task
  5. `documentation.md` - Documentation task
  6. `test.md` - Test creation task
  7. `ui-component.md` - UI component implementation
  8. `security-review.md` - Security review task
  9. `design-task.md` - Design/architecture task
  10. `roadmap.md` - Roadmap creation meta-task
- **Requirements**:
  - Each template includes appropriate default tags
  - Agent recommendations based on config
  - Context placeholders
  - Test requirements where applicable
- **Output**: 10 files in `_templates/tasks/`

### Task 3.2: Create Agent Personality Definitions
- **Agent**: Opus
- **Tags**: [templates, agents, config]
- **Description**: Add agent personality definitions to config.json
- **Personalities to define**:
  1. Architect (Opus) - System design focus
  2. Frontend Developer (Opus/Gemini) - UI/UX focus
  3. Backend Developer (Codex) - Logic/data focus
  4. Auditor (Codex/Opus) - Code review focus
  5. Planner (Opus) - Task breakdown focus
  6. Context Builder (Sonnet/GLM) - Context creation focus
- **Requirements**:
  - Description of when to use each
  - Suggested prompts/instructions
  - Strengths and limitations
- **Output**: Updated `config.json` with personalities section

### Task 3.3: Create Meta-Task Templates
- **Agent**: Opus
- **Tags**: [templates, meta-tasks]
- **Description**: Create templates for tasks that generate other tasks
- **Templates to create**:
  1. `create-roadmap.md` - Generate project roadmap (with pre-questions)
  2. `split-phase.md` - Split phase into tasks with tests
  3. `audit-phase.md` - Audit phase and update audit file
- **Requirements**:
  - Clear instructions for AI on output format
  - Reference to AI guide for task creation
  - Include evaluation criteria where applicable
- **Output**: 3 files in `_templates/tasks/`

### Task 3.4: Audit Phase 3
- **Agent**: Codex
- **Tags**: [audit]
- **Description**: Review all templates for consistency and completeness
- **Requirements**:
  - Verify all templates follow same structure
  - Check agent recommendations are appropriate
  - Validate tags are consistent
  - Test template selection in extension
- **Output**: Update `audit-phase3.md`

---

## Phase 4: Context Structure

Create the minimal context file structure and templates.

### Task 4.1: Create Architecture Context Template
- **Agent**: Opus
- **Tags**: [context, architecture, templates]
- **Description**: Create template for project-level architecture context
- **Requirements**:
  - Project overview section
  - Technology stack
  - File structure explanation
  - Key patterns and conventions
  - Integration points
  - Placeholder sections with guidance
- **Output**: `_templates/context/architecture.md`

### Task 4.2: Create Phase Context Template
- **Agent**: Opus
- **Tags**: [context, phase, templates]
- **Description**: Create template for per-phase context files
- **Requirements**:
  - Phase objectives
  - Completed tasks summary
  - Current state of implementation
  - Pending decisions
  - Context for next tasks
  - Update instructions
- **Output**: `_templates/context/phase-context.md`

### Task 4.3: Create Audit File Template
- **Agent**: Codex
- **Tags**: [context, audit, templates]
- **Description**: Create template for `audit-phase#.md` files
- **Requirements**:
  - Phase summary
  - Tasks reviewed
  - Code quality evaluation (0-10 scale)
  - Test coverage status
  - Issues found
  - Recommendations
  - Sign-off section
- **Output**: `_templates/context/audit-phase.md`

### Task 4.4: Document Context Update Workflow
- **Agent**: Sonnet
- **Tags**: [documentation, context, workflow]
- **Description**: Add context update workflow to AI guide
- **Requirements**:
  - When to update architecture.md
  - When to update phase-context.md
  - When to create/update audit-phase#.md
  - Format for updates
  - Examples of good updates
- **Output**: Updated `ai-guide.md`

### Task 4.5: Audit Phase 4
- **Agent**: Codex
- **Tags**: [audit]
- **Description**: Review context structure and templates
- **Requirements**:
  - Verify templates are minimal but complete
  - Check workflow documentation is clear
  - Validate file naming conventions
  - Test context loading in extension
- **Output**: Update `audit-phase4.md`

---

## Phase 5: Integration & Testing

Ensure everything works together and test the complete workflow.

### Task 5.1: End-to-End Workflow Test
- **Agent**: Codex
- **Tags**: [testing, integration]
- **Description**: Test the complete workflow from config to task creation
- **Test scenarios**:
  1. Load config.json and verify values accessible
  2. Create task from template and verify frontmatter
  3. Have AI create task files and verify file watcher detects them
  4. Copy context and verify output format
  5. Move task through stages and verify behavior
- **Output**: Test results documentation

### Task 5.2: Create Example Project Structure
- **Agent**: Sonnet
- **Tags**: [examples, documentation]
- **Description**: Create an example project structure showing all pieces together
- **Requirements**:
  - Sample config.json with customizations
  - Sample architecture.md
  - Sample phase-context.md
  - Sample audit-phase1.md
  - 2-3 sample tasks in different stages
- **Output**: Example in documentation or separate folder

### Task 5.3: Update Extension README
- **Agent**: Sonnet
- **Tags**: [documentation]
- **Description**: Update main documentation to reflect new features
- **Requirements**:
  - Configuration system documentation
  - Template usage guide
  - Context file workflow
  - Quick start for new projects
- **Output**: Updated README or user guide

### Task 5.4: Final Audit
- **Agent**: Codex
- **Tags**: [audit, final]
- **Description**: Complete final audit of all phases
- **Requirements**:
  - Review all audit-phase#.md files
  - Verify all deliverables complete
  - Run full test suite
  - Check for any regressions
  - Final code quality evaluation
- **Output**: Update `audit-phase5.md` with final evaluation

---

## File Deliverables Summary

### Configuration
- `.kanban2code/config.json`

### AI Documentation
- `.kanban2code/_context/ai-guide.md`

### Task Templates (13 total)
- `_templates/tasks/bug-report.md`
- `_templates/tasks/feature.md`
- `_templates/tasks/refactor.md`
- `_templates/tasks/spike-research.md`
- `_templates/tasks/documentation.md`
- `_templates/tasks/test.md`
- `_templates/tasks/ui-component.md`
- `_templates/tasks/security-review.md`
- `_templates/tasks/design-task.md`
- `_templates/tasks/roadmap.md`
- `_templates/tasks/create-roadmap.md`
- `_templates/tasks/split-phase.md`
- `_templates/tasks/audit-phase.md`

### Context Templates (3 total)
- `_templates/context/architecture.md`
- `_templates/context/phase-context.md`
- `_templates/context/audit-phase.md`

### Audit Files (created during implementation)
- `.kanban2code/_context/audit-phase1.md`
- `.kanban2code/_context/audit-phase2.md`
- `.kanban2code/_context/audit-phase3.md`
- `.kanban2code/_context/audit-phase4.md`
- `.kanban2code/_context/audit-phase5.md`

---

## Success Criteria

1. **Config loads correctly** - Extension reads config.json and applies values
2. **AI can create tasks** - AI reads ai-guide.md and creates valid task files
3. **Templates are comprehensive** - Cover all common task types
4. **Context flow works** - Context files update and provide continuity
5. **Minimal file proliferation** - Only necessary files are created
6. **Workflow is documented** - Clear instructions for AI and human users

---

## Notes

- All file names use kebab-case
- Tests are included when task requires them
- Context files are updated after task completion
- Audit files track progress and quality per phase
- UI-first development workflow is the default assumption
