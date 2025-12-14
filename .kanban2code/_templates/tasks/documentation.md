---
name: Documentation
description: Create or update docs with explicit audience, scope, and verification steps.
icon: "\U0001F4D6"
default_stage: code
default_tags: [docs, p2]
---

# <TITLE>

## TASK_KIND
docs

## RECOMMENDED_AGENT
opus

## REQUIRED_INPUT
- audience: <ai|developer|user>
- doc_location: <file path(s)>
- scope: <what to add/change>

## ACCEPTANCE_CRITERIA
- [ ] docs match current behavior/code
- [ ] examples are copy/paste correct
- [ ] terminology consistent across docs

