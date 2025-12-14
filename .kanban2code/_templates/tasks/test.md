---
name: Test
description: Add or improve tests; define the behavior under test and failure modes.
icon: "\u2705"
default_stage: code
default_tags: [test, p1]
---

# <TITLE>

## TASK_KIND
test

## RECOMMENDED_AGENT
codex

## REQUIRED_INPUT
- target_behavior: <what should be true>
- where: <unit|integration|e2e>
- expected_failures: <what should fail before fix>

## ACCEPTANCE_CRITERIA
- [ ] tests fail before the change (if applicable)
- [ ] tests pass after the change
- [ ] covers at least one edge case

