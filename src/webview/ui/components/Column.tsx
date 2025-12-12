import React, { useState } from 'react';
import type { Stage, Task } from '../../../types/task';
import { TaskCard } from './TaskCard';

interface ColumnProps {
  stage: Stage;
  title: string;
  tasks: Task[];
  onMoveTask: (taskId: string, toStage: Stage) => void;
  onOpenTask: (task: Task) => void;
  onFocusTask?: (task: Task) => void;
  onDeleteTask?: (task: Task) => void;
  onCopyXml?: (task: Task) => void;
  onOpenFile?: (task: Task) => void;
  onShowMenu?: (task: Task, position: { x: number; y: number }) => void;
}

export const Column: React.FC<ColumnProps> = ({
  stage,
  title,
  tasks,
  onMoveTask,
  onOpenTask,
  onFocusTask,
  onDeleteTask,
  onCopyXml,
  onOpenFile,
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
        <div className="column-count">{tasks.length}</div>
      </header>
      <div className="column-body">
        {tasks.map((task) => (
          <TaskCard
            key={task.id}
            task={task}
            onOpen={onOpenTask}
            onFocusTask={onFocusTask}
            onDelete={onDeleteTask}
            onCopyXml={onCopyXml}
            onOpenFile={onOpenFile}
            onShowMenu={onShowMenu}
          />
        ))}
        {tasks.length === 0 && <div className="column-empty">No tasks</div>}
      </div>
    </section>
  );
};
