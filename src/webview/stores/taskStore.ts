import { create } from 'zustand';
import type { Task, Stage } from '../../types/task';

/**
 * Filter options for tasks.
 */
export interface TaskFilters {
  project: string | null;
  phase: string | null;
  tags: string[];
  search: string;
}

/**
 * Task store state.
 */
export interface TaskStoreState {
  // Data
  tasks: Task[];
  loading: boolean;
  error: string | null;

  // Filters
  filters: TaskFilters;

  // Actions
  setTasks: (tasks: Task[]) => void;
  addTask: (task: Task) => void;
  updateTask: (task: Task) => void;
  removeTask: (id: string) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  setFilters: (filters: Partial<TaskFilters>) => void;
  resetFilters: () => void;
}

/**
 * Default filter state.
 */
const defaultFilters: TaskFilters = {
  project: null,
  phase: null,
  tags: [],
  search: '',
};

/**
 * Task store for managing task state in the webview.
 */
export const useTaskStore = create<TaskStoreState>((set) => ({
  // Initial state
  tasks: [],
  loading: false,
  error: null,
  filters: { ...defaultFilters },

  // Actions
  setTasks: (tasks) =>
    set({
      tasks,
      loading: false,
      error: null,
    }),

  addTask: (task) =>
    set((state) => ({
      tasks: [...state.tasks, task],
    })),

  updateTask: (task) =>
    set((state) => ({
      tasks: state.tasks.map((t) => (t.id === task.id ? task : t)),
    })),

  removeTask: (id) =>
    set((state) => ({
      tasks: state.tasks.filter((t) => t.id !== id),
    })),

  setLoading: (loading) => set({ loading }),

  setError: (error) => set({ error, loading: false }),

  setFilters: (filters) =>
    set((state) => ({
      filters: { ...state.filters, ...filters },
    })),

  resetFilters: () =>
    set({
      filters: { ...defaultFilters },
    }),
}));

// ============================================================================
// Selectors
// ============================================================================

/**
 * Selects tasks filtered by current filters.
 */
export function selectFilteredTasks(state: TaskStoreState): Task[] {
  let filtered = state.tasks;
  const { project, phase, tags, search } = state.filters;

  // Filter by project
  if (project) {
    filtered = filtered.filter((t) => t.project === project);
  }

  // Filter by phase
  if (phase) {
    filtered = filtered.filter((t) => t.phase === phase);
  }

  // Filter by tags (any match)
  if (tags.length > 0) {
    filtered = filtered.filter((t) =>
      t.tags?.some((tag) => tags.includes(tag)),
    );
  }

  // Filter by search term
  if (search) {
    const searchLower = search.toLowerCase();
    filtered = filtered.filter(
      (t) =>
        t.title.toLowerCase().includes(searchLower) ||
        t.content.toLowerCase().includes(searchLower),
    );
  }

  return filtered;
}

/**
 * Selects tasks grouped by stage.
 */
export function selectTasksByStage(
  state: TaskStoreState,
): Record<Stage, Task[]> {
  const filtered = selectFilteredTasks(state);

  return {
    inbox: filtered.filter((t) => t.stage === 'inbox'),
    plan: filtered.filter((t) => t.stage === 'plan'),
    code: filtered.filter((t) => t.stage === 'code'),
    audit: filtered.filter((t) => t.stage === 'audit'),
    completed: filtered.filter((t) => t.stage === 'completed'),
  };
}

/**
 * Selects unique projects from all tasks.
 */
export function selectProjects(state: TaskStoreState): string[] {
  const projects = new Set<string>();
  for (const task of state.tasks) {
    if (task.project) {
      projects.add(task.project);
    }
  }
  return Array.from(projects).sort();
}

/**
 * Selects unique phases for a given project.
 */
export function selectPhases(state: TaskStoreState, project: string): string[] {
  const phases = new Set<string>();
  for (const task of state.tasks) {
    if (task.project === project && task.phase) {
      phases.add(task.phase);
    }
  }
  return Array.from(phases).sort();
}

/**
 * Selects all unique tags from all tasks.
 */
export function selectAllTags(state: TaskStoreState): string[] {
  const tags = new Set<string>();
  for (const task of state.tasks) {
    if (task.tags) {
      for (const tag of task.tags) {
        tags.add(tag);
      }
    }
  }
  return Array.from(tags).sort();
}

/**
 * Selects a task by ID.
 */
export function selectTaskById(
  state: TaskStoreState,
  id: string,
): Task | undefined {
  return state.tasks.find((t) => t.id === id);
}

/**
 * Selects task count by stage.
 */
export function selectTaskCountByStage(
  state: TaskStoreState,
): Record<Stage, number> {
  const filtered = selectFilteredTasks(state);

  return {
    inbox: filtered.filter((t) => t.stage === 'inbox').length,
    plan: filtered.filter((t) => t.stage === 'plan').length,
    code: filtered.filter((t) => t.stage === 'code').length,
    audit: filtered.filter((t) => t.stage === 'audit').length,
    completed: filtered.filter((t) => t.stage === 'completed').length,
  };
}
