# Kanban2Code AI Guide - Outline

This document outlines the structure of the comprehensive AI guide for working with Kanban2Code.

## Document Structure

### 1. Introduction

- **Purpose**: What this guide is for
- **Target Audience**: AI agents (Claude, GPT, Gemini, GLM, etc.)
- **Quick Start**: Minimal steps to create a task

### 2. System Overview

- **What is Kanban2Code?**: Brief description
- **Core Concepts**: Tasks, stages, agents, tags, contexts
- **File Structure**: Where things live in `.kanban2code/`

### 3. File Format Specification

- **Task Files**: Markdown files with YAML frontmatter
- **Frontmatter Schema**: All fields documented
- **Markdown Body Structure**: Sections and conventions

### 4. Frontmatter Reference

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| stage | string | Yes | Workflow stage |
| tags | string[] | No | Task categorization |
| agent | string | No | Assigned AI agent |
| contexts | string[] | No | Referenced context files |
| parent | string | No | Parent task ID |
| order | number | No | Sort order within stage |
| created | string | No | ISO date of creation |

### 5. Stage Definitions and Workflow

- **inbox**: New tasks awaiting triage
- **plan**: Tasks being planned/designed
- **code**: Tasks in active development
- **audit**: Tasks under review
- **completed**: Finished tasks
- **Transition Rules**: What transitions are allowed

### 6. Agent System

- **Available Agents**: opus, codex, sonnet, glm, gemini
- **Agent Capabilities**: When to use each agent
- **Agent Selection**: Guidelines for choosing agents

### 7. Tag Taxonomy

- **Type Tags**: feature, bug, refactor, spike, docs, test, design, security, config, audit
- **Priority Tags**: critical, high, medium, low
- **Domain Tags**: frontend, backend, api, database, infra, devops, ui, ux
- **Component Tags**: core, auth, ui, utils, services, types, config, extension, webview

### 8. Context System

- **What are Contexts?**: Shared knowledge files
- **Context File Location**: `.kanban2code/_context/`
- **Referencing Contexts**: Using the `contexts` frontmatter field
- **Context Update Workflow**: When and how to update context files

### 9. Task Body Structure

- **Title**: H1 heading as task title
- **Goal Section**: What needs to be accomplished
- **Background Section**: Why this task exists
- **Scope Section**: What's in/out of scope
- **Files to Modify/Create**: Affected files
- **Acceptance Criteria**: Checklist of requirements
- **Testing Requirements**: How to verify completion
- **Notes**: Additional information

### 10. File Naming Conventions

- **Task Files**: `kebab-case.md`
- **Project Folders**: `project-name/`
- **Phase Folders**: `phase-X-description/`
- **Numbered Tasks**: `taskX.Y_description.md`

### 11. Task Examples

Examples for each template type:
- Bug Report
- Feature
- Refactor
- Spike/Research
- Documentation
- Test
- UI Component
- Security Review
- Design Task
- Roadmap

### 12. Good vs Bad Examples

- **Good Examples**: Properly formatted tasks
- **Bad Examples**: Common mistakes to avoid
- **Anti-patterns**: What not to do

### 13. Advanced Patterns

- **Task Hierarchies**: Parent-child relationships
- **Phase Organization**: Grouping related tasks
- **Cross-References**: Linking between tasks
- **Batch Operations**: Creating multiple tasks

### 14. Best Practices

- **Task Granularity**: How to size tasks
- **Clear Acceptance Criteria**: How to write them
- **Context Management**: When to create/update contexts
- **Stage Transitions**: When to move tasks

### 15. Troubleshooting

- **Common Errors**: Invalid frontmatter, bad stage values
- **Validation**: How the extension validates tasks
- **Recovery**: How to fix broken tasks

---

## Implementation Notes

The AI guide should:
1. Be parseable by AI systems (clear structure, consistent formatting)
2. Be readable by humans (for debugging and reference)
3. Include complete examples (not fragments)
4. Reference config.json for dynamic values
5. Stay synchronized with the actual extension behavior
