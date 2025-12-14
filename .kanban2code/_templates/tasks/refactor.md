---
name: Refactor
description: Improve internal structure without changing behavior; define invariants and safety checks.
icon: "\U0001F528"
default_stage: plan
default_tags: [refactor, p3]
---

# <TITLE>

## TASK_KIND
refactor

## RECOMMENDED_AGENT
codex

## REQUIRED_INPUT
- current_pain: <what is hard/bug-prone/slow>
- target_state: <what should be improved>
- invariants: <behavior that must not change>

## SCOPE_GUARDS
- no_behavior_change: true
- keep_public_api_stable: <true|false>

## ACCEPTANCE_CRITERIA
- [ ] invariants listed and preserved
- [ ] tests unchanged or extended to lock behavior
- [ ] complexity reduced (describe how)

