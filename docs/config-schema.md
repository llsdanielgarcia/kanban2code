# Kanban2Code Configuration Schema

This document defines the JSON schema for `.kanban2code/config.json`, the central configuration file for Kanban2Code.

## Overview

The configuration file provides:
- Agent definitions with use cases
- Tag taxonomies for task categorization
- Stage configurations and workflow rules
- User preferences for file naming and conventions
- Project metadata fields

## Schema Structure

```json
{
  "$schema": "https://json-schema.org/draft-07/schema#",
  "type": "object",
  "properties": {
    "version": { "type": "string" },
    "project": { "type": "object" },
    "agents": { "type": "object" },
    "tags": { "type": "object" },
    "stages": { "type": "object" },
    "preferences": { "type": "object" },
    "personalities": { "type": "object" }
  }
}
```

---

## Field Definitions

### version

Configuration file version for compatibility checking.

| Property | Type | Required | Default |
|----------|------|----------|---------|
| version | string | Yes | "1.0.0" |

---

### project

Project metadata and identification.

| Property | Type | Required | Description |
|----------|------|----------|-------------|
| name | string | Yes | Project display name |
| description | string | No | Brief project description |
| repository | string | No | Repository URL |

**Example:**
```json
{
  "project": {
    "name": "My Project",
    "description": "A web application for task management",
    "repository": "https://github.com/user/project"
  }
}
```

---

### agents

Defines available AI agents and their capabilities.

| Property | Type | Required | Description |
|----------|------|----------|-------------|
| [agent-name] | object | - | Agent configuration object |
| [agent-name].description | string | Yes | Brief description of the agent |
| [agent-name].primaryUse | string[] | Yes | Primary use cases |
| [agent-name].secondaryUse | string[] | No | Secondary use cases |
| [agent-name].model | string | No | Model identifier if applicable |

**Supported Agents:**

| Agent | Primary Use | Secondary Use |
|-------|-------------|---------------|
| opus | Planner, UI, Architecture | Auditor |
| codex | API, Backend, Logic, Coding | Auditor (primary) |
| sonnet | Quick tasks, Context creation, Roadmap reading | - |
| glm | Task splitting, Simple context | Miscellaneous |
| gemini | UI (alternative to Opus) | - |

**Example:**
```json
{
  "agents": {
    "opus": {
      "description": "Claude Opus - Best for planning, architecture, and complex UI work",
      "primaryUse": ["planning", "architecture", "ui", "design"],
      "secondaryUse": ["auditing", "code-review"]
    },
    "codex": {
      "description": "Claude Codex - Best for backend logic, APIs, and code auditing",
      "primaryUse": ["backend", "api", "logic", "coding"],
      "secondaryUse": ["auditing"]
    }
  }
}
```

---

### tags

Defines tag categories and valid tag values.

| Property | Type | Required | Description |
|----------|------|----------|-------------|
| categories | object | Yes | Tag category definitions |
| categories.[category].description | string | Yes | Category description |
| categories.[category].values | string[] | Yes | Valid tag values |

**Standard Categories:**

| Category | Purpose | Example Values |
|----------|---------|----------------|
| type | Task type classification | feature, bug, refactor, spike, docs, test |
| priority | Task priority | critical, high, medium, low |
| domain | Technical domain | frontend, backend, api, database, infra |
| component | Project component | auth, ui, core, utils |

**Example:**
```json
{
  "tags": {
    "categories": {
      "type": {
        "description": "Type of task",
        "values": ["feature", "bug", "refactor", "spike", "docs", "test", "design", "security"]
      },
      "priority": {
        "description": "Task priority level",
        "values": ["critical", "high", "medium", "low"]
      },
      "domain": {
        "description": "Technical domain",
        "values": ["frontend", "backend", "api", "database", "infra", "devops"]
      }
    }
  }
}
```

---

### stages

Defines workflow stages and their behavior.

| Property | Type | Required | Description |
|----------|------|----------|-------------|
| [stage-name] | object | - | Stage configuration |
| [stage-name].description | string | Yes | Stage purpose description |
| [stage-name].order | number | Yes | Stage order (0-based) |
| [stage-name].allowedTransitions | string[] | Yes | Stages that can be transitioned to |
| [stage-name].color | string | No | UI color for the stage |

