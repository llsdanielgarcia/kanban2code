import React, { useState } from 'react';
import { ChevronIcon, InboxIcon } from './Icons';
import type { Task } from '../../../types/task';
import { TaskItem } from './TaskItem';

interface TreeSectionProps {
  title: string;
  tasks: Task[];
  type: 'inbox' | 'projects';
  defaultExpanded?: boolean;
  onTaskClick: (task: Task) => void;
  onTaskDoubleClick?: (task: Task) => void;
  onTaskContextMenu?: (e: React.MouseEvent, task: Task) => void;
  children?: React.ReactNode;
}

export const TreeSection: React.FC<TreeSectionProps> = ({
  title,
  tasks,
  type,
  defaultExpanded = true,
  onTaskClick,
  onTaskDoubleClick,
  onTaskContextMenu,
  children,
}) => {
  const [expanded, setExpanded] = useState(defaultExpanded);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      setExpanded(!expanded);
    }
    if (e.key === 'ArrowRight' && !expanded) {
      e.preventDefault();
      setExpanded(true);
    }
    if (e.key === 'ArrowLeft' && expanded) {
      e.preventDefault();
      setExpanded(false);
    }
  };

  if (type === 'inbox') {
    return (
      <div className="tree-section" role="group" aria-label={title}>
        <div
          className={`tree-node ${expanded ? 'expanded' : ''}`}
          style={{ '--depth': 0 } as React.CSSProperties}
          onClick={() => setExpanded(!expanded)}
          onKeyDown={handleKeyDown}
          role="treeitem"
          aria-expanded={expanded}
          aria-level={1}
          tabIndex={0}
        >
          <ChevronIcon />
          <InboxIcon style={{ color: 'var(--stage-inbox)' }} />
          <span className="node-label">{title}</span>
          <span className="node-count">{tasks.length}</span>
        </div>
        {expanded && (
          <div className="tree-children" role="group" aria-label={`${title} tasks`}>
            {tasks.map((task, index) => (
              <TaskItem
                key={task.id}
                task={task}
                depth={1}
                index={index}
                totalItems={tasks.length}
                onClick={onTaskClick}
                onDoubleClick={onTaskDoubleClick}
                onContextMenu={onTaskContextMenu}
              />
            ))}
          </div>
        )}
      </div>
    );
  }

  // Projects section with header
  return (
    <div className="tree-section" role="group" aria-label={title}>
      <div className="tree-section-header">
        <span>{title}</span>
      </div>
      {children}
    </div>
  );
};
