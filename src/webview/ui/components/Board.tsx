import React, { useEffect, useMemo, useRef, useState, useCallback } from 'react';
import type { Task, Stage } from '../../../types/task';
import type { FilterState } from '../../../types/filters';
import { createMessage } from '../../messaging';
import { vscode } from '../vscodeApi';
import { isTransitionAllowed } from '../../../core/rules';
import { useTaskData } from '../hooks/useTaskData';
import { useBoardLayout } from '../hooks/useBoardLayout';
import { useKeyboard } from '../hooks/useKeyboard';
import { BoardHeader } from './BoardHeader';
import { BoardHorizontal } from './BoardHorizontal';
import { BoardSwimlane } from './BoardSwimlane';
import { EmptyState } from './EmptyState';
import { TaskModal } from './TaskModal';
import { KeyboardHelp } from './KeyboardHelp';
import { TaskContextMenu } from './TaskContextMenu';

function postMessage(type: string, payload: unknown) {
  if (vscode) {
    vscode.postMessage(createMessage(type as never, payload));
  }
}

interface BoardProps {
  hasKanban: boolean;
  showKeyboardShortcutsNonce?: number;
  toggleLayoutNonce?: number;
}

function applyFilters(tasks: Task[], filters: FilterState | null, search: string): Task[] {
  const term = search.trim().toLowerCase();
  return tasks.filter((task) => {
    if (filters?.stages?.length && !filters.stages.includes(task.stage)) return false;

    const project = filters?.project;
    if (project && project !== '') {
      if (project === '__inbox__') {
        if (task.project) return false;
      } else if (task.project !== project) {
        return false;
      }
    }

    if (filters?.tags?.length) {
      const taskTags = task.tags || [];
      if (!filters.tags.every((t) => taskTags.includes(t))) return false;
    }

    if (term) {
      const hay = `${task.title}\n${task.content}`.toLowerCase();
      if (!hay.includes(term)) return false;
    }

    return true;
  });
}

