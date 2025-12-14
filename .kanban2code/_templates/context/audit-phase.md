---
name: Phase Audit
description: Quality gate for a phase: review results, issues, recommendations, and sign-off.
icon: "\ud83d\udd0e"
---

# Phase <N> Audit: <PHASE_NAME>

**Audit Date:** <YYYY-MM-DD>  
**Scope:** <what was audited>  
**Status:** <Draft|Complete>

## PHASE_SUMMARY
- intent: <what the phase aimed to accomplish>
- delivered: <what actually shipped/changed>

## TASKS_REVIEWED
| Task | Status | Notes |
|------|--------|-------|
| <id/path> | <Complete|Partial|N/A> | <1-line> |

## CODE_QUALITY_EVALUATION
**Score (0-10):** <N>/10

Reasons (short):
- <reason>
- <reason>

## TEST_COVERAGE_STATUS
- unit: <pass/fail/na> | notes: <...>
- integration: <pass/fail/na> | notes: <...>
- e2e/manual: <pass/fail/na> | notes: <...>

## ISSUES_FOUND
- <issue>: severity: <low|med|high> | location: <file/area> | follow_up: <task_id?>

## RECOMMENDATIONS
- <actionable recommendation>

## SIGN_OFF
- [ ] Acceptance criteria met
- [ ] No known high-severity issues remain (or tracked)
- [ ] Ready for next phase

