# Phase 2 Context: Context System and XML Prompt Builder

This document provides all necessary context for implementing Phase 2 of the Kanban2Code project. It includes architectural decisions, interface contracts, data schemas, dependencies, invariants, and migration paths required for the context system, ensuring forward and backward compatibility across all roadmap phases.

## Project State Summary

### Phase 0 Foundation (Complete)
- ✅ Bun/TypeScript project with esbuild, Vitest, ESLint, Prettier
- ✅ VS Code extension skeleton with command registration
- ✅ Basic webview infrastructure with React shell and CSP
- ✅ Workspace scaffolder creating `.kanban2code` structure
- ✅ Core types and constants defined
- ✅ Workspace detection and validation
- ✅ Extension activation and lifecycle management

### Phase 1 Filesystem and Tasks (Partial - Gaps Identified)
- ✅ Task parsing and serialization with gray-matter
- ✅ Recursive task loading from inbox/projects with phase inference
- ✅ Stage update service with forward-only transitions
- ⚠️ Archive behavior: Services implemented but no VS Code commands registered
- ⚠️ Extended validation: Returns status enums but lacks `forbidden` path and descriptive messaging
- ✅ Comprehensive unit and integration tests
- ⚠️ File watcher: Implemented but not wired to extension host
- ⚠️ Webview architecture: Versioned envelope exists but no Zustand stores or component library

## Phase 2 Architectural Vision

Phase 2 implements a comprehensive context system that builds XML prompts for AI agents by layering contextual information in a specific order. This system enables rich, context-aware task handling and provides multiple copy modes for different use cases.

## Core Architectural Decisions

### 1. Context Layer Architecture
**Decision**: Implement a 9-layer context system with strict ordering
**Rationale**: Provides predictable, comprehensive context building for AI agents
**Implementation**: Layered loaders with fallback behavior

```
Layer 1: Global Context (how-it-works.md, architecture.md, project-details.md)
Layer 2: Agent Context (_agents/{agent}.md)
Layer 3: Project Context (projects/{project}/_context.md)
Layer 4: Phase Context (projects/{project}/{phase}/_context.md)
Layer 5: Stage Template (_templates/stages/{stage}.md)
Layer 6: Custom Contexts (from task.contexts array)
Layer 7: Task Metadata (frontmatter properties)
Layer 8: Task Content (markdown body)
Layer 9: System Wrapper (XML structure)
```

### 2. Copy Mode Strategy
**Decision**: Support three distinct copy modes with `full_xml` as default
**Rationale**: Provides flexibility for different AI interaction patterns
**Implementation**: Mode-based payload builders

- `full_xml`: Complete 9-layer context system
- `task_only`: Task metadata + content only
- `context_only`: System + context sections without task content

### 3. XML Structure Design
**Decision**: Wrap context in semantic XML tags
**Rationale**: Provides clear structure for AI parsing and processing
**Implementation**: Structured XML with system, context, and task sections

## Interface Contracts

### Context Service Interface
```typescript
interface ContextService {
  loadGlobalContext(root: string): Promise<string>
  loadAgentContext(root: string, agentName: string): Promise<string>
  loadProjectContext(root: string, projectName: string): Promise<string>
  loadPhaseContext(root: string, projectName: string, phaseName: string): Promise<string>
  loadCustomContexts(root: string, contextNames: string[]): Promise<string>
  loadStageTemplate(root: string, stage: Stage): Promise<string>
}
```

### Prompt Builder Interface
```typescript
interface PromptBuilder {
  buildXMLPrompt(task: Task, root: string): Promise<string>
  buildContextOnlyPrompt(task: Task, root: string): Promise<string>
}
```

### Copy Service Interface
```typescript
interface CopyService {
  buildCopyPayload(task: Task, mode: CopyMode): Promise<string>
  copyToClipboard(content: string): Promise<void>
}
```

## Data Schemas

### Copy Mode Enumeration
```typescript
export type CopyMode = 'full_xml' | 'task_only' | 'context_only';
```

### Extended Task Type (Phase 2 Compatible)
```typescript
export interface Task {
  id: string;
  filePath: string;
  title: string;
  stage: Stage;
  project?: string;
  phase?: string;
  agent?: string;
  parent?: string;
  tags?: string[];
  contexts?: string[]; // Used for custom context loading
  order?: number;
  created?: string;
  content: string;
}
```

### Context File Structure
```
.kanban2code/
├── how-it-works.md          # Global workflow documentation
├── architecture.md          # System architecture
├── project-details.md       # Project-specific details
├── _agents/
│   ├── opus.md             # Agent definitions
│   ├── sonnet.md
│   └── codex.md
├── projects/{project}/
│   ├── _context.md         # Project-level context
│   └── {phase}/
│       ├── _context.md     # Phase-level context
│       └── *.md            # Task files
└── _templates/
    └── stages/
        ├── inbox.md        # Stage-specific templates
        ├── plan.md
        ├── code.md
        ├── audit.md
        └── completed.md
```

## Dependencies and Integration Points

### Phase 0 Dependencies
- [`Task`](src/types/task.ts:3) type system
- [`STAGES`](src/core/constants.ts:3) constants
- [`parseTaskFile`](src/services/frontmatter.ts:72) for task loading
- [`findKanbanRoot`](src/workspace/validation.ts:13) for workspace detection

### Phase 1 Dependencies
- [`loadAllTasks`](src/services/scanner.ts:28) for task discovery
- [`findTaskById`](src/services/scanner.ts:50) for task retrieval
- Stage transition rules from [`src/core/rules.ts`](src/core/rules.ts:3)

