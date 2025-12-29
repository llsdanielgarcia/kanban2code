---
stage: audit
created: 2025-12-28T21:44:30.755Z
agent: 06-🔍auditor
---

# Create a new task keyboard confirugation

disable ctrl+shift+N and change it to something else, that command is to open a new window and it is annoying to deal with. 

## Refined Prompt
Objective: Change the keyboard shortcut for the `kanban2code.newTask` command from `ctrl+shift+N` / `cmd+shift+N` to a different keybinding that doesn't conflict with VSCode's built-in "New Window" command.

Implementation approach:
1. Locate the keybinding configuration in [`package.json`](package.json:104-123)
2. Replace the existing `ctrl+shift+n` / `cmd+shift+n` keybinding with the new keybinding
3. Verify the new keybinding doesn't conflict with existing extension keybindings

Key decisions:
- Keybinding location: [`package.json`](package.json:112-115) in the `contributes.keybindings` array
- Command: `kanban2code.newTask` (no changes to command registration needed)

Edge cases:
- New keybinding should not conflict with VSCode built-in shortcuts or other extension shortcuts
- Both Windows/Linux (`ctrl`) and macOS (`cmd`) variants must be updated

## Context
### Relevant Code
- [`package.json:112-115`](package.json:112-115) - Current keybinding for `kanban2code.newTask` command
- [`package.json:104-123`](package.json:104-123) - All extension keybindings
- [`src/commands/index.ts:93-187`](src/commands/index.ts:93-187) - Command registration for `kanban2code.newTask`

### Patterns to Follow
Keybindings are defined in `package.json` under `contributes.keybindings` array with:
- `command`: The VSCode command ID
- `key`: Windows/Linux keybinding
- `mac`: macOS keybinding (uses `cmd` instead of `ctrl`)
- `when`: Context condition when keybinding is active

### Test Patterns
No specific tests for keybindings - changes are verified by testing the extension in VSCode.

### Dependencies
None - this is a configuration-only change.

### Gotchas
- VSCode has many built-in shortcuts; avoid common combinations like `ctrl+shift+t` (Reopen Closed Tab), `ctrl+shift+w` (Close Window), `ctrl+shift+n` (New Window - the conflict being resolved)
- Both `key` and `mac` properties must be updated together
- The `when` clause `kanban2code:isActive` ensures the keybinding only works when the extension is active

## Questions
What keybinding should replace `ctrl+shift+N` / `cmd+shift+N` for the `kanban2code.newTask` command?
- `ctrl+alt+n` / `cmd+alt+n` (suggested alternative)
- `alt+shift+n` (cross-platform)
- Other: please specify
