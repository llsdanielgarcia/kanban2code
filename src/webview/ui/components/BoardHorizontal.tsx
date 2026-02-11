import React from 'react';
import type { Stage, Task } from '../../../types/task';
import type { Agent } from '../hooks/useTaskData';
import { STAGES } from '../../../core/constants';
import { Column } from './Column';

interface BoardHorizontalProps {
  tasksByStage: Record<Stage, Task[]>;
  agents?: Agent[];
  isRunnerActive?: boolean;
  onRunTopTask?: (stage: Stage) => void;
  onRunColumn?: (stage: Stage) => void;
  onStopRunner?: () => void;
  onMoveTask: (taskId: string, toStage: Stage) => void;
  onOpenTask: (task: Task) => void;
  onFocusTask?: (task: Task) => void;
  onDeleteTask?: (task: Task) => void;
  onCopyXml?: (task: Task) => void;
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
  agents,
  isRunnerActive,
  onRunTopTask,
  onRunColumn,
  onStopRunner,
  onMoveTask,
  onOpenTask,
  onFocusTask,
  onDeleteTask,
  onCopyXml,
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
          agents={agents}
          isRunnerActive={isRunnerActive}
          onRunTopTask={onRunTopTask}
          onRunColumn={onRunColumn}
          onStopRunner={onStopRunner}
          onMoveTask={onMoveTask}
          onOpenTask={onOpenTask}
          onFocusTask={onFocusTask}
          onDeleteTask={onDeleteTask}
          onCopyXml={onCopyXml}
          onShowMenu={onShowMenu}
        />
      ))}
    </div>
  );
};
