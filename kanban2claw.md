---
name: kanban2claw
description: Orchestrate Kanban2Code agent pipeline via OpenClaw — manage planner/coder/auditor workflow with proper model selection, reasoning levels, and bounce tracking.
metadata:
  openclaw:
    emoji: 🦞
    requires:
      anyBins: [codex, claude, opencode]
---

# Kanban2Claw

**Definition of Done**: This skill enables fully autonomous orchestration of Kanban2Code tasks where a human creates a task, disappears for hours, and returns to a completed, audited task. The orchestrator (you) handles all agent spawning, stage transitions, bounce tracking, and error recovery without human intervention except for blockers.

## Quick Reference

| Stage | Agent | Model | Spawn Command |
|-------|-------|-------|---------------|
| inbox→plan | planner | PLAN_MODEL | `codex exec "..."` |
| plan→code | coder | CODE_MODEL | `codex --config model_reasoning_effort="medium" exec "..."` |
| code→audit | auditor | AUDIT_MODEL | `codex --config model_reasoning_effort="high" exec "..."` |

**Golden Rules:**
1. Always include ai-guide.md
2. Always assign agent
3. Max 2 bounces then STOP
4. Verify frontmatter after each spawn

## Constants

### Models

| Alias | Model ID | Reasoning | Usage |
|-------|----------|-----------|-------|
| PLAN_MODEL | gpt-5.2 | default | Planner stage |
| CODE_MODEL | gpt-5.3-codex | medium | Coder stage |
| AUDIT_MODEL | gpt-5.3-codex | high | Auditor stage |

### Limits

| Parameter | Value | Action on Exceed |
|-----------|-------|------------------|
| Max bounces | 2 | STOP, notify human |
| Spawn timeout | 5 min | Check status, respawn if needed |
| File write retry | 3 attempts, 10s delay | Log error, skip task |

### Paths (Use $WORKSPACE placeholder)

| Variable | Example | Description |
|----------|---------|-------------|
| $WORKSPACE | /home/cynicus/code/emailproject | Project root |
| $KANBAN | $WORKSPACE/.kanban2code | Kanban2Code directory |
| $AGENTS | $KANBAN/_agents | Agent definitions |
| $CONTEXT | $KANBAN/_context | Context files |
| $INBOX | $KANBAN/inbox | Inbox tasks |
| $PROJECTS | $KANBAN/projects | Project tasks |
| $TASK_PATH | $INBOX/add-login-form.md | Full path to current task file |

### Required Context Files

| File | Purpose | Always Include |
|------|---------|----------------|
| ai-guide.md | Tells agents to edit files, not just suggest | YES |
| _agents/{agent}.md | Role definition, rules, output format | YES |

### Optional Context Files