**Standard Stages:**

| Stage | Order | Description | Allowed Transitions |
|-------|-------|-------------|---------------------|
| inbox | 0 | New tasks waiting for triage | plan, completed |
| plan | 1 | Tasks being planned/designed | inbox, code, completed |
| code | 2 | Tasks in active development | plan, audit, completed |
| audit | 3 | Tasks under review | code, completed |
| completed | 4 | Finished tasks | inbox (reopen) |

**Example:**
```json
{
  "stages": {
    "inbox": {
      "description": "New tasks awaiting triage",
      "order": 0,
      "allowedTransitions": ["plan", "completed"],
      "color": "#6b7280"
    },
    "plan": {
      "description": "Tasks being planned and designed",
      "order": 1,
      "allowedTransitions": ["inbox", "code", "completed"],
      "color": "#3b82f6"
    },
    "code": {
      "description": "Tasks in active development",
      "order": 2,
      "allowedTransitions": ["plan", "audit", "completed"],
      "color": "#f59e0b"
    },
    "audit": {
      "description": "Tasks under review",
      "order": 3,
      "allowedTransitions": ["code", "completed"],
      "color": "#8b5cf6"
    },
    "completed": {
      "description": "Finished tasks",
      "order": 4,
      "allowedTransitions": ["inbox"],
      "color": "#10b981"
    }
  }
}
```

---

### preferences

User preferences and conventions.

| Property | Type | Required | Default | Description |
|----------|------|----------|---------|-------------|
| fileNaming | string | No | "kebab-case" | File naming convention |
| requireTests | boolean | No | false | Require tests for code tasks |
| defaultAgent | string | No | "codex" | Default agent for new tasks |
| archiveCompleted | boolean | No | true | Auto-archive completed tasks |
| archiveAfterDays | number | No | 7 | Days before archiving |

**Example:**
```json
{
  "preferences": {
    "fileNaming": "kebab-case",
    "requireTests": true,
    "defaultAgent": "codex",
    "archiveCompleted": true,
    "archiveAfterDays": 7
  }
}
```

---

### personalities

Agent personality definitions for different roles.

| Property | Type | Required | Description |
|----------|------|----------|-------------|
| [personality-name] | object | - | Personality configuration |
| [personality-name].description | string | Yes | Personality description |
| [personality-name].agents | string[] | Yes | Compatible agents |
| [personality-name].focus | string[] | Yes | Areas of focus |
| [personality-name].strengths | string[] | No | Personality strengths |
| [personality-name].limitations | string[] | No | Personality limitations |
| [personality-name].instructions | string | No | Short instruction block for how to operate in this personality |
| [personality-name].suggestedPrompts | string[] | No | Suggested prompts to use with this personality |

**Standard Personalities:**

| Personality | Compatible Agents | Focus Areas |
|-------------|-------------------|-------------|
| architect | opus | System design, architecture decisions |
| frontend-developer | opus, gemini | UI/UX implementation |
| backend-developer | codex | Logic, APIs, data handling |
| auditor | codex, opus | Code review, quality assurance |
| planner | opus | Task breakdown, roadmaps |
| context-builder | sonnet, glm | Context files, documentation |

**Example:**
```json
{
  "personalities": {
    "architect": {
      "description": "System design and architecture focus",
      "agents": ["opus"],
      "focus": ["system-design", "patterns", "scalability"],
      "strengths": ["big-picture thinking", "trade-off analysis"],
      "limitations": ["may over-engineer simple tasks"]
    },
    "backend-developer": {
      "description": "Backend logic and API development",
      "agents": ["codex"],
      "focus": ["apis", "databases", "business-logic"],
      "strengths": ["efficient algorithms", "error handling"],
      "limitations": ["UI/UX considerations"]
    }
  }
}
```

---

## Complete Example

See `examples/config.example.json` for a complete working configuration.

## Validation

The extension validates the configuration file on load and provides:
- Error messages for invalid JSON
- Warnings for missing optional fields
- Fallback to defaults for missing values

## Extending the Schema

Projects can add custom:
- Agents (for project-specific AI tools)
- Tag categories (for domain-specific classification)
- Personalities (for specialized roles)

Custom additions should follow the same structure as built-in definitions.
