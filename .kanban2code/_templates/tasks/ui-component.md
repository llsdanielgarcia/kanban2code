---
name: UI Component
description: Implement or modify UI with clear UX behavior and accessibility requirements.
icon: "\U0001F5BC\uFE0F"
default_stage: plan
default_tags: [feature, p2, accessibility]
---

# <TITLE>

## TASK_KIND
ui

## RECOMMENDED_AGENT
opus

## REQUIRED_INPUT
- user_interaction: <what user does>
- states: <loading|empty|error|success>
- accessibility: <keyboard|aria|contrast>

## ACCEPTANCE_CRITERIA
- [ ] keyboard navigation works
- [ ] labels/aria roles correct
- [ ] visual states defined for all cases

