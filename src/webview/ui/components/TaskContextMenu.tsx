import React, { useMemo } from 'react';
import type { Task, Stage } from '../../../types/task';
import { ContextMenu, type ContextMenuItem } from './ContextMenu';
import { createMessage } from '../../messaging';
import { vscode } from '../vscodeApi';

function postMessage(type: string, payload: unknown) {
  if (vscode) {
    vscode.postMessage(createMessage(type as never, payload));
  }
}

interface TaskContextMenuProps {
  task: Task;
  position: { x: number; y: number };
  onClose: () => void;
  onOpenMoveModal?: (task: Task) => void;
}

const STAGES: Stage[] = ['inbox', 'plan', 'code', 'audit', 'completed'];

const STAGE_LABELS: Record<Stage, string> = {
  inbox: 'Inbox',
  plan: 'Plan',
  code: 'Code',
  audit: 'Audit',
  completed: 'Completed',
};

export const TaskContextMenu: React.FC<TaskContextMenuProps> = ({
  task,
  position,
  onClose,
  onOpenMoveModal,
}) => {
  const menuItems: ContextMenuItem[] = useMemo(() => {
    const items: ContextMenuItem[] = [
      // Copy actions
      {
        id: 'copy-full',
        label: 'Copy XML (Full Context)',
        action: () => postMessage('CopyContext', { taskId: task.id, mode: 'full_xml' }),
      },
      {
        id: 'copy-task',
        label: 'Copy Task Only',
        action: () => postMessage('CopyContext', { taskId: task.id, mode: 'task_only' }),
      },
      {
        id: 'copy-context',
        label: 'Copy Context Only',
        action: () => postMessage('CopyContext', { taskId: task.id, mode: 'context_only' }),
      },
      { id: 'div1', label: '', divider: true },
      
      // Stage change submenu
      {
        id: 'change-stage',
        label: 'Change Stage',
        submenu: STAGES.filter((s) => s !== task.stage).map((stage) => ({
          id: `stage-${stage}`,
          label: STAGE_LABELS[stage],
          action: () => postMessage('MoveTask', { taskId: task.id, toStage: stage }),
        })),
      },
    ];

    // Quick action for code -> audit
    if (task.stage === 'code') {
      items.push({
        id: 'mark-done',
        label: 'Mark Implementation Done',
        action: () => postMessage('MoveTask', { taskId: task.id, toStage: 'audit' }),
      });
    }

    items.push({ id: 'div2', label: '', divider: true });

    // Move to project/phase
    items.push({
      id: 'move-to',
      label: 'Move to Project/Phase…',
      action: () => {
        if (onOpenMoveModal) {
          onOpenMoveModal(task);
        }
      },
    });

    // Archive (only for completed tasks)
    items.push({
      id: 'archive',
      label: 'Archive',
      disabled: task.stage !== 'completed',
      action: () => postMessage('ArchiveTask', { taskId: task.id }),
    });

    // Delete
    items.push({
      id: 'delete',
      label: 'Delete Task',
      action: () => {
        if (window.confirm(`Delete task "${task.title}"?`)) {
          postMessage('DeleteTask', { taskId: task.id });
        }
      },
    });

    return items;
  }, [task, onOpenMoveModal]);

  return (
    <ContextMenu
      items={menuItems}
      position={position}
      onClose={onClose}
    />
  );
};