### New Dependencies for Phase 2
- VS Code clipboard API for copy functionality
- Enhanced message types for webview communication

## Invariants and Constraints

### Context Loading Invariants
1. **File Safety**: All context file paths must pass [`isSafePath`](src/workspace/validation.ts:61) validation
2. **Graceful Degradation**: Missing context files return empty strings, never throw
3. **Layer Order**: Context layers are always assembled in the specified 9-layer order
4. **Path Resolution**: Context files are resolved relative to the kanban root

### XML Structure Invariants
1. **Well-formed XML**: All generated XML must be parseable
2. **Semantic Tagging**: Use meaningful tag names (system, context, task)
3. **Content Escaping**: Proper XML entity escaping for content
4. **Metadata Preservation**: All task metadata is included in XML output

### Copy System Invariants
1. **Mode Consistency**: Each copy mode produces predictable output format
2. **Clipboard Safety**: Clipboard operations handle errors gracefully
3. **User Feedback**: Always provide success/error notification
4. **Performance**: Context building completes within reasonable time (< 100ms for typical cases)

## Migration Paths and Compatibility

### Forward Compatibility (Phase 2 → Phase 3+)
1. **Message Type Extension**: Webview messages can be extended without breaking existing types
2. **Context System Growth**: New context layers can be added to the 9-layer system
3. **Copy Mode Expansion**: Additional copy modes can be added to the enum
4. **XML Schema Evolution**: XML structure can be versioned and extended

### Backward Compatibility (Phase 1 → Phase 2)
1. **Task Type Extension**: Existing task structure is preserved, contexts field is optional
2. **Service Integration**: New services integrate with existing scanner and frontmatter services
3. **Validation Compatibility**: Uses existing workspace validation and path safety checks
4. **Testing Continuity**: Builds upon existing Vitest infrastructure

### Cross-Phase Dependencies
1. **Type System**: All phases use the same core [`Task`](src/types/task.ts:3) type
2. **Constants**: Shared [`STAGES`](src/core/constants.ts:3) and folder constants
3. **Validation**: Common [`ValidationStatus`](src/workspace/validation.ts:5) enum
4. **Messaging**: Extended [`WebviewToHostMessageTypes`](src/webview/messaging.ts:12) includes `CopyContext`

## Implementation Strategy

### Service Architecture
```
src/services/
├── context.ts          # Context loading service
├── prompt-builder.ts   # XML prompt assembly
└── copy.ts            # Copy mode and clipboard integration
```

### Type Definitions
```
src/types/
├── copy.ts            # CopyMode enum and related types
└── context.ts         # Context service interfaces
```

### Integration Points
```
src/commands/index.ts  # Add copy context commands
src/webview/messaging.ts  # Extend message types
```

## Testing Strategy

### Unit Test Coverage
1. **Context Loaders**: Test each loader with missing files, invalid paths, successful loads
2. **Prompt Builder**: Verify 9-layer ordering, XML structure, edge cases
3. **Copy Service**: Test all three modes, error handling, payload generation
4. **Integration**: Test service interactions and data flow

### Test Data Requirements
- Mock context files for each layer type
- Edge cases: missing files, malformed content, permission errors
- Performance benchmarks for large context assemblies

## Error Handling and Resilience

### Context Loading Errors
- Missing files: Return empty string, log warning
- Permission errors: Return empty string, notify user
- Malformed content: Return empty string, log error
- Path validation failures: Throw error (security critical)

### XML Generation Errors
- Content escaping failures: Fallback to CDATA wrapping
- Structure validation failures: Return simplified format
- Memory constraints: Stream large contexts

### Clipboard Errors
- API failures: Show user-friendly error message
- Content size limits: Truncate with notification
- Permission denials: Guide user to enable permissions

## Performance Considerations

### Context Loading Optimization
- Parallel file loading where possible
- Caching for frequently accessed contexts
- Lazy loading for optional contexts
- File system watcher integration for cache invalidation

### XML Generation Efficiency
- String builder pattern for large documents
- Streaming for very large contexts
- Memory-conscious processing for batch operations

## Security Considerations

### Path Traversal Protection
- All paths validated with [`isSafePath`](src/workspace/validation.ts:61)
- Context file resolution restricted to kanban root
- No user input in file path construction

### Content Sanitization
- XML entity escaping for user content
- Validation of context file content
- Size limits on loaded contexts

## Success Criteria

Phase 2 is complete when:
1. All 9 context layers load correctly with proper fallback behavior
2. XML prompts are generated with correct structure and ordering
3. All three copy modes produce expected output
4. Clipboard integration works reliably with user feedback
5. Comprehensive unit tests cover all services and edge cases
6. Integration with existing Phase 0/1 systems is seamless
7. Performance meets requirements for interactive use
8. Security invariants are maintained
9. Phase 2 audit documents completion and identifies any gaps

## Known Risks and Mitigation

### Risk: Performance with Large Contexts
**Mitigation**: Implement caching, streaming, and parallel loading

### Risk: Complex XML Structure
**Mitigation**: Provide clear documentation and validation tools

### Risk: Context File Management
**Mitigation**: Template system and clear file organization patterns

### Risk: Cross-Phase Integration
**Mitigation**: Comprehensive integration testing and interface contracts

This context document provides the complete foundation for implementing Phase 2 while ensuring compatibility with existing phases and future extensibility.