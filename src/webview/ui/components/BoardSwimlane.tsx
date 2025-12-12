import React from 'react';
import type { Stage, Task } from '../../../types/task';
import { Swimlane } from './Swimlane';

interface BoardSwimlaneProps {
  swimlanes: Array<{ key: string; label: string; tasksByStage: Record<Stage, Task[]> }>;
  onMoveTask: (taskId: string, toStage: Stage) => void;
  onOpenTask: (task: Task) => void;
  onFocusTask?: (task: Task) => void;
  onDeleteTask?: (task: Task) => void;
  onCopyXml?: (task: Task) => void;
  onOpenFile?: (task: Task) => void;
  onShowMenu?: (task: Task, position: { x: number; y: number }) => void;
}

export const BoardSwimlane: React.FC<BoardSwimlaneProps> = ({
  swimlanes,
  onMoveTask,
  onOpenTask,
  onFocusTask,
  onDeleteTask,
  onCopyXml,
  onOpenFile,
  onShowMenu,
}) => {
  return (
    <div className="board-swimlane">
      {swimlanes.map((lane) => (
        <Swimlane
          key={lane.key}
          label={lane.label}
          tasksByStage={lane.tasksByStage}
          onMoveTask={onMoveTask}
          onOpenTask={onOpenTask}
          onFocusTask={onFocusTask}
          onDeleteTask={onDeleteTask}
          onCopyXml={onCopyXml}
          onOpenFile={onOpenFile}
          onShowMenu={onShowMenu}
        />
      ))}
      {swimlanes.length === 0 && <div className="board-empty">No tasks</div>}
    </div>
  );
};
