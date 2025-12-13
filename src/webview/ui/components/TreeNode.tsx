import React, { useState } from 'react';
import { ChevronIcon, FolderIcon, PhaseIcon } from './Icons';

interface TreeNodeProps {
  label: string;
  count: number;
  depth?: number;
  type: 'project' | 'phase';
  defaultExpanded?: boolean;
  children?: React.ReactNode;
}

export const TreeNode: React.FC<TreeNodeProps> = ({
  label,
  count,
  depth = 0,
  type,
  defaultExpanded = false,
  children,
}) => {
  const [expanded, setExpanded] = useState(defaultExpanded);

  const toggleExpand = () => setExpanded(!expanded);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      toggleExpand();
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

  const Icon = type === 'project' ? FolderIcon : PhaseIcon;
  const iconColor = type === 'project'
    ? 'var(--k2c-accent)'
    : 'var(--k2c-text-muted)';

  return (
    <>
      <div
        className={`tree-node ${expanded ? 'expanded' : ''}`}
        style={{ '--depth': depth } as React.CSSProperties}
        onClick={toggleExpand}
        onKeyDown={handleKeyDown}
        role="treeitem"
        aria-expanded={expanded}
        aria-level={depth + 1}
        tabIndex={0}
      >
        <ChevronIcon />
        <Icon style={{ color: iconColor }} />
        <span className="node-label">{label}</span>
        <span className="node-count">{count}</span>
      </div>
      {children && (
        <div
          className={`tree-children ${expanded ? '' : 'collapsed'}`}
          role="group"
          aria-label={`${label} contents`}
        >
          {children}
        </div>
      )}
    </>
  );
};