| File | Purpose | Include When |
|------|---------|--------------|
| how-it-works.md | Global workspace conventions | If task involves new agent setup or unfamiliar codebase |
| architecture.md | System architecture overview | If task affects architecture |
| project-details.md | Project metadata | If agent needs project context |
| skills/*.md | Framework-specific patterns | If task involves React/Python/etc |

## State Transitions

| From | To | Trigger | Action | Verification |
|------|----|---------|--------|--------------|
| inbox | plan | Task exists, agent: planner | Spawn planner with PLAN_MODEL | Frontmatter shows stage: plan |
| plan | code | Refined Prompt section exists | Spawn coder with CODE_MODEL | Frontmatter shows stage: code, agent: coder |
| code | audit | Audit section exists | Spawn auditor with AUDIT_MODEL | Frontmatter shows stage: audit, agent: auditor |
| audit | completed | rating ≥ 8 | Update architecture.md, archive task | Frontmatter shows stage: completed |
| audit | code | rating < 8, bounces < 2 | Increment bounces, spawn coder with CODE_MODEL | Frontmatter shows stage: code, bounces: N+1 |
| audit | BLOCKED | rating < 8, bounces ≥ 2 | STOP, notify human | Human intervention required |

## Pre-Spawn Checklist

Before spawning any agent, verify:

- [ ] Task file exists at expected path
- [ ] Task file has valid YAML frontmatter (parses without errors)
- [ ] stage: matches expected current stage for this transition
- [ ] agent: is assigned (planner | coder | auditor)
- [ ] ai-guide.md exists at $KANBAN/_context/ai-guide.md
- [ ] Agent definition file exists at $AGENTS/{agent}.md
- [ ] For code/audit stages: bounces < 2 (check frontmatter bounces: field)
- [ ] For audit stage: Audit section exists in task file

## Prompt Templates

### SPAWN_PLANNER

```
You're planner. Read these files in order:
1. $AGENTS/planner.md
2. $CONTEXT/ai-guide.md
3. $TASK_PATH

Follow the rules in those files and update the task file when done.
You may run shell commands to explore the codebase.
Only output: edit the task file. No chat responses.
```

### SPAWN_CODER

```
You're coder. Read these files in order:
1. $AGENTS/coder.md
2. $CONTEXT/ai-guide.md
3. $TASK_PATH

Follow the rules in those files and update the task file when done.
You may run shell commands to build, test, and verify.
Only output: edit the task file. No chat responses.
```

### SPAWN_AUDITOR

```
You're auditor. Read these files in order:
1. $AGENTS/auditor.md
2. $CONTEXT/ai-guide.md
3. $TASK_PATH

Follow the rules in those files and update the task file when done.
You may run shell commands to verify implementation.
Only output: edit the task file. No chat responses.
If rating ≥ 8, also update $CONTEXT/architecture.md with new files.
```

### CLI Commands

| Stage | Command |
|-------|---------|
| Plan | `codex exec "SPAWN_PLANNER content"` |
| Code | `codex --config model_reasoning_effort="medium" exec "SPAWN_CODER content"` |
| Audit | `codex --config model_reasoning_effort="high" exec "SPAWN_AUDITOR content"` |

## Expected Outputs

### After Planner Completes

**Frontmatter changes:**
```yaml
stage: code
agent: coder
contexts: [ai-guide, skills/react-core-skills]  # updated with relevant skills
```

**New sections appended:**
- `## Refined Prompt` with Objective, Implementation approach, Key decisions, Edge cases
- `## Context` with Relevant Code, Patterns, Test Patterns, Dependencies, Gotchas

### After Coder Completes

**Frontmatter changes:**
```yaml
stage: audit
agent: auditor
```

**New section appended:**
- `## Audit` with list of modified files (one per line)

**Side effects:**
- Code files modified/created
- Tests written
- Build passes (verified by coder before stage change)

### After Auditor Completes (ACCEPTED)

**Conditions:** rating ≥ 8

**Frontmatter changes:**
```yaml
stage: completed
agent: auditor
```

**New section appended:**
- `## Review` with Rating: N/10, Verdict: ACCEPTED, Summary, Findings, Test Assessment

**Side effects:**
- architecture.md updated with new files (per auditor.md rules)
- Task complete

### After Auditor Completes (NEEDS WORK)

**Conditions:** rating < 8, bounces < 2

**Frontmatter changes:**
```yaml
stage: code
agent: coder
bounces: N+1
```

**New section appended:**
- `## Review` with Rating: N/10, Verdict: NEEDS WORK, Findings (Blockers, High/Medium/Low priority)

## Error Handling

| Error | Detection | Recovery | Escalation |
|-------|-----------|----------|------------|
| Agent didn't update frontmatter | stage unchanged after 5 min | Respawn same agent once | If 2nd fail: notify human |
| Agent crashed | exit code ≠ 0 or process killed | Retry once with same config | If retry fails: notify human |
| File locked/write fails | write operation fails | Wait 10s, retry (3 attempts) | If all fail: skip task, log error |
| Invalid stage in file | stage not in [inbox,plan,code,audit,completed] | Log error, skip task | Manual cleanup needed |
| Missing ai-guide.md | File not found at $CONTEXT/ai-guide.md | Log error, skip task | Fix workspace setup |
| Missing agent definition | $AGENTS/{agent}.md not found | Log error, skip task | Fix agent assignment |
| Bounce limit reached | bounces ≥ 2 and rating < 8 | STOP pipeline | Notify human immediately |
| xhigh reasoning fails | Model error or timeout | Retry with AUDIT_FALLBACK (high) | If still fails: notify human |

## Task File Structure

### Minimal Example Task

```yaml
---
stage: inbox
agent: planner
created: 2026-02-05T00:00:00.000Z
tags: [feature, p1, mvp]
contexts: [ai-guide, skills/react-core-skills]
---

# Add login form component

Create a React login form with email/password fields and validation.

## Definition of Done
- [ ] Form component in components/LoginForm.tsx
- [ ] Email validation regex
- [ ] Password min 8 chars validation
- [ ] Unit tests with React Testing Library
- [ ] Storybook story
```

### After Full Pipeline

```yaml
---
stage: completed
agent: auditor
created: 2026-02-05T00:00:00.000Z
tags: [feature, p1, mvp]
contexts: [ai-guide, skills/react-core-skills]
---

# Add login form component

Create a React login form with email/password fields and validation.

## Definition of Done
- [x] Form component in components/LoginForm.tsx
- [x] Email validation regex
- [x] Password min 8 chars validation
- [x] Unit tests with React Testing Library
- [x] Storybook story

## Refined Prompt
Objective: Implement LoginForm React component with validation
Implementation approach:
1. Create component with useState for form state
2. Add validation functions
3. Write tests covering valid/invalid inputs
Key decisions:
- Use controlled components: simpler validation logic
- Validation on blur: better UX than onChange
Edge cases:
- Empty submit attempt
- Special characters in email
- Unicode passwords

## Context
### Relevant Code
- components/Button.tsx:45 - use existing Button component
- utils/validation.ts:12 - email regex pattern available

### Patterns to Follow
- React hooks pattern from existing components
- Form accessibility (labels, aria-invalid)

### Test Patterns
- src/components/__tests__/ - co-located tests
- Use render, screen, fireEvent from RTL

### Dependencies
- React: useState, useCallback
- No external form libraries (keep it simple)

### Gotchas
- validation.ts email regex is strict: test with user@example.com

## Skills System
Added skills/react-core-skills to contexts for React patterns.

## Audit
- components/LoginForm.tsx
- components/__tests__/LoginForm.test.tsx
- stories/LoginForm.stories.tsx
- utils/validation.ts (enhanced email regex)

## Review

**Rating: 9/10**

**Verdict: ACCEPTED**

### Summary
Clean implementation following project conventions. Tests cover edge cases. Good accessibility.

### Findings

#### Blockers
None

#### High Priority
None

#### Medium Priority
- Consider adding loading state for async submit (future enhancement)

#### Low Priority / Nits
- Button could use loading spinner prop

### Test Assessment
- Coverage: Adequate (valid, invalid, empty cases)
- Missing tests: None critical

### What's Good
- Accessible form with proper labels
- Clean separation of validation logic
- Co-located tests follow project pattern

### Recommendations
- Add loading state when connecting to auth API
```

## Workflow Orchestration

### Step 1: Scan for Ready Tasks

> **Note**: These bash examples illustrate the logic. Orchestrators may use native file APIs instead of shelling out.

```bash
# Find tasks in inbox with agent assigned
find $INBOX -name "*.md" -exec grep -l "stage: inbox" {} \; | xargs grep -l "agent:"

# Find tasks in plan ready for coder (have Refined Prompt)
find $KANBAN -name "*.md" -path "*/inbox/*" -o -path "*/projects/*" | xargs grep -l "stage: plan" | while read f; do
  if grep -q "## Refined Prompt" "$f"; then echo "$f"; fi
done

# Find tasks in code ready for auditor (have Audit section)
find $KANBAN -name "*.md" | xargs grep -l "stage: code" | while read f; do
  if grep -q "## Audit" "$f"; then echo "$f"; fi
done
```

### Step 2: Validate and Spawn

For each found task:
1. Run Pre-Spawn Checklist
2. Determine correct agent and model from State Transitions table
3. Substitute $WORKSPACE, $KANBAN, $AGENTS, $CONTEXT, $TASK_PATH in prompt template
4. Spawn agent with CLI command
5. Record spawn time for timeout tracking

### Step 3: Monitor

- Poll file every 30s for frontmatter changes
- Check `stage:` field for transition
- If stage unchanged after 5 min: check agent status
- If agent exited: check exit code, apply Error Handling rules

### Step 4: Progress or Handle Error

- Success: Move to next stage per State Transitions
- Failure: Apply Error Handling recovery
- Bounce limit: STOP, notify human

## Design Notes (For Humans)

### Why 2 Bounce Maximum?

Prevents runaway costs and infinite loops. If a task fails audit twice, there's a fundamental misunderstanding or complexity that requires human judgment. Third+ attempts rarely succeed without intervention.

### Cost Estimates

| Stage | Model | Est. Cost per run | Typical runs per task |
|-------|-------|-------------------|----------------------|
| Plan | gpt-5.2 | $0.02-0.05 | 1 |
| Code | codex-medium | $0.10-0.50 | 1-2 |
| Audit | codex-xhigh | $0.20-1.00 | 1-2 |
| **Total typical** | | **$0.30-1.55** | 3-4 runs |
| **With 1 bounce** | | **$0.50-2.00** | 5 runs |
| **With 2 bounces** | | **$0.70-3.00** | 6 runs (max) |

### Why These Models?

- **gpt-5.2 (base) for planning**: Fast, cheap, good at analysis and context gathering
- **codex-medium for coding**: Balanced reasoning, cost-effective for implementation
- **codex-xhigh for audit**: Maximum thoroughness for quality gate

### Bounce Tracking Location

Store in task frontmatter:
```yaml
bounces: 1
last_audit_reasoning: xhigh
```

Why frontmatter? It's version controlled, human-readable, and persists with the task file.

### Context Layer Priority

When building prompts, include in this order:
1. ai-guide.md (always first — sets ground rules)
2. Agent definition (role-specific rules)
3. Task content (the work to do)
4. Skills (if added by planner)

### Common Failure Cases to Watch

1. **Missing ## Audit list**: Coder didn't list files, auditor can't review
2. **Missing stage update**: Agent finished work but didn't change frontmatter
3. **Wrong model**: Used gpt-5.2 for code (too cheap) or codex-xhigh for plan (wasteful)
4. **No ai-guide.md**: Agent suggests changes instead of editing files
5. **Bounce loop**: Task bouncing 3+ times without human intervention

---

**Version**: 2.0 (Post-Audit Refactor)
**Created**: 2026-02-05
**Audited By**: Dan (human architect)
**Status**: Production Ready
