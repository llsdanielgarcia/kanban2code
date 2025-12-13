import React from 'react';
import type { Task } from '../../../types/task';

interface TaskItemProps {
  task: Task;
  depth?: number;
  index?: number;
  totalItems?: number;
  onClick: (task: Task) => void;
  onDoubleClick?: (task: Task) => void;
  onContextMenu?: (e: React.MouseEvent, task: Task) => void;
}

const TAG_CLASS_MAP: Record<string, string> = {
  bug: 'tag-bug',
  feature: 'tag-feature',
  mvp: 'tag-mvp',
  urgent: 'tag-urgent',
  idea: 'tag-idea',
  spike: 'tag-spike',
};

export const TaskItem: React.FC<TaskItemProps> = ({
  task,
  depth = 1,
  index = 0,
  totalItems = 1,
  onClick,
  onDoubleClick,
  onContextMenu,
}) => {
  const handleClick = () => onClick(task);
  const handleDoubleClick = () => onDoubleClick?.(task);
  const handleContextMenu = (e: React.MouseEvent) => {
    e.preventDefault();
    onContextMenu?.(e, task);
  };
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      onClick(task);
    }
  };

  return (
    <div
      className="task-item"
      style={{ '--depth': depth } as React.CSSProperties}
      onClick={handleClick}
      onDoubleClick={handleDoubleClick}
      onContextMenu={handleContextMenu}
      onKeyDown={handleKeyDown}
      data-task-id={task.id}
      role="treeitem"
      aria-level={depth + 1}
      aria-setsize={totalItems}
      aria-posinset={index + 1}
      tabIndex={0}
    >
      <span className={`stage-indicator ${task.stage}`} />
      <div className="task-content">
        <div className="task-title">{task.title}</div>
        {task.tags && task.tags.length > 0 && (
          <div className="task-meta">
            {task.tags.slice(0, 3).map((tag) => (
              <span
                key={tag}
                className={`mini-tag ${TAG_CLASS_MAP[tag.toLowerCase()] || ''}`}
              >
                {tag}
              </span>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
