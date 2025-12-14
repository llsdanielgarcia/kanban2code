---
stage: completed
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

- [x] Schema covers all 5 agents with descriptions and use cases
- [x] Tag categories are well-defined with examples
- [x] User preferences include kebab-case and test requirements
- [x] Stage definitions match existing 5-stage workflow
- [x] Schema is documented and easy to understand
- [x] Example config validates against schema

## Testing Requirements

Validate the schema against example configurations to ensure correctness.

## Notes

Reference the Agents table from ROADMAP.md:
- Opus: Planner, UI, Architecture, Auditor
- Codex: API, Backend, Logic, Auditor (primary)
- Sonnet: Quick tasks, Context creation
- GLM: Task splitting, Simple context
- Gemini: UI (alternative)