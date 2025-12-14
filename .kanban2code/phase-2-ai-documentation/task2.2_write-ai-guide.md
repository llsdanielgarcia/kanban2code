---
stage: inbox
tags: [documentation, ai-guide]
agent: opus
contexts: []
---

# Task 2.2: Write AI Guide

## Goal

Write the complete AI guide document that AIs can read to understand how to work with Kanban2Code.

## Background

Based on the structure from Task 2.1, we need to create the comprehensive AI guide that will serve as the primary documentation for AI agents.

## Scope

- Write clear, parseable documentation for AIs
- Reference config.json for agent definitions
- Include file path conventions
- Provide task creation examples
- Document tag taxonomy
- Explain context file update workflow
- Include best practices and common patterns

## Files to Create

- `.kanban2code/_context/ai-guide.md` - Complete AI guide document

## Acceptance Criteria

- [ ] Guide is written in clear, AI-parseable format
- [ ] All agent definitions from config.json are referenced
- [ ] File naming conventions are clearly documented
- [ ] Task creation examples are provided
- [ ] Tag taxonomy is explained with examples
- [ ] Context update workflow is documented
- [ ] Frontmatter schema is fully documented

## Testing Requirements

Verify that an AI can read and understand the guide to create valid task files.

## Notes

This guide will be the primary reference for AIs creating tasks in Kanban2Code, so it must be comprehensive and unambiguous.