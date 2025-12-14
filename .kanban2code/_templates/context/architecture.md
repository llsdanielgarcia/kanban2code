---
name: Architecture Context
description: Project-level architecture reference used to keep tasks consistent and decisions explicit.
icon: "\ud83c\udfd7\ufe0f"
---

# Architecture Context: <PROJECT_NAME>

## PROJECT_OVERVIEW
- product: <what this is>
- users: <who uses it>
- primary_goals: <top 3 goals>
- non_goals: <what we are not building>
- constraints: <perf|security|compat|timeline>

## TECH_STACK
- languages: <...>
- runtime: <node/deno/python/etc>
- frameworks: <...>
- storage: <db/cache/queue>
- infra: <hosting/deploy/ci>
- testing: <unit/integration/e2e>

## REPO_STRUCTURE
- root_dirs:
  - <dir>: <what lives here>
  - <dir>: <what lives here>
- key_entrypoints:
  - <file>: <why it matters>
- generated_or_build_outputs:
  - <path>: <how produced, can it be edited?>

## KEY_PATTERNS_AND_CONVENTIONS
- naming: <filenames, ids, casing>
- layering: <modules/services/ui boundaries>
- error_handling: <principles + examples>
- logging_observability: <where logs go, redaction rules>
- security: <authn/authz, secrets, input validation>
- performance: <known constraints + typical hot paths>

## INTEGRATION_POINTS
- external_services:
  - <service>: <purpose> | <auth> | <rate_limits> | <failure_modes>
- internal_interfaces:
  - <api/module>: <contract summary>
- data_contracts:
  - <schema/table/event>: <ownership + compatibility rules>

## DECISIONS_AND_RATIONALE
- <decision_id>: <decision> (because <reason>) | status: <accepted|deprecated|experimental>

## OPEN_QUESTIONS
- <question> -> owner: <agent/person> | due: <date/phase>

## UPDATE_RULES
- Update this file when a decision changes, a new pattern becomes “the way”, or the stack/structure materially shifts.
- Prefer small, additive edits; avoid rewriting history (append decisions with status changes).

