// @vitest-environment jsdom
import '../setup-dom';
import '../setup-matchers';
import React from 'react';
import { describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen } from '@testing-library/react';
import { ModePicker, type Mode } from '../../../src/webview/ui/components/ModePicker';

const mockModes: Mode[] = [
  {
    id: 'coder',
    name: 'Coder',
    description: 'Implement tasks from refined prompts',
    stage: 'code',
    path: '_modes/coder.md',
  },
  {
    id: 'auditor',
    name: 'Auditor',
    description: 'Review and audit completed code',
    stage: 'audit',
    path: '_modes/auditor.md',
  },
  {
    id: 'planner',
    name: 'Planner',
    description: 'Plan and break down tasks',
    stage: 'plan',
    path: '_modes/planner.md',
  },
];

describe('ModePicker', () => {
  it('renders mode list with "No mode" option', () => {
    const onChange = vi.fn();
    const onCreateNew = vi.fn();

    render(
      <ModePicker
        modes={mockModes}
        value={null}
        onChange={onChange}
        onCreateNew={onCreateNew}
      />
    );

    const select = screen.getByRole('combobox');
    expect(select).toBeInTheDocument();

    const noModeOption = screen.getByRole('option', { name: /no mode/i });
    expect(noModeOption).toBeInTheDocument();
    expect(select).toHaveValue('');
  });

  it('renders all modes in the dropdown', () => {
    const onChange = vi.fn();
    const onCreateNew = vi.fn();

    render(
      <ModePicker
        modes={mockModes}
        value={null}
        onChange={onChange}
        onCreateNew={onCreateNew}
      />
    );

    expect(screen.getByRole('option', { name: /coder/i })).toBeInTheDocument();
    expect(screen.getByRole('option', { name: /auditor/i })).toBeInTheDocument();
    expect(screen.getByRole('option', { name: /planner/i })).toBeInTheDocument();
  });

  it('displays selected mode description', () => {
    const onChange = vi.fn();
    const onCreateNew = vi.fn();

    render(
      <ModePicker
        modes={mockModes}
        value="coder"
        onChange={onChange}
        onCreateNew={onCreateNew}
      />
    );

    const select = screen.getByRole('combobox');
    expect(select).toHaveValue('coder');

    const description = screen.getByText(/implement tasks from refined prompts/i);
    expect(description).toBeInTheDocument();
  });

  it('fires onChange callback when selection changes', () => {
    const onChange = vi.fn();
    const onCreateNew = vi.fn();

    render(
      <ModePicker
        modes={mockModes}
        value={null}
        onChange={onChange}
        onCreateNew={onCreateNew}
      />
    );

    const select = screen.getByRole('combobox');
    fireEvent.change(select, { target: { value: 'auditor' } });

    expect(onChange).toHaveBeenCalledTimes(1);
    expect(onChange).toHaveBeenCalledWith('auditor');
  });

  it('fires onChange with null when "No mode" is selected', () => {
    const onChange = vi.fn();
    const onCreateNew = vi.fn();

    render(
      <ModePicker
        modes={mockModes}
        value="coder"
        onChange={onChange}
        onCreateNew={onCreateNew}
      />
    );

    const select = screen.getByRole('combobox');
    fireEvent.change(select, { target: { value: '' } });

    expect(onChange).toHaveBeenCalledTimes(1);
    expect(onChange).toHaveBeenCalledWith(null);
  });

  it('renders "Create new mode" button and fires callback', () => {
    const onChange = vi.fn();
    const onCreateNew = vi.fn();

    render(
      <ModePicker
        modes={mockModes}
        value={null}
        onChange={onChange}
        onCreateNew={onCreateNew}
      />
    );

    const createButton = screen.getByRole('button', { name: /create new mode/i });
    expect(createButton).toBeInTheDocument();

    fireEvent.click(createButton);
    expect(onCreateNew).toHaveBeenCalledTimes(1);
  });

  it('resolves mode by canonical name', () => {
    const onChange = vi.fn();
    const onCreateNew = vi.fn();

    render(
      <ModePicker
        modes={mockModes}
        value="Planner"
        onChange={onChange}
        onCreateNew={onCreateNew}
      />
    );

    const select = screen.getByRole('combobox');
    expect(select).toHaveValue('planner');

    const description = screen.getByText(/plan and break down tasks/i);
    expect(description).toBeInTheDocument();
  });
});
