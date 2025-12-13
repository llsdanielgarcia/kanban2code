import React from 'react';
import type { Stage, Task } from '../../../types/task';
import { STAGES } from '../../../core/constants';
import { Column } from './Column';

interface SwimlaneProps {
  label: string;
  tasksByStage: Record<Stage, Task[]>;
  onMoveTask: (taskId: string, toStage: Stage) => void;
  onOpenTask: (task: Task) => void;
  onFocusTask?: (task: Task) => void;
  onDeleteTask?: (task: Task) => void;
  onCopyXml?: (task: Task) => void;
  onShowMenu?: (task: Task, position: { x: number; y: number }) => void;
}

export const Swimlane: React.FC<SwimlaneProps> = ({
  label,
  tasksByStage,
  onMoveTask,
  onOpenTask,
  onFocusTask,
  onDeleteTask,
  onCopyXml,
  onShowMenu,
}) => {
  return (
    <div className="swimlane">
      <div className="swimlane-label">{label}</div>
      <div className="swimlane-columns">
        {STAGES.map((stage) => (
          <Column
            key={stage}
            stage={stage}
            title=""
            tasks={tasksByStage[stage] || []}
            onMoveTask={onMoveTask}
            onOpenTask={onOpenTask}
            onFocusTask={onFocusTask}
            onDeleteTask={onDeleteTask}
            onCopyXml={onCopyXml}
            onShowMenu={onShowMenu}
          />
        ))}
      </div>
    </div>
  );
};
