/**
 * Copy modes for building copy payloads.
 *
 * - `full_xml`: Complete 9-layer XML prompt with all context
 * - `task_only`: Just task metadata and body content
 * - `context_only`: System and context sections without task content
 */
export type CopyMode = 'full_xml' | 'task_only' | 'context_only';
