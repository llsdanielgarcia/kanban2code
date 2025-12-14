---
stage: code
tags: [bug, p0, api]
agent: codex
contexts: [architecture]
created: 2025-12-14T00:00:00.000Z
---

# Fix duplicate item insertion

## Problem

The API allows inserting duplicates when requests are retried.

## Acceptance Criteria

- [ ] Duplicate insertions are rejected (idempotent insert)
- [ ] Tests cover retry behavior

