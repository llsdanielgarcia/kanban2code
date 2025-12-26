---
stage: completed
agent: conversational
tags: []
contexts:
  - architecture
  - ai-guide
---

# Delete some agents

I need to delete some agents that are redudant or not use, and I need to rename them in a way that make my live asier. I want an emoji for example 02-🏛️Architect, so I know the appropiate order to use them.

## Refined Prompt

**Goal:** Clean up redundant agents and rename remaining agents with emojis and numbers for better organization and workflow clarity.

**Context:**
- Currently have 11 agents in `.kanban2code/_agents/`
- Some are duplicates (e.g., `roadmap-splitter.md` vs `splitter.md`)
- Want emoji prefixes and numbering (e.g., `02-🏛️architect.md`) to show the proper order of use

**Actions:**
- Delete redundant agents: `roadmap-splitter.md` ✓, `code-reviewer.md` ✓, `react-dev.md` ✓, `context-agent.md` ✓
- Rename agents with emoji + number prefix showing workflow order ✓

**Final agent list:**
- `01-🗺️roadmapper.md` - Orchestration
- `02-🏛️architect.md` - Orchestration
- `03-✂️splitter.md` - Orchestration
- `04-📋planner.md` - Execution
- `05-⚙️coder.md` - Execution
- `06-✅auditor.md` - Execution
- `07-💬conversational.md` - Specialized

**Workflow order:**
- Orchestration: roadmapper → architect → splitter
- Execution: planner → coder → auditor
- Specialized: conversational, context-agent, react-dev

**Output:**
- Clean agent directory with no duplicates
- Renamed files following pattern: `##-emoji-name.md`
- Clear visual indication of agent workflow sequence 
