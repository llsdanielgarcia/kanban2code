import React, { useState } from 'react';
import type { Stage, Task } from '../../../types/task';
import type { Agent } from '../hooks/useTaskData';
import { TaskCard } from './TaskCard';

const RUNNER_STAGES: Stage[] = ['plan', 'code', 'audit'];

interface ColumnProps {
  stage: Stage;
  title: string;
  tasks: Task[];
  agents?: Agent[];
  isRunnerActive?: boolean;
  runningTaskId?: string | null;
  onRunTopTask?: (stage: Stage) => void;
  onRunColumn?: (stage: Stage) => void;
  onStopRunner?: () => void;
  onRunTask?: (task: Task) => void;
  onMoveTask: (taskId: string, toStage: Stage) => void;
  onOpenTask: (task: Task) => void;
  onFocusTask?: (task: Task) => void;
  onDeleteTask?: (task: Task) => void;
  onCopyXml?: (task: Task) => void;
  onShowMenu?: (task: Task, position: { x: number; y: number }) => void;
}

export const Column: React.FC<ColumnProps> = ({
  stage,
  title,
  tasks,
  agents,
  isRunnerActive = false,
  runningTaskId,
  onRunTopTask,
  onRunColumn,
  onStopRunner,
  onRunTask,
  onMoveTask,
  onOpenTask,
  onFocusTask,
  onDeleteTask,
  onCopyXml,
  onShowMenu,
}) => {
  const [dropActive, setDropActive] = useState(false);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    setDropActive(true);
  };

  const handleDragLeave = () => setDropActive(false);

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDropActive(false);
    const raw = e.dataTransfer.getData('application/task');
    if (!raw) return;
    try {
      const data = JSON.parse(raw) as { id: string; stage: Stage };
      onMoveTask(data.id, stage);
    } catch {
      // ignore invalid drops
    }
  };

  return (
    <section
      className={`column stage-${stage} ${dropActive ? 'drop-active' : ''}`}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      aria-label={`${title} column`}
    >
      <header className="column-header">
        <div className="column-title">{title}</div>
        <div className="column-header-right">
          {RUNNER_STAGES.includes(stage) && (
            <div className="runner-controls">
              <button
                type="button"
                className="runner-btn"
                title="Run top task"
                disabled={isRunnerActive}
                onClick={() => onRunTopTask?.(stage)}
                aria-label="Run top task"
              >
                ▶
              </button>
              <button
                type="button"
                className="runner-btn"
                title="Run column"
                disabled={isRunnerActive}
                onClick={() => onRunColumn?.(stage)}
                aria-label="Run column"
              >
                ▶▶
              </button>
              {isRunnerActive && (
                <button
                  type="button"
                  className="runner-btn runner-btn-stop"
                  title="Stop runner"
                  onClick={() => onStopRunner?.()}
                  aria-label="Stop runner"
                >
                  ⏹
                </button>
              )}
            </div>
          )}
          <div className="column-count">{tasks.length}</div>
        </div>
      </header>
      <div className="column-body">
        {tasks.map((task) => (
          <TaskCard
            key={task.id}
            task={task}
            agents={agents}
            isRunnerActive={isRunnerActive}
            runningTaskId={runningTaskId}
            onOpen={onOpenTask}
            onEdit={onOpenTask}
            onFocusTask={onFocusTask}
            onDelete={onDeleteTask}
            onCopyXml={onCopyXml}
            onShowMenu={onShowMenu}
            onRunTask={onRunTask}
          />
        ))}
        {tasks.length === 0 && <div className="column-empty">No tasks</div>}
      </div>
    </section>
  );
};
