import React from 'react';
import type { Stage, Task } from '../../../types/task';
import type { Agent } from '../hooks/useTaskData';
import { STAGES } from '../../../core/constants';
import { TaskCard } from './TaskCard';

interface SwimlaneRow {
  stage: Stage;
  tasksByProject: Record<string, Task[]>;
}

interface BoardSwimlaneProps {
  rows: SwimlaneRow[];
  projects: string[];
  agents?: Agent[];
  isRunnerActive?: boolean;
  runningTaskId?: string | null;
  onRunTask?: (task: Task) => void;
  onMoveTask: (taskId: string, toStage: Stage, toProject?: string) => void;
  onOpenTask: (task: Task) => void;
  onFocusTask?: (task: Task) => void;
  onDeleteTask?: (task: Task) => void;
  onCopyXml?: (task: Task) => void;
  onShowMenu?: (task: Task, position: { x: number; y: number }) => void;
}

const INBOX_KEY = '__inbox__';

const STAGE_LABELS: Record<Stage, string> = {
  inbox: 'Inbox',
  plan: 'Plan',
  code: 'Code',
  audit: 'Audit',
  completed: 'Completed',
};

export const BoardSwimlane: React.FC<BoardSwimlaneProps> = ({
  rows,
  projects,
  agents,
  isRunnerActive,
  runningTaskId,
  onRunTask,
  onMoveTask,
  onOpenTask,
  onFocusTask,
  onDeleteTask,
  onCopyXml,
  onShowMenu,
}) => {
  const allColumns = [INBOX_KEY, ...projects];

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    const target = e.currentTarget as HTMLElement;
    target.classList.add('drop-active');
  };

  const handleDragLeave = (e: React.DragEvent) => {
    const target = e.currentTarget as HTMLElement;
    target.classList.remove('drop-active');
  };

  const handleDrop = (e: React.DragEvent, toStage: Stage, toProject: string) => {
    e.preventDefault();
    const target = e.currentTarget as HTMLElement;
    target.classList.remove('drop-active');

    // TaskCard uses 'application/task' data format
    const taskData = e.dataTransfer.getData('application/task');
    if (!taskData) return;

    try {
      const { id: taskId } = JSON.parse(taskData);
      const projectValue = toProject === INBOX_KEY ? undefined : toProject;
      onMoveTask(taskId, toStage, projectValue);
    } catch {
      // Invalid data format
    }
  };

  const getColumnLabel = (project: string) => {
    return project === INBOX_KEY ? 'Inbox' : project;
  };

  if (rows.length === 0) {
    return <div className="board-empty">No tasks</div>;
  }

  return (
    <div className="swimlane-grid">
      {/* Header row with project names */}
      <div className="swimlane-header-row">
        <div className="swimlane-stage-header">Stage</div>
        {allColumns.map((project) => (
          <div key={project} className="swimlane-project-header">
            {getColumnLabel(project)}
          </div>
        ))}
      </div>

      {/* Stage rows */}
      {STAGES.map((stage) => {
        const row = rows.find((r) => r.stage === stage);
        const tasksByProject = row?.tasksByProject || {};

        return (
          <div key={stage} className="swimlane-row">
            <div className={`swimlane-stage-label stage-${stage}`}>
              {STAGE_LABELS[stage]}
            </div>
            {allColumns.map((project) => {
              const tasks = tasksByProject[project] || [];
              return (
                <div
                  key={`${stage}-${project}`}
                  className="swimlane-cell"
                  onDragOver={handleDragOver}
                  onDragLeave={handleDragLeave}
                  onDrop={(e) => handleDrop(e, stage, project)}
                >
                  {tasks.length === 0 ? (
                    <div className="swimlane-cell-empty" />
                  ) : (
                    tasks.map((task) => (
                      <TaskCard
                        key={task.id}
                        task={task}
                        agents={agents}
                        isRunnerActive={isRunnerActive}
                        runningTaskId={runningTaskId}
                        onOpen={onOpenTask}
                        onEdit={onOpenTask}
                        onFocusTask={onFocusTask}
                        onDelete={onDeleteTask ? () => onDeleteTask(task) : undefined}
                        onCopyXml={onCopyXml ? () => onCopyXml(task) : undefined}
                        onShowMenu={onShowMenu}
                        onRunTask={onRunTask}
                      />
                    ))
                  )}
                </div>
              );
            })}
          </div>
        );
      })}
    </div>
  );
};
