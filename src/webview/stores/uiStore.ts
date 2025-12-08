import { create } from 'zustand';
import type { Stage } from '../../types/task';

/**
 * Modal types that can be shown.
 */
export type ModalType =
  | 'create-task'
  | 'task-details'
  | 'confirm-delete'
  | 'confirm-archive'
  | null;

/**
 * View modes for the board.
 */
export type ViewMode = 'board' | 'list';

/**
 * UI store state.
 */
export interface UIStoreState {
  // Selection
  selectedTaskId: string | null;
  selectedStage: Stage | null;

  // Modals
  activeModal: ModalType;
  modalData: unknown;

  // View settings
  viewMode: ViewMode;
  collapsedStages: Set<Stage>;

  // Workspace status
  workspaceStatus: 'valid' | 'missing' | 'invalid' | 'forbidden' | 'loading';
  workspaceRoot: string | null;
  workspaceMessage: string;

  // Actions
  selectTask: (id: string | null) => void;
  selectStage: (stage: Stage | null) => void;
  openModal: (modal: ModalType, data?: unknown) => void;
  closeModal: () => void;
  setViewMode: (mode: ViewMode) => void;
  toggleStageCollapse: (stage: Stage) => void;
  setWorkspaceStatus: (
    status: 'valid' | 'missing' | 'invalid' | 'forbidden' | 'loading',
    root: string | null,
    message: string,
  ) => void;
}

/**
 * UI store for managing UI state in the webview.
 */
export const useUIStore = create<UIStoreState>((set) => ({
  // Initial state
  selectedTaskId: null,
  selectedStage: null,
  activeModal: null,
  modalData: null,
  viewMode: 'board',
  collapsedStages: new Set(),
  workspaceStatus: 'loading',
  workspaceRoot: null,
  workspaceMessage: 'Loading workspace...',

  // Actions
  selectTask: (id) =>
    set({
      selectedTaskId: id,
    }),

  selectStage: (stage) =>
    set({
      selectedStage: stage,
    }),

  openModal: (modal, data = null) =>
    set({
      activeModal: modal,
      modalData: data,
    }),

  closeModal: () =>
    set({
      activeModal: null,
      modalData: null,
    }),

  setViewMode: (mode) =>
    set({
      viewMode: mode,
    }),

  toggleStageCollapse: (stage) =>
    set((state) => {
      const newCollapsed = new Set(state.collapsedStages);
      if (newCollapsed.has(stage)) {
        newCollapsed.delete(stage);
      } else {
        newCollapsed.add(stage);
      }
      return { collapsedStages: newCollapsed };
    }),

  setWorkspaceStatus: (status, root, message) =>
    set({
      workspaceStatus: status,
      workspaceRoot: root,
      workspaceMessage: message,
    }),
}));

// ============================================================================
// Selectors
// ============================================================================

/**
 * Checks if a stage is collapsed.
 */
export function isStageCollapsed(state: UIStoreState, stage: Stage): boolean {
  return state.collapsedStages.has(stage);
}

/**
 * Checks if the workspace is ready for use.
 */
export function isWorkspaceReady(state: UIStoreState): boolean {
  return state.workspaceStatus === 'valid';
}

/**
 * Checks if a modal is currently open.
 */
export function isModalOpen(state: UIStoreState): boolean {
  return state.activeModal !== null;
}

/**
 * Gets the currently selected task ID.
 */
export function getSelectedTaskId(state: UIStoreState): string | null {
  return state.selectedTaskId;
}
