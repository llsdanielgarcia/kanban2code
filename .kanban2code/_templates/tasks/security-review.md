---
name: Security Review
description: Threat-model and validate security properties; produce actionable fixes or mitigations.
icon: "\U0001F512"
default_stage: audit
default_tags: [security, p1]
---

# <TITLE>

## TASK_KIND
security

## RECOMMENDED_AGENT
codex

## REQUIRED_INPUT
- surface: <paths|inputs|storage|network>
- threats: <list>
- assumptions: <list>

## REVIEW_CHECKLIST
- [ ] input validation & encoding
- [ ] path traversal / injection checks
- [ ] least privilege / access boundaries
- [ ] error handling does not leak secrets

## OUTPUT_FORMAT
- findings: <bullets>
- fixes: <bullets with file paths>
- residual_risks: <bullets>

