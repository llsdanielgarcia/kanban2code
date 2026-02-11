---
stage: code
tags: [feature, p1]
agent: coder
contexts: [skills/react-core-skills]
---

# Update context menu for mode and runner actions

## Goal
Add runner and mode/agent actions to task context menu.

## Definition of Done
- [ ] "Run Task" action added — disabled if runner is active or task is inbox/completed
- [ ] "Change Mode" submenu listing available modes (same pattern as existing "Change Stage" submenu)
- [ ] "Change Agent" submenu for changing LLM provider

## Files
- `src/webview/ui/components/TaskContextMenu.tsx` - modify - add runner and mode/agent actions

## Tests
- [ ] "Run Task" appears for plan/code/audit tasks
- [ ] "Run Task" disabled when runner is active
- [ ] "Change Mode" submenu lists all available modes
- [ ] "Change Agent" submenu lists all available LLM providers

## Context
The task context menu needs new actions for runner and mode/agent management. "Run Task" is disabled when runner is already active.

"Change Mode" and "Change Agent" submenus follow the same pattern as existing "Change Stage" submenu.