export const Board: React.FC<BoardProps> = ({
  hasKanban,
  showKeyboardShortcutsNonce = 0,
  toggleLayoutNonce = 0,
}) => {
  const { tasks, templates, projects, phasesByProject, isLoading, error, filterState } = useTaskData();
  const { layout, setLayout } = useBoardLayout('columns');
  const [search, setSearch] = useState('');
  const [showTaskModal, setShowTaskModal] = useState(false);
  const [showKeyboardHelp, setShowKeyboardHelp] = useState(false);
  const [focusedTaskId, setFocusedTaskId] = useState<string | null>(null);
  const [contextMenu, setContextMenu] = useState<{ task: Task; position: { x: number; y: number } } | null>(null);
  const lastToggleLayoutNonce = useRef(0);

  const filteredTasks = useMemo(
    () => applyFilters(tasks, filterState, search),
    [tasks, filterState, search],
  );

  const focusedTask = useMemo(() => {
    if (!filteredTasks.length) return null;
    if (!focusedTaskId) return filteredTasks[0];
    return filteredTasks.find((t) => t.id === focusedTaskId) ?? filteredTasks[0];
  }, [filteredTasks, focusedTaskId]);

  useEffect(() => {
    if (!filteredTasks.length) {
      setFocusedTaskId(null);
      return;
    }
    if (!focusedTaskId) {
      setFocusedTaskId(filteredTasks[0].id);
      return;
    }
    if (!filteredTasks.some((t) => t.id === focusedTaskId)) {
      setFocusedTaskId(filteredTasks[0].id);
    }
  }, [filteredTasks, focusedTaskId]);

  useEffect(() => {
    if (showKeyboardShortcutsNonce > 0) {
      setShowKeyboardHelp(true);
    }
  }, [showKeyboardShortcutsNonce]);

  useEffect(() => {
    if (toggleLayoutNonce <= lastToggleLayoutNonce.current) return;
    lastToggleLayoutNonce.current = toggleLayoutNonce;
    setLayout(layout === 'columns' ? 'swimlanes' : 'columns');
  }, [toggleLayoutNonce, layout, setLayout]);

  const tasksByStage = useMemo(() => {
    const map = {
      inbox: [] as Task[],
      plan: [] as Task[],
      code: [] as Task[],
      audit: [] as Task[],
      completed: [] as Task[],
    };
    for (const task of filteredTasks) {
      map[task.stage].push(task);
    }
    return map;
  }, [filteredTasks]);

  const swimlanes = useMemo(() => {
    const lanes = new Map<string, { label: string; tasksByStage: Record<Stage, Task[]> }>();
    for (const task of filteredTasks) {
      const project = task.project || 'Inbox';
      const phase = task.phase || '';
      const key = `${project}/${phase}`;
      if (!lanes.has(key)) {
        lanes.set(key, {
          label: phase ? `${project} / ${phase}` : project,
          tasksByStage: {
            inbox: [],
            plan: [],
            code: [],
            audit: [],
            completed: [],
          },
        });
      }
      lanes.get(key)!.tasksByStage[task.stage].push(task);
    }
    return Array.from(lanes.entries()).map(([key, v]) => ({ key, ...v }));
  }, [filteredTasks]);

  const handleMoveTask = (taskId: string, toStage: Stage) => {
    const task = tasks.find((t) => t.id === taskId);
    if (!task) return;
    if (!isTransitionAllowed(task.stage, toStage)) {
      postMessage('ALERT', { text: `Cannot move from ${task.stage} to ${toStage}` });
      return;
    }
    postMessage('MoveTask', { taskId, toStage });
  };

  const handleOpenTask = (task: Task) => {
    setFocusedTaskId(task.id);
    postMessage('OpenTask', { taskId: task.id, filePath: task.filePath });
  };

  const toggleBoardLayout = () => {
    setLayout(layout === 'columns' ? 'swimlanes' : 'columns');
  };

  const copyFocused = (mode: 'full_xml' | 'task_only' | 'context_only') => {
    if (!focusedTask) return;
    postMessage('CopyContext', { taskId: focusedTask.id, mode });
  };

  const moveFocusedToStage = (stage: Stage) => {
    if (!focusedTask) return;
    handleMoveTask(focusedTask.id, stage);
  };

  const archiveFocused = () => {
    if (!focusedTask) return;
    if (focusedTask.stage !== 'completed') return;
    postMessage('ArchiveTask', { taskId: focusedTask.id });
  };

  const deleteFocused = () => {
    if (!focusedTask) return;
    postMessage('DeleteTask', { taskId: focusedTask.id });
  };

  // Card action handlers
  const handleDeleteTask = useCallback((task: Task) => {
    postMessage('DeleteTask', { taskId: task.id });
  }, []);

  const handleCopyXml = useCallback((task: Task) => {
    postMessage('CopyContext', { taskId: task.id, mode: 'full_xml' });
  }, []);

  const handleOpenFile = useCallback((task: Task) => {
    postMessage('OpenTask', { taskId: task.id, filePath: task.filePath });
  }, []);

  const handleShowMenu = useCallback((task: Task, position: { x: number; y: number }) => {
    setContextMenu({ task, position });
  }, []);

  const handleCloseContextMenu = useCallback(() => {
    setContextMenu(null);
  }, []);

  const { shortcuts } = useKeyboard({
    enabled: hasKanban,
    onNewTask: () => setShowTaskModal(true),
    onNewTaskModal: () => setShowTaskModal(true),
    onShowHelp: () => setShowKeyboardHelp(true),
    onCopyContext: () => copyFocused('full_xml'),
    onCopyTaskOnly: () => copyFocused('task_only'),
    onToggleLayout: toggleBoardLayout,
    onMoveToStage: moveFocusedToStage,
    onArchive: archiveFocused,
    onDelete: deleteFocused,
    onEscape: () => {
      if (showKeyboardHelp) {
        setShowKeyboardHelp(false);
        return;
      }
      if (showTaskModal) {
        setShowTaskModal(false);
      }
    },
  });

  if (!hasKanban) {
    return (
      <div className="board-container">
        <EmptyState onCreateKanban={() => postMessage('CreateKanban', {})} />
      </div>
    );
  }

  return (
    <div className="board-container">
      <BoardHeader
        layout={layout}
        onLayoutChange={setLayout}
        search={search}
        onSearchChange={setSearch}
        onNewTask={() => setShowTaskModal(true)}
      />

      {isLoading && <div className="board-loading">Loading tasks…</div>}
      {error && <div className="board-error">{error}</div>}

      {!isLoading && !error && layout === 'columns' && (
        <BoardHorizontal
          tasksByStage={tasksByStage}
          onMoveTask={handleMoveTask}
          onOpenTask={handleOpenTask}
          onFocusTask={(task) => setFocusedTaskId(task.id)}
          onDeleteTask={handleDeleteTask}
          onCopyXml={handleCopyXml}
          onOpenFile={handleOpenFile}
          onShowMenu={handleShowMenu}
        />
      )}

      {!isLoading && !error && layout === 'swimlanes' && (
        <BoardSwimlane
          swimlanes={swimlanes}
          onMoveTask={handleMoveTask}
          onOpenTask={handleOpenTask}
          onFocusTask={(task) => setFocusedTaskId(task.id)}
          onDeleteTask={handleDeleteTask}
          onCopyXml={handleCopyXml}
          onOpenFile={handleOpenFile}
          onShowMenu={handleShowMenu}
        />
      )}

      {showTaskModal && (
        <TaskModal
          isOpen={showTaskModal}
          tasks={tasks}
          templates={templates}
          projects={projects}
          phasesByProject={phasesByProject}
          onClose={() => setShowTaskModal(false)}
        />
      )}

      {showKeyboardHelp && (
        <KeyboardHelp shortcuts={shortcuts} onClose={() => setShowKeyboardHelp(false)} />
      )}

      {contextMenu && (
        <TaskContextMenu
          task={contextMenu.task}
          position={contextMenu.position}
          onClose={handleCloseContextMenu}
        />
      )}
    </div>
  );
};
