---
stage: inbox
tags: [templates, tasks]
agent: opus
contexts: []
---

# Task 3.1: Create Core Task Templates

## Goal

Create the 10 default task templates that users can select from and customize for their projects.

## Background

Users need starting templates for common task types. These templates should follow best practices and include appropriate defaults.

## Scope

Create 10 core task templates:
1. `bug-report.md` - Bug reporting with reproduction steps
2. `feature.md` - Feature implementation task
3. `refactor.md` - Code refactoring task
4. `spike-research.md` - Research/investigation task
5. `documentation.md` - Documentation task
6. `test.md` - Test creation task
7. `ui-component.md` - UI component implementation
8. `security-review.md` - Security review task
9. `design-task.md` - Design/architecture task
10. `roadmap.md` - Roadmap creation meta-task

## Files to Create

- `_templates/tasks/bug-report.md`
- `_templates/tasks/feature.md`
- `_templates/tasks/refactor.md`
- `_templates/tasks/spike-research.md`
- `_templates/tasks/documentation.md`
- `_templates/tasks/test.md`
- `_templates/tasks/ui-component.md`
- `_templates/tasks/security-review.md`
- `_templates/tasks/design-task.md`
- `_templates/tasks/roadmap.md`

## Acceptance Criteria

- [ ] All 10 templates are created
- [ ] Each template includes appropriate default tags
- [ ] Agent recommendations are based on config.json
- [ ] Context placeholders are included where needed
- [ ] Test requirements are specified where applicable
- [ ] Templates follow consistent structure

## Testing Requirements

Verify each template is valid and can be used to create tasks.

## Notes

Templates should be comprehensive yet flexible, allowing users to easily customize them for their specific needs.