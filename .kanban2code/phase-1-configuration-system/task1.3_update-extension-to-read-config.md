---
stage: completed
tags: [extension, config, typescript]
agent: codex
contexts: []
---

# Task 1.3: Update Extension to Read Config

## Goal

Modify the VS Code extension to load and use the config.json file for dynamic configuration.

## Background

The extension needs to read the configuration file to make agent definitions, tags, and user preferences available throughout the application.

## Scope

- Load config.json on extension activation
- Implement fallback to defaults if config is missing
- Expose config values to relevant components
- Support project-level configuration overrides
- Update type definitions to match config schema

## Files to Modify

- `src/extension.ts` - Add config loading on activation
- `src/core/constants.ts` - Update to use config values
- `src/services/config.ts` - Create new service for config management
- `src/types/config.ts` - Create type definitions for config

## Acceptance Criteria

- [x] Config loads successfully when extension activates
- [x] Default values are used when config.json is missing
- [x] Config values are accessible throughout the extension
- [x] Project-level overrides are supported
- [x] No errors occur with malformed config (graceful fallback)
- [x] Configuration changes are detected (file watcher)

## Testing Requirements

- Test extension activation with and without config.json
- Test fallback behavior with missing/invalid config
- Test project-level config overrides

## Notes

The config service should be a singleton that provides centralized access to configuration values throughout the extension.