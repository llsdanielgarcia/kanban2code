---
stage: code
tags: [feature, p1]
agent: coder
contexts: [skills/react-core-skills]
---

# ModePicker component + update AgentPicker

## Goal
Create ModePicker component and update AgentPicker to show LLM providers.

## Definition of Done
- [ ] `ModePicker.tsx` — dropdown of available modes, shows name+description, "Create new mode" link at bottom
- [ ] `AgentPicker.tsx` — now shows LLM providers (opus, codex, kimi, glm) instead of behavior roles, label changed to "Agent (LLM Provider)"
- [ ] Both follow existing picker visual patterns

## Files
- `src/webview/ui/components/ModePicker.tsx` - create - mode selection dropdown
- `src/webview/ui/components/AgentPicker.tsx` - modify - show LLM providers

## Tests
- [ ] ModePicker renders mode list and fires `onChange` callback
- [ ] AgentPicker shows LLM provider descriptions
- [ ] Both pickers include "No selection" option

## Context
The AgentPicker now shows LLM providers (opus, codex, kimi, glm) instead of behavioral roles. The ModePicker is a new component for selecting behavioral roles (coder, auditor, planner, etc.).

Both follow existing picker visual patterns for consistency.
