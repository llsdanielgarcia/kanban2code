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
import { TaskEditorModal } from './TaskEditorModal';
import { ContextModal } from './ContextModal';
import { AgentModal } from './AgentModal';
import { ProjectModal } from './ProjectModal';

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

    // Hide tasks from hidden projects (inbox tasks are never hidden)
    if (filters?.hiddenProjects?.length && task.project) {
      if (filters.hiddenProjects.includes(task.project)) return false;
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
  const {
    tasks,
    contexts,
    agents,
    modes,
    projects,
    phasesByProject,
    isLoading,
    error,
    filterState,
    isRunnerActive,
  } = useTaskData();
  const { layout, setLayout } = useBoardLayout('columns');
  const [search, setSearch] = useState('');
  const [showTaskModal, setShowTaskModal] = useState(false);
  const [showKeyboardHelp, setShowKeyboardHelp] = useState(false);
  const [showContextModal, setShowContextModal] = useState(false);
  const [showAgentModal, setShowAgentModal] = useState(false);
  const [showProjectModal, setShowProjectModal] = useState(false);
  const [focusedTaskId, setFocusedTaskId] = useState<string | null>(null);
  const [contextMenu, setContextMenu] = useState<{ task: Task; position: { x: number; y: number } } | null>(null);
  const [editorTask, setEditorTask] = useState<Task | null>(null);
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

  // New swimlane format: rows = stages, columns = projects
  const INBOX_KEY = '__inbox__';

  const swimlaneRows = useMemo(() => {
    const stages: Stage[] = ['inbox', 'plan', 'code', 'audit', 'completed'];
    const rows: Array<{ stage: Stage; tasksByProject: Record<string, Task[]> }> = stages.map((stage) => ({
      stage,
      tasksByProject: {},
    }));

    for (const task of filteredTasks) {
      const projectKey = task.project || INBOX_KEY;
      const row = rows.find((r) => r.stage === task.stage);
      if (row) {
        if (!row.tasksByProject[projectKey]) {
          row.tasksByProject[projectKey] = [];
        }
        row.tasksByProject[projectKey].push(task);
      }
    }

    return rows;
  }, [filteredTasks]);

  // Extract unique project names (excluding inbox and hidden projects)
  const swimlaneProjects = useMemo(() => {
    const projectSet = new Set<string>();
    const hidden = filterState?.hiddenProjects || [];
    for (const task of filteredTasks) {
      if (task.project && !hidden.includes(task.project)) {
        projectSet.add(task.project);
      }
    }
    return Array.from(projectSet).sort();
  }, [filteredTasks, filterState?.hiddenProjects]);

  const handleMoveTask = (taskId: string, toStage: Stage, toProject?: string) => {
    const task = tasks.find((t) => t.id === taskId);
    if (!task) return;
    if (!isTransitionAllowed(task.stage, toStage)) {
      postMessage('ALERT', { text: `Cannot move from ${task.stage} to ${toStage}` });
      return;
    }
    postMessage('MoveTask', { taskId, toStage, toProject });
  };

  const handleOpenTask = (task: Task) => {
    setFocusedTaskId(task.id);
    setEditorTask(task);
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
      if (editorTask) {
        setEditorTask(null);
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
          agents={agents}
          onMoveTask={handleMoveTask}
          onOpenTask={handleOpenTask}
          onFocusTask={(task) => setFocusedTaskId(task.id)}
          onDeleteTask={handleDeleteTask}
          onCopyXml={handleCopyXml}
          onShowMenu={handleShowMenu}
        />
      )}

      {!isLoading && !error && layout === 'swimlanes' && (
        <BoardSwimlane
          rows={swimlaneRows}
          projects={swimlaneProjects}
          agents={agents}
          onMoveTask={handleMoveTask}
          onOpenTask={handleOpenTask}
          onFocusTask={(task) => setFocusedTaskId(task.id)}
          onDeleteTask={handleDeleteTask}
          onCopyXml={handleCopyXml}
          onShowMenu={handleShowMenu}
        />
      )}

      {showTaskModal && (
        <TaskModal
          isOpen={showTaskModal}
          tasks={tasks}
          contexts={contexts}
          agents={agents}
          modes={modes}
          projects={projects}
          phasesByProject={phasesByProject}
          onClose={() => setShowTaskModal(false)}
          onOpenContextModal={() => {
            setShowTaskModal(false);
            setShowContextModal(true);
          }}
          onOpenAgentModal={() => {
            setShowTaskModal(false);
            setShowAgentModal(true);
          }}
        />
      )}

      {showContextModal && (
        <ContextModal
          isOpen={showContextModal}
          projects={projects}
          onClose={() => setShowContextModal(false)}
        />
      )}

      {showAgentModal && (
        <AgentModal
          isOpen={showAgentModal}
          onClose={() => setShowAgentModal(false)}
        />
      )}

      {showProjectModal && (
        <ProjectModal
          isOpen={showProjectModal}
          onClose={() => setShowProjectModal(false)}
        />
      )}

      {showKeyboardHelp && (
        <KeyboardHelp shortcuts={shortcuts} onClose={() => setShowKeyboardHelp(false)} />
      )}

      {contextMenu && (
        <TaskContextMenu
          task={contextMenu.task}
          modes={modes}
          agents={agents}
          isRunnerActive={isRunnerActive}
          position={contextMenu.position}
          onClose={handleCloseContextMenu}
          onEditTask={(task) => {
            handleCloseContextMenu();
            setEditorTask(task);
          }}
          onOpenInVSCode={(task) => {
            handleCloseContextMenu();
            postMessage('OpenTask', { taskId: task.id, filePath: task.filePath });
          }}
        />
      )}

      {editorTask && (
        <TaskEditorModal
          isOpen={!!editorTask}
          task={editorTask}
          onClose={() => setEditorTask(null)}
        />
      )}
    </div>
  );
};
