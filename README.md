# Kanban2Code

VS Code extension that brings a Kanban-style control tower with AI-friendly context. Built with Bun, TypeScript, and esbuild.

## Getting started

1. Install dependencies

   ```bash
   bun install
   ```

2. Build the extension (bundles extension + webview)

   ```bash
   bun run build
   ```

   For watch mode:

   ```bash
   bun run build:watch
   ```

3. Launch the VS Code Extension Host
   - Press `F5` in VS Code, or use the `Run Extension` launch config.

## Commands
- `Kanban2Code: Open Board`
- `Kanban2Code: New Task`
- `Kanban2Code: Scaffold Workspace`

## Notes
- Activation events are scoped to `.kanban2code` workspaces, the scaffold command, or opening the sidebar view.
- Workspace scaffolding creates the canonical folder structure with templates and a sample task.
