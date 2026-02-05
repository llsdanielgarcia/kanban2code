---
stage: inbox
agent: architect
created: 2026-02-05T00:45:00.000Z
tags: [feature, documentation, mvp]
contexts: [ai-guide]
parent: kanban2code-vnext
---

# Add Kanban2Claw Skill to Kanban2Code Distribution

## Goal
Package and distribute the `kanban2claw.md` skill file so OpenClaw users can orchestrate Kanban2Code agent pipelines programmatically.

## Background
Dan and Kodee developed a comprehensive orchestration skill (`kanban2claw.md`) that enables AI agents to manage the full Kanban2Code pipeline (planner → coder → auditor) while humans do other work. This skill needs to be:
1. Reviewed and refined
2. Added to the official Kanban2Code distribution
3. Documented for users

## Acceptance Criteria

- [ ] Review `kanban2claw.md` for accuracy and completeness
- [ ] Add skill to appropriate distribution location (suggested: `examples/skills/` or bundled in extension assets)
- [ ] Create minimal documentation on how to use the skill
- [ ] Ensure skill follows OpenClaw skill conventions (frontmatter, metadata, etc.)
- [ ] Add to release notes for next version

## Files to Modify

- `/home/cynicus/code/kanban2claw.md` → review location
- `examples/skills/kanban2claw.md` → distribution location (suggested)
- `README.md` → add mention of orchestration skill
- `docs/` → add skill usage documentation

## Notes

The skill file location: `/home/cynicus/code/kanban2claw.md`

Key features of the skill:
- Model assignment rules (plan→gpt-5.2, code→codex-medium, audit→codex-xhigh)
- Bounce tracking (max 2 rounds code↔audit)
- Golden rules (always include ai-guide.md, always assign agent)
- Complete orchestration command patterns
- Cost optimization guidance
