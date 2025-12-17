import type { Stage } from './task';

export interface FilterState {
  project?: string | null; // null/undefined means all
  stages: Stage[]; // active stages
  tags?: string[];
  search?: string;
  quickView?: string | null;
}

/**
 * Tag Taxonomy for Kanban2Code
 * Phase 5.7: Tag Taxonomy and Conventions
 *
 * Defines formal tag categories and validation rules.
 */

/** Type tags (mutually exclusive - pick 1) */
export const TYPE_TAGS = [
  'feature',   // New capability
  'bug',       // Defect fix
  'spike',     // Research / exploration
  'refactor',  // Code improvement without behavior change
  'docs',      // Documentation only
  'test',      // Test infrastructure
  'chore',     // Maintenance, no user impact
] as const;

export type TypeTag = typeof TYPE_TAGS[number];

/** Priority tags (recommended - pick 1) */
export const PRIORITY_TAGS = [
  'p0', 'critical',  // Blocks release or breaks core functionality
  'p1', 'high',      // Important but not blocking
  'p2', 'medium',    // Nice to have
  'p3', 'low',       // Polish or future consideration
] as const;

export type PriorityTag = typeof PRIORITY_TAGS[number];

/** Status tags (informational) */
export const STATUS_TAGS = [
  'blocked',      // Waiting on external blocker
  'in-progress',  // Active work (assign to agent)
  'review',       // Waiting for code review
  'approved',     // Design/requirements signed off
  'shipped',      // Released in version X.Y
] as const;

export type StatusTag = typeof STATUS_TAGS[number];

/** Domain tags (multiple OK) */
export const DOMAIN_TAGS = [
  'mvp',           // Required for v1.0 release
  'accessibility', // WCAG compliance
  'performance',   // Speed or memory optimization
  'security',      // Security fix or hardening
  'ci',            // CI/CD infrastructure
] as const;

export type DomainTag = typeof DOMAIN_TAGS[number];

/** Component tags (multiple OK) */
export const COMPONENT_TAGS = [
  'sidebar',    // Sidebar webview component
  'board',      // Board webview component
  'messaging',  // Extension <-> webview communication
  'keyboard',   // Keyboard navigation or shortcuts
  'filters',    // Filtering and search
  'context',    // Context system (9-layer)
  'copy',       // Copy-to-clipboard functionality
  'archive',    // Archive workflow
  'test',       // Test infrastructure
] as const;

export type ComponentTag = typeof COMPONENT_TAGS[number];

/**
 * Orchestration tags (agent pipeline state)
 * These tags coordinate handoffs between agents in the orchestration pipeline.
 *
 * State tags (mutually exclusive within each dimension):
 * - missing-architecture / architecture-ready
 * - missing-decomposition / decomposition-ready
 *
 * Type tags (can be combined):
 * - roadmap: Vision/roadmap document
 * - architecture: Technical design document
 * - decomposition: Task generation work
 */
export const ORCHESTRATION_TAGS = [
  // State tags - track what's missing/needed
  'missing-architecture',   // Needs Architect to add technical design
  'architecture-ready',     // Architecture is complete and ready for decomposition
  'missing-decomposition',  // Needs Splitter to generate task files
  'decomposition-ready',    // Decomposition is complete and ready for execution

  // Type tags - categorize orchestration work
  'roadmap',                // Vision document work
  'architecture',           // Technical design work
  'decomposition',          // Task splitting work
] as const;

export type OrchestrationTag = typeof ORCHESTRATION_TAGS[number];

/** All tag categories */
export const TAG_TAXONOMY = {
  type: TYPE_TAGS,
  priority: PRIORITY_TAGS,
  status: STATUS_TAGS,
  domain: DOMAIN_TAGS,
  component: COMPONENT_TAGS,
  orchestration: ORCHESTRATION_TAGS,
} as const;

/** All valid tags */
export const ALL_TAGS = [
  ...TYPE_TAGS,
  ...PRIORITY_TAGS,
  ...STATUS_TAGS,
  ...DOMAIN_TAGS,
  ...COMPONENT_TAGS,
  ...ORCHESTRATION_TAGS,
] as const;

export type KnownTag = typeof ALL_TAGS[number];

/**
 * Check if a tag belongs to a specific category
 */
export function isTagInCategory(
  tag: string,
  category: keyof typeof TAG_TAXONOMY
): boolean {
  return (TAG_TAXONOMY[category] as readonly string[]).includes(tag);
}

/**
 * Get the category of a tag
 */
