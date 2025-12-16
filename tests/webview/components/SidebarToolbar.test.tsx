// @vitest-environment jsdom
import '../setup-dom';
import '../setup-matchers';
import React from 'react';
import { describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen } from '@testing-library/react';

describe('SidebarToolbar', () => {
  it('renders a prominent View Kanban button and triggers callback', async () => {
    const { SidebarToolbar } = await import('../../../src/webview/ui/components/SidebarToolbar');

    const onOpenBoard = vi.fn();
    const onOpenSettings = vi.fn();

    render(<SidebarToolbar onOpenBoard={onOpenBoard} onOpenSettings={onOpenSettings} />);

    const viewKanbanButton = screen.getByRole('button', { name: /view kanban/i });
    expect(viewKanbanButton).toHaveClass('btn-primary');
    expect(viewKanbanButton).toHaveClass('btn-board');
    expect(viewKanbanButton).toHaveTextContent(/view kanban/i);

    fireEvent.click(viewKanbanButton);
    expect(onOpenBoard).toHaveBeenCalledTimes(1);
    expect(onOpenSettings).not.toHaveBeenCalled();
  });

  it('renders Settings button and triggers callback', async () => {
    const { SidebarToolbar } = await import('../../../src/webview/ui/components/SidebarToolbar');

    const onOpenBoard = vi.fn();
    const onOpenSettings = vi.fn();

    render(<SidebarToolbar onOpenBoard={onOpenBoard} onOpenSettings={onOpenSettings} />);

    const settingsButton = screen.getByRole('button', { name: /settings/i });
    expect(settingsButton).toHaveClass('btn-icon');

    fireEvent.click(settingsButton);
    expect(onOpenSettings).toHaveBeenCalledTimes(1);
    expect(onOpenBoard).not.toHaveBeenCalled();
  });
});

