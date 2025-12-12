import React from 'react';
import type { Stage, Task } from '../../../types/task';
import { STAGES } from '../../../core/constants';
import { Column } from './Column';

interface BoardHorizontalProps {
  tasksByStage: Record<Stage, Task[]>;
  onMoveTask: (taskId: string, toStage: Stage) => void;
  onOpenTask: (task: Task) => void;
  onFocusTask?: (task: Task) => void;
  onDeleteTask?: (task: Task) => void;
  onCopyXml?: (task: Task) => void;
  onOpenFile?: (task: Task) => void;
  onShowMenu?: (task: Task, position: { x: number; y: number }) => void;
}

const STAGE_TITLES: Record<Stage, string> = {
  inbox: 'Inbox',
  plan: 'Plan',
  code: 'Code',
  audit: 'Audit',
  completed: 'Completed',
};

export const BoardHorizontal: React.FC<BoardHorizontalProps> = ({
  tasksByStage,
  onMoveTask,
  onOpenTask,
  onFocusTask,
  onDeleteTask,
  onCopyXml,
  onOpenFile,
  onShowMenu,
}) => {
  return (
    <div className="board-horizontal">
      {STAGES.map((stage) => (
        <Column
          key={stage}
          stage={stage}
          title={STAGE_TITLES[stage]}
          tasks={tasksByStage[stage] || []}
          onMoveTask={onMoveTask}
          onOpenTask={onOpenTask}
          onFocusTask={onFocusTask}
          onDeleteTask={onDeleteTask}
          onCopyXml={onCopyXml}
          onOpenFile={onOpenFile}
          onShowMenu={onShowMenu}
        />
      ))}
    </div>
  );
};
