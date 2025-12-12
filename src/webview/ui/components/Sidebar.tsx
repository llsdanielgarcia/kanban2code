import React, { useMemo, useState, useEffect } from 'react';
import type { Task } from '../../../types/task';
import { createMessage } from '../../messaging';
import { useTaskData } from '../hooks/useTaskData';
import { useFilters } from '../hooks/useFilters';
import { useKeyboard } from '../hooks/useKeyboard';
import { SidebarToolbar } from './SidebarToolbar';
import { SidebarActions } from './SidebarActions';
import { QuickFilters } from './QuickFilters';
import { FilterBar } from './FilterBar';
import { QuickViews } from './QuickViews';
import { TaskTree } from './TaskTree';
import { EmptyState } from './EmptyState';
import { TaskModal } from './TaskModal';
import { TaskContextMenu } from './TaskContextMenu';
import { KeyboardHelp } from './KeyboardHelp';
import { MoveModal } from './MoveModal';
import { vscode } from '../vscodeApi';

function postMessage(type: string, payload: unknown) {
  if (vscode) {
    vscode.postMessage(createMessage(type as never, payload));
  }
}

interface SidebarProps {
  hasKanban: boolean;
}

export const Sidebar: React.FC<SidebarProps> = ({ hasKanban }) => {
  const { tasks, templates, isLoading } = useTaskData();
  const {
    filterState,
    toggleStage,
    setSelectedProject,
    addTag,
    removeTag,
    clearTags,
    setQuickView,
    clearAllFilters,
    hasActiveFilters,
    filterTasks,
  } = useFilters();

  const [showTaskModal, setShowTaskModal] = useState(false);
  const [showKeyboardHelp, setShowKeyboardHelp] = useState(false);
  const [moveModalTask, setMoveModalTask] = useState<Task | null>(null);
  const [contextMenuState, setContextMenuState] = useState<{ task: Task; position: { x: number; y: number } } | null>(null);
  const [selectedTaskId, setSelectedTaskId] = useState<string | null>(null);

  const filteredTasks = useMemo(() => filterTasks(tasks), [filterTasks, tasks]);

  // Ensure we keep a selected task for keyboard-triggered context menu
  useEffect(() => {
    if (!selectedTaskId && filteredTasks.length > 0) {
      setSelectedTaskId(filteredTasks[0].id);
    }
  }, [filteredTasks, selectedTaskId]);

  // Action handlers
  const handleCreateKanban = () => {
    postMessage('CreateKanban', {});
  };

  const handleOpenBoard = () => {
    postMessage('OpenBoard', {});
  };

  const handleOpenSettings = () => {
    postMessage('OpenSettings', {});
  };

  const handleNewTask = () => {
    setShowTaskModal(true);
  };

  const handleNewProject = () => {
    postMessage('CreateProject', {});
  };

  const handleNewContext = () => {
    postMessage('CreateContext', {});
  };

  const handleNewAgent = () => {
    postMessage('CreateAgent', {});
  };

  const handleNewTemplate = () => {
    postMessage('CreateTemplate', {});
  };

  const handleTaskClick = (task: Task) => {
    setSelectedTaskId(task.id);
    postMessage('OpenTask', { taskId: task.id, filePath: task.filePath });
  };

  const handleTaskContextMenu = (e: React.MouseEvent, task: Task) => {
    e.preventDefault();
    setSelectedTaskId(task.id);
    setContextMenuState({ task, position: { x: e.clientX, y: e.clientY } });
  };

  const handleCloseContextMenu = () => setContextMenuState(null);

  const handleOpenMoveModal = (task: Task) => {
    setContextMenuState(null);
    setMoveModalTask(task);
  };

  const openContextMenuForSelected = () => {
    if (!filteredTasks.length) return;
    const task = filteredTasks.find((t) => t.id === selectedTaskId) ?? filteredTasks[0];
    setSelectedTaskId(task.id);
    setContextMenuState({
      task,
      position: { x: window.innerWidth / 2, y: window.innerHeight / 2 },
    });
  };

  const focusTaskByOffset = (offset: number) => {
    const elements = Array.from(document.querySelectorAll<HTMLDivElement>('.task-item'));
    if (!elements.length) return;

    const currentIndex = elements.findIndex((el) => el.dataset.taskId === selectedTaskId);
    const nextIndex = Math.min(
      elements.length - 1,
      Math.max(0, currentIndex >= 0 ? currentIndex + offset : 0)
    );
    const nextEl = elements[nextIndex];
    if (nextEl) {
      nextEl.focus();
      setSelectedTaskId(nextEl.dataset.taskId ?? null);
    }
  };

  const openSelectedTask = () => {
    if (!filteredTasks.length) return;
    const task = filteredTasks.find((t) => t.id === selectedTaskId) ?? filteredTasks[0];
    handleTaskClick(task);
  };

  // Keyboard shortcuts
  const { shortcuts } = useKeyboard({
    onFocusNext: () => focusTaskByOffset(1),
    onFocusPrev: () => focusTaskByOffset(-1),
    onNewTask: handleNewTask,
    onNewTaskModal: handleNewTask,
    onShowHelp: () => setShowKeyboardHelp(true),
    onOpenContextMenu: openContextMenuForSelected,
    onActivate: openSelectedTask,
    onToggle: openSelectedTask,
    onFocusFilter: () => {
      document.querySelector<HTMLButtonElement>('.filter-toggle-btn')?.focus();
    },
    onEscape: () => {
      if (contextMenuState) {
        handleCloseContextMenu();
        return;
      }
      if (moveModalTask) {
        setMoveModalTask(null);
        return;
      }
      if (showKeyboardHelp) {
        setShowKeyboardHelp(false);
        return;
      }
    },
  });

  // Empty state - no kanban workspace
  if (!hasKanban) {
    return (
      <div className="sidebar glass-panel">
        <SidebarToolbar onOpenBoard={handleOpenBoard} onOpenSettings={handleOpenSettings} />
        <EmptyState onCreateKanban={handleCreateKanban} />
      </div>
    );
  }

  // Loading state
  if (isLoading) {
    return (
      <div className="sidebar glass-panel">
        <SidebarToolbar onOpenBoard={handleOpenBoard} onOpenSettings={handleOpenSettings} />
        <div className="sidebar-loading">
          <div className="loading-spinner" />
          <span>Loading tasks...</span>
        </div>
      </div>
    );
  }

  // Active state with tasks
  return (
    <div className="sidebar glass-panel">
      <SidebarToolbar onOpenBoard={handleOpenBoard} onOpenSettings={handleOpenSettings} />

      <SidebarActions
        onNewTask={handleNewTask}
        onNewProject={handleNewProject}
        onNewContext={handleNewContext}
        onNewAgent={handleNewAgent}
        onNewTemplate={handleNewTemplate}
      />

      <QuickViews activeView={filterState.quickView} onSetView={setQuickView} />

      <QuickFilters activeStages={filterState.activeStages} onToggleStage={toggleStage} />

      <FilterBar
        tasks={tasks}
        selectedProject={filterState.selectedProject}
        selectedTags={filterState.selectedTags}
        onSetProject={setSelectedProject}
        onAddTag={addTag}
        onRemoveTag={removeTag}
        onClearFilters={() => {
          clearTags();
          clearAllFilters();
        }}
        hasActiveFilters={hasActiveFilters}
      />

      <TaskTree
        tasks={filteredTasks}
        activeStages={filterState.activeStages}
        onTaskClick={handleTaskClick}
        onTaskContextMenu={handleTaskContextMenu}
      />

      {showTaskModal && (
        <TaskModal
          isOpen={showTaskModal}
          tasks={tasks}
          templates={templates}
          onClose={() => setShowTaskModal(false)}
        />
      )}

      {contextMenuState && (
        <TaskContextMenu
          task={contextMenuState.task}
          position={contextMenuState.position}
          onClose={handleCloseContextMenu}
          onOpenMoveModal={handleOpenMoveModal}
        />
      )}

      {moveModalTask && (
        <MoveModal
          isOpen={!!moveModalTask}
          task={moveModalTask}
          allTasks={tasks}
          onClose={() => setMoveModalTask(null)}
        />
      )}

      {showKeyboardHelp && (
        <KeyboardHelp
          shortcuts={shortcuts}
          onClose={() => setShowKeyboardHelp(false)}
        />
      )}
    </div>
  );
};
