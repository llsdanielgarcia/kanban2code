---
name: Bug Report
description: Report a defect with repro, expected vs actual, and fix criteria.
icon: "\U0001F41B"
default_stage: inbox
default_tags: [bug, p1]
---

# <TITLE>

## TASK_KIND
bug

## RECOMMENDED_AGENT
codex

## REQUIRED_INPUT
- environment: <os|vscode-version|extension-version>
- where_seen: <ui|command|file-watcher|parser|other>
- repro_steps: <numbered list>
- expected: <1-3 sentences>
- actual: <1-3 sentences>
- logs_or_errors: <paste excerpt or "none">

## SCOPE
- fix_root_cause: true
- avoid_unrelated_changes: true

## ACCEPTANCE_CRITERIA
- [ ] repro is deterministic (or documented as flaky)
- [ ] fix implemented with minimal surface area
- [ ] tests added or updated (if applicable)
- [ ] no regression in existing tests

## OUTPUT_FORMAT
- code_changes: <list>
- tests: <list>
- notes: <edge cases, follow-ups>

