import React, { useState, useMemo } from 'react';
import type { Task } from '../../../types/task';
import { EditIcon, TrashIcon, MoreIcon, ClipboardIcon, AgentIcon } from './Icons';
import { getDisplayTitle } from '../../../utils/text';
import type { Agent } from '../hooks/useTaskData';

interface TaskCardProps {
  task: Task;
  agents?: Agent[];
  onOpen: (task: Task) => void;
  onFocusTask?: (task: Task) => void;
  onDelete?: (task: Task) => void;
  onCopyXml?: (task: Task) => void;
  onEdit?: (task: Task) => void;
  onShowMenu?: (task: Task, position: { x: number; y: number }) => void;
}

export const TaskCard: React.FC<TaskCardProps> = ({
  task,
  agents,
  onOpen,
  onFocusTask,
  onDelete,
  onCopyXml,
  onEdit,
  onShowMenu,
}) => {
  const [dragging, setDragging] = useState(false);
  const isCompleted = task.stage === 'completed';
  const displayTitle = getDisplayTitle(task);

  const agentDisplayName = useMemo(() => {
    if (!task.agent) return 'unassigned';
    if (!agents || agents.length === 0) return task.agent;
    // Try matching by ID first, then by name (for when AI writes canonical names like "coder")
    const found = agents.find((a) => a.id === task.agent) ?? agents.find((a) => a.name === task.agent);
    return found ? found.name : task.agent;
  }, [task.agent, agents]);

  const handleDragStart = (e: React.DragEvent) => {
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('application/task', JSON.stringify({ id: task.id, stage: task.stage }));
    setDragging(true);
  };

  const handleDragEnd = () => setDragging(false);

  const handleActionClick = (e: React.MouseEvent, action: () => void) => {
    e.stopPropagation();
    action();
  };

  const handleMoreClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    const rect = (e.target as HTMLElement).getBoundingClientRect();
    onShowMenu?.(task, { x: rect.left, y: rect.bottom });
  };

  const handleDeleteClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    onDelete?.(task);
  };

  return (
    <div
      className={`task-card ${dragging ? 'dragging' : ''} ${isCompleted ? 'completed' : ''}`}
      role="button"
      tabIndex={0}
      draggable
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
      onFocus={() => onFocusTask?.(task)}
      onClick={() => {
        onFocusTask?.(task);
        onOpen(task);
      }}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          onOpen(task);
        }
      }}
      aria-label={`Open task ${displayTitle}`}
    >
      {/* Card Header */}
      <div className="card-header">
        <span className={`card-title ${isCompleted ? 'completed' : ''}`}>{displayTitle}</span>
        <div className="card-actions">
          {onEdit && (
            <button
              className="card-action tooltip"
              data-tooltip="Edit Task"
              onClick={(e) => handleActionClick(e, () => onEdit(task))}
              aria-label="Edit task"
            >
              <EditIcon size={14} />
            </button>
          )}
          {onDelete && (
            <button
              className="card-action danger tooltip"
              data-tooltip="Delete"
              onClick={handleDeleteClick}
              aria-label="Delete task"
            >
              <TrashIcon size={14} />
            </button>
          )}
          {onShowMenu && (
            <button
              className="card-action tooltip"
              data-tooltip="More"
              onClick={handleMoreClick}
              aria-label="More options"
            >
              <MoreIcon size={14} />
            </button>
          )}
        </div>
      </div>

      {/* Breadcrumb */}
      {(task.project || task.phase) && (
        <div className="card-breadcrumb">
          {task.project && <span className="project">{task.project}</span>}
          {task.project && task.phase && <span className="separator">/</span>}
          {task.phase && <span className="phase">{task.phase}</span>}
        </div>
      )}

      {/* Tags */}
      {task.tags && task.tags.length > 0 && (
        <div className="card-tags">
          {task.tags.slice(0, 4).map((tag) => (
            <span key={tag} className={`card-tag ${tag}`}>
              {tag}
            </span>
          ))}
        </div>
      )}

      {/* Card Footer */}
      <div className="card-footer">
        <div className="card-agent">
          <AgentIcon className="agent-icon" />
          <span>{agentDisplayName}</span>
        </div>
        {onCopyXml && (
          <button
            className="copy-xml-btn"
            onClick={(e) => handleActionClick(e, () => onCopyXml(task))}
            aria-label="Copy XML context"
          >
            <ClipboardIcon size={12} />
            Copy XML
          </button>
        )}
      </div>
    </div>
  );
};