export function getTagCategory(
  tag: string
): keyof typeof TAG_TAXONOMY | 'custom' {
  for (const [category, tags] of Object.entries(TAG_TAXONOMY)) {
    if ((tags as readonly string[]).includes(tag)) {
      return category as keyof typeof TAG_TAXONOMY;
    }
  }
  return 'custom';
}

/**
 * Validate tag usage rules:
 * - Only one type tag
 * - Only one priority tag
 * - Orchestration state tags are mutually exclusive per dimension
 */
export function validateTags(tags: string[]): {
  valid: boolean;
  errors: string[];
  warnings: string[];
} {
  const errors: string[] = [];
  const warnings: string[] = [];

  const typeTags = tags.filter(t => isTagInCategory(t, 'type'));
  const priorityTags = tags.filter(t => isTagInCategory(t, 'priority'));

  if (typeTags.length > 1) {
    errors.push(`Multiple type tags found: ${typeTags.join(', ')}. Pick only one.`);
  }

  if (priorityTags.length > 1) {
    warnings.push(`Multiple priority tags found: ${priorityTags.join(', ')}. Consider using only one.`);
  }

  // Orchestration validation rules
  const hasMissingArch = tags.includes('missing-architecture');
  const hasMissingDecomp = tags.includes('missing-decomposition');
  const hasArchReady = tags.includes('architecture-ready');
  const hasDecompReady = tags.includes('decomposition-ready');

  if (hasMissingArch && hasArchReady) {
    errors.push('Orchestration state conflict: both missing-architecture and architecture-ready are set.');
  }
  if (hasMissingDecomp && hasDecompReady) {
    errors.push('Orchestration state conflict: both missing-decomposition and decomposition-ready are set.');
  }
  if (hasDecompReady && !hasArchReady) {
    errors.push('Orchestration state conflict: decomposition-ready requires architecture-ready.');
  }

  // Both missing-* tags is valid (fresh roadmap from Roadmapper)
  // Only missing-decomposition is valid (Architect finished, needs Splitter)
  // Neither is valid (fully decomposed)
  // Only missing-architecture without missing-decomposition would be odd
  if (hasMissingArch && !hasMissingDecomp) {
    warnings.push('Task has missing-architecture but not missing-decomposition. Typically both are set together.');
  }

  if (hasMissingDecomp && !hasMissingArch && !hasArchReady) {
    warnings.push('Task has missing-decomposition but is not marked architecture-ready (or missing-architecture). Consider clarifying the orchestration state.');
  }

  // If task has orchestration state tags, it should likely have p0 priority
  if ((hasMissingArch || hasMissingDecomp || hasArchReady || hasDecompReady) && !tags.includes('p0')) {
    warnings.push('Orchestration tasks with missing-* tags are typically high priority (p0).');
  }

  // Check for blocked without explanation (would need content check)
  if (tags.includes('blocked')) {
    warnings.push('Task is marked as blocked. Ensure there is a comment explaining the blocker.');
  }

  // Check for MVP alignment
  if (tags.includes('mvp') && tags.includes('p3')) {
    warnings.push('MVP task marked as low priority (p3). Consider reprioritizing.');
  }

  return {
    valid: errors.length === 0,
    errors,
    warnings,
  };
}

/**
 * Get tag display color (for UI)
 */
export function getTagColor(tag: string): string {
  const category = getTagCategory(tag);

  switch (category) {
    case 'type':
      return tag === 'bug' ? '#e74c3c' :
             tag === 'feature' ? '#27ae60' :
             tag === 'refactor' ? '#9b59b6' :
             '#3498db';
    case 'priority':
      return tag === 'p0' || tag === 'critical' ? '#e74c3c' :
             tag === 'p1' || tag === 'high' ? '#e67e22' :
             tag === 'p2' || tag === 'medium' ? '#f1c40f' :
             '#95a5a6';
    case 'status':
      return tag === 'blocked' ? '#e74c3c' :
             tag === 'in-progress' ? '#3498db' :
             tag === 'review' ? '#9b59b6' :
             tag === 'shipped' ? '#27ae60' :
             '#95a5a6';
    case 'domain':
      return '#1abc9c';
    case 'component':
      return '#34495e';
    case 'orchestration':
      // State tags (missing-*) in orange to indicate action needed
      // State tags (*-ready) in green to indicate ready
      // Type tags (roadmap, architecture, decomposition) in teal
      return tag.startsWith('missing-') ? '#e67e22' :
             tag.endsWith('-ready') ? '#27ae60' :
             '#16a085';
    default:
      return '#7f8c8d';
  }
}
