/**
 * Configuration types for Kanban2Code
 * Matches the schema defined in docs/config-schema.md
 */

export interface ProjectConfig {
  name: string;
  description?: string;
  repository?: string;
}

export interface AgentConfig {
  description: string;
  primaryUse: string[];
  secondaryUse?: string[];
  model?: string;
}

export interface TagCategory {
  description: string;
  values: string[];
}

export interface TagsConfig {
  categories: Record<string, TagCategory>;
}

export interface StageConfig {
  description: string;
  order: number;
  allowedTransitions: string[];
  color?: string;
}

export interface PreferencesConfig {
  fileNaming?: 'kebab-case' | 'camelCase' | 'snake_case';
  requireTests?: boolean;
  defaultAgent?: string;
  archiveCompleted?: boolean;
  archiveAfterDays?: number;
}

export interface PersonalityConfig {
  description: string;
  agents: string[];
  focus: string[];
  strengths?: string[];
  limitations?: string[];
  instructions?: string;
  suggestedPrompts?: string[];
}

export interface Kanban2CodeConfig {
  version: string;
  project?: ProjectConfig;
  agents: Record<string, AgentConfig>;
  tags: TagsConfig;
  stages: Record<string, StageConfig>;
  preferences: PreferencesConfig;
  personalities?: Record<string, PersonalityConfig>;
  modeDefaults?: Record<string, string>;
}

/**
 * Default configuration values used when config.json is missing or incomplete
 */
export const DEFAULT_CONFIG: Kanban2CodeConfig = {
  version: '1.0.0',
  agents: {
    opus: {
      description: 'Claude Opus - Best for planning, architecture, and complex UI work',
      primaryUse: ['planning', 'architecture', 'ui', 'design'],
      secondaryUse: ['auditing', 'code-review'],
    },
    codex: {
      description: 'Claude Codex - Best for backend logic, APIs, and code auditing',
      primaryUse: ['backend', 'api', 'logic', 'coding'],
      secondaryUse: ['auditing'],
    },
    sonnet: {
      description: 'Claude Sonnet - Best for quick tasks and context creation',
      primaryUse: ['quick-tasks', 'context-creation', 'roadmap-reading'],
      secondaryUse: [],
    },
    glm: {
      description: 'GLM - Best for task splitting and simple context',
      primaryUse: ['task-splitting', 'simple-context'],
      secondaryUse: ['miscellaneous'],
    },
    gemini: {
      description: 'Gemini - Alternative for UI work',
      primaryUse: ['ui'],
      secondaryUse: [],
    },
  },
  tags: {
    categories: {
      type: {
        description: 'Type of task',
        values: ['feature', 'bug', 'refactor', 'spike', 'docs', 'test', 'design', 'security', 'config', 'audit'],
      },
      priority: {
        description: 'Task priority level',
        values: ['critical', 'high', 'medium', 'low'],
      },
      domain: {
        description: 'Technical domain',
        values: ['frontend', 'backend', 'api', 'database', 'infra', 'devops', 'ui', 'ux'],
      },
      component: {
        description: 'Project component or module',
        values: ['core', 'auth', 'ui', 'utils', 'services', 'types', 'config'],
      },
    },
  },
  stages: {
    inbox: {
      description: 'New tasks awaiting triage',
      order: 0,
      allowedTransitions: ['plan', 'completed'],
      color: '#6b7280',
    },
    plan: {
      description: 'Tasks being planned and designed',
      order: 1,
      allowedTransitions: ['inbox', 'code', 'completed'],
      color: '#3b82f6',
    },
    code: {
      description: 'Tasks in active development',
      order: 2,
      allowedTransitions: ['plan', 'audit', 'completed'],
      color: '#f59e0b',
    },
    audit: {
      description: 'Tasks under review',
      order: 3,
      allowedTransitions: ['code', 'completed'],
      color: '#8b5cf6',
    },
    completed: {
      description: 'Finished tasks',
      order: 4,
      allowedTransitions: ['inbox'],
      color: '#10b981',
    },
  },
  preferences: {
    fileNaming: 'kebab-case',
    requireTests: false,
    defaultAgent: 'codex',
    archiveCompleted: true,
    archiveAfterDays: 7,
  },
  modeDefaults: {
    coder: 'opus',
    auditor: 'opus',
    planner: 'sonnet',
    contextBuilder: 'sonnet',
    splitter: 'glm',
  },
};
