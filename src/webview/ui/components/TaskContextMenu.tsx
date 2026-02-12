import React, { useCallback, useMemo } from 'react';
import type { Task, Stage } from '../../../types/task';
import { ContextMenu, type ContextMenuItem } from './ContextMenu';
import { createMessage } from '../../messaging';
import { vscode } from '../vscodeApi';
import type { Agent, Mode } from '../hooks/useTaskData';

function postMessage(type: string, payload: unknown) {
  if (vscode) {
    vscode.postMessage(createMessage(type as never, payload));
  }
}

interface TaskContextMenuProps {
  task: Task;
  modes?: Mode[];
  agents?: Agent[];
  isRunnerActive?: boolean;
  position: { x: number; y: number };
  onClose: () => void;
  onOpenMoveModal?: (task: Task) => void;
  onEditTask?: (task: Task) => void;
  onOpenInVSCode?: (task: Task) => void;
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
  modes = [],
  agents = [],
  isRunnerActive = false,
  position,
  onClose,
  onOpenMoveModal,
  onEditTask,
  onOpenInVSCode,
}) => {
  const updateTaskMetadata = useCallback((overrides: { mode?: string | null; agent?: string | null }) => {
    postMessage('SaveTaskWithMetadata', {
      taskId: task.id,
      content: task.content,
      metadata: {
        title: task.title,
        location: task.project
          ? { type: 'project', project: task.project, phase: task.phase }
          : { type: 'inbox' },
        agent: overrides.agent !== undefined ? overrides.agent : task.agent || null,
        mode: overrides.mode !== undefined ? overrides.mode : task.mode || null,
        contexts: task.contexts || [],
        skills: task.skills || [],
        tags: task.tags || [],
      },
    });
  }, [task]);

  const menuItems: ContextMenuItem[] = useMemo(() => {
    const canRunTask = task.stage === 'plan' || task.stage === 'code' || task.stage === 'audit';
    const availableModes = modes.filter((mode) => mode.id !== task.mode && mode.name !== task.mode);
    const availableAgents = agents.filter(
      (agent) => agent.id !== task.agent && agent.name !== task.agent,
    );

    const items: ContextMenuItem[] = [
      {
        id: 'edit',
        label: 'Edit Task',
        disabled: !onEditTask,
        action: () => onEditTask?.(task),
      },
      {
        id: 'open-in-vscode',
        label: 'Open in VS Code',
        action: () => {
          if (onOpenInVSCode) {
            onOpenInVSCode(task);
            return;
          }
          postMessage('OpenTask', { taskId: task.id, filePath: task.filePath });
        },
      },
      { id: 'div0', label: '', divider: true },
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
      {
        id: 'run-task',
        label: 'Run Task',
        disabled: isRunnerActive || !canRunTask,
        action: () => postMessage('RunTask', { taskId: task.id }),
      },
      {
        id: 'change-mode',
        label: 'Change Mode',
        submenu:
          availableModes.length > 0
            ? availableModes.map((mode) => ({
                id: `mode-${mode.id}`,
                label: mode.name,
                action: () => updateTaskMetadata({ mode: mode.id }),
              }))
            : [{ id: 'mode-none', label: 'No modes available', disabled: true }],
      },
      {
        id: 'change-agent',
        label: 'Change Agent',
        submenu:
          availableAgents.length > 0
            ? availableAgents.map((agent) => ({
                id: `agent-${agent.id}`,
                label: agent.name,
                action: () => updateTaskMetadata({ agent: agent.id }),
              }))
            : [{ id: 'agent-none', label: 'No providers available', disabled: true }],
      },
      { id: 'div15', label: '', divider: true },
      
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

    // Follow-up task in inbox
    items.push({
      id: 'follow-up',
      label: 'Add Follow-up in Inbox…',
      action: () => {
        const title = window.prompt('Follow-up task title', `Follow-up: ${task.title}`)?.trim();
        if (!title) return;
        postMessage('CreateTask', {
          title,
          stage: 'inbox',
          location: 'inbox',
          parent: task.id,
        });
      },
    });

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
        postMessage('DeleteTask', { taskId: task.id });
      },
    });

    return items;
  }, [
    task,
    modes,
    agents,
    isRunnerActive,
    onOpenMoveModal,
    onEditTask,
    onOpenInVSCode,
    updateTaskMetadata,
  ]);

  return (
    <ContextMenu
      items={menuItems}
      position={position}
      onClose={onClose}
    />
  );
};
