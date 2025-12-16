import React from 'react';
import { SettingsIcon, KanbanIcon } from './Icons';

interface SidebarToolbarProps {
  onOpenBoard: () => void;
  onOpenSettings: () => void;
}

export const SidebarToolbar: React.FC<SidebarToolbarProps> = ({
  onOpenBoard,
  onOpenSettings,
}) => {
  return (
    <div className="sidebar-toolbar">
      <span className="sidebar-title">Kanban2Code</span>
      <div className="toolbar-actions">
        <button
          className="btn btn-primary btn-board"
          aria-label="View Kanban"
          onClick={onOpenBoard}
        >
          <KanbanIcon />
          <span className="btn-board-label">View Kanban</span>
        </button>
        <button
          className="btn btn-icon btn-ghost tooltip"
          data-tooltip="Settings"
          aria-label="Settings"
          onClick={onOpenSettings}
        >
          <SettingsIcon />
        </button>
      </div>
    </div>
  );
};
