# Kanban2Code Architecture Documentation

## Project Overview

Kanban2Code is a VS Code extension that brings Kanban board functionality directly into the editor, integrating AI agents and rich task context. The project aims to streamline task management for developers by providing a visual workflow system that seamlessly integrates with the coding environment.

Key features include:
- A Kanban board with five stages: Inbox, Plan, Code, Audit, and Completed
- Filesystem-based task management using markdown files with frontmatter
- AI agent integration for context-aware task handling
- A sidebar interface for task navigation and management
- Workspace scaffolding to set up the Kanban2Code folder structure
- Context system for building comprehensive XML prompts for AI agents
- Copy-to-clipboard functionality for task context

The technology stack uses Bun as the runtime and package manager, TypeScript for type safety, React for webviews, and Vitest for testing. The extension follows a UI-first approach with comprehensive testing requirements at each phase of development.

## Directory Structure

```
phase-0-foundation/
├── .gitkeep                               # Placeholder file to ensure directory tracking in git
├── phase-0-audit.md                       # Audit file documenting the completion and status of Phase 0 tasks
├── task0.0_initialize-project-and-build-tooling.md    # Task specification for project initialization using Bun and build tooling setup
├── task0.1_create-vs-code-extension-skeleton.md      # Task specification for creating the basic VS Code extension structure
├── task0.2_implement-core-webview-infrastructure.md   # Task specification for implementing React webview infrastructure
├── task0.3_implement-kanban2code-workspace-scaffolder.md # Task specification for implementing workspace scaffolding functionality
├── task0.4_define-core-types-and-constants.md         # Task specification for defining shared types and constants
├── task0.5_implement-workspace-detection-and-validation.md # Task specification for workspace validation and detection
├── task0.6_define-extension-activation-and-lifecycle.md # Task specification for extension activation events and lifecycle
├── task0.7_initialize-project-and-build-tooling-superseded.md # Superseded task that points to task0.0
├── task0.8_phase-0-audit-and-sign-off.md               # Task specification for the final Phase 0 audit and sign-off
└── docs/
    └── architecture.md                    # This file containing project architecture documentation

src/
├── extension.ts                            # Main extension entry point handling activation and command registration
├── assets/
│   └── templates.ts                       # Template definitions for workspace scaffolding (agents, tasks, stages)
├── commands/
│   └── index.ts                           # Command registration and implementation for VS Code commands
├── core/
│   ├── constants.ts                       # Core constants including stage definitions and folder names
│   └── rules.ts                           # Business rules and validation logic
├── services/
│   ├── archive.ts                         # Service for archiving completed tasks and projects
│   ├── frontmatter.ts                     # Service for parsing and serializing task frontmatter
│   ├── scaffolder.ts                      # Service for scaffolding new Kanban2Code workspaces
│   ├── scanner.ts                         # Service for scanning and loading task files
│   └── stage-manager.ts                   # Service for managing task stage transitions
├── types/
│   ├── gray-matter.d.ts                   # Type definitions for gray-matter library
│   └── task.ts                            # Core type definitions for tasks and stages
├── utils/
│   └── text.ts                            # Text processing utilities
├── webview/
│   ├── KanbanPanel.ts                     # Webview panel implementation for the Kanban board
│   ├── messaging.ts                       # Message passing between extension and webviews
│   ├── SidebarProvider.ts                 # VS Code sidebar webview provider
│   ├── ui/
│   │   ├── App.tsx                        # Main React component for webviews
│   │   ├── main.tsx                       # Entry point for React webview application
│   │   └── styles/
│   │       └── main.css                   # CSS styles for webview components
└── workspace/
    ├── state.ts                           # Workspace state management
    └── validation.ts                      # Workspace validation and detection logic

tests/
├── archive.test.ts                        # Unit tests for archive service
├── frontmatter.test.ts                    # Unit tests for frontmatter parsing and serialization
├── scaffolder.test.ts                     # Unit tests for workspace scaffolding
├── smoke.test.ts                          # Basic smoke tests for core functionality
├── stage-manager.test.ts                  # Unit tests for stage management service
├── state.test.ts                          # Unit tests for workspace state management
├── task-loading.test.ts                   # Integration tests for task loading from filesystem
├── types.test.ts                          # Unit tests for type definitions and utilities
├── utils.test.ts                          # Unit tests for utility functions
├── validation.test.ts                     # Unit tests for workspace validation
└── webview.test.ts                        # Unit tests for webview components

webview/                                   # Build output directory for webview assets

.gitignore                                 # Git ignore configuration
.prettierrc                                # Prettier code formatting configuration
build.ts                                   # Build script configuration for esbuild
bun.lock                                   # Bun lockfile for dependency management
eslint.config.mjs                          # ESLint configuration for code linting
package.json                               # NPM package configuration with dependencies and scripts
README.md                                  # Project README with setup instructions
roadmap.md                                 # Comprehensive development roadmap with phase breakdown
tsconfig.json                              # TypeScript compiler configuration
.vscode/                                   # VS Code workspace configuration