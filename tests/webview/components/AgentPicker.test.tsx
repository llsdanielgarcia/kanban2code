// @vitest-environment jsdom
import '../setup-dom';
import '../setup-matchers';
import React from 'react';
import { describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen } from '@testing-library/react';
import { AgentPicker, type LlmProvider } from '../../../src/webview/ui/components/AgentPicker';

const mockProviders: LlmProvider[] = [
  {
    id: 'opus',
    name: 'Claude Opus',
    description: 'Claude Opus - Best for planning, architecture, and complex UI work',
    primaryUse: ['planning', 'architecture', 'ui', 'design'],
    secondaryUse: ['auditing', 'code-review'],
  },
  {
    id: 'codex',
    name: 'Claude Codex',
    description: 'Claude Codex - Best for backend logic, APIs, and code auditing',
    primaryUse: ['backend', 'api', 'logic', 'coding'],
    secondaryUse: ['auditing'],
  },
  {
    id: 'kimi',
    name: 'Kimi',
    description: 'Kimi - Alternative LLM provider',
    primaryUse: ['general'],
    secondaryUse: [],
  },
  {
    id: 'glm',
    name: 'GLM',
    description: 'GLM - Best for task splitting and simple context',
    primaryUse: ['task-splitting', 'simple-context'],
    secondaryUse: ['miscellaneous'],
  },
];

describe('AgentPicker', () => {
  it('renders LLM provider list with "No selection" option', () => {
    const onChange = vi.fn();

    render(
      <AgentPicker
        providers={mockProviders}
        value={null}
        onChange={onChange}
      />
    );

    const select = screen.getByRole('combobox');
    expect(select).toBeInTheDocument();

    const noSelectionOption = screen.getByRole('option', { name: /no selection/i });
    expect(noSelectionOption).toBeInTheDocument();
    expect(select).toHaveValue('');
  });

  it('displays label as "Agent"', () => {
    const onChange = vi.fn();

    render(
      <AgentPicker
        providers={mockProviders}
        value={null}
        onChange={onChange}
      />
    );

    const label = screen.getByText(/^agent$/i);
    expect(label).toBeInTheDocument();
  });

  it('renders all LLM providers in the dropdown', () => {
    const onChange = vi.fn();

    render(
      <AgentPicker
        providers={mockProviders}
        value={null}
        onChange={onChange}
      />
    );

    expect(screen.getByRole('option', { name: /claude opus/i })).toBeInTheDocument();
    expect(screen.getByRole('option', { name: /claude codex/i })).toBeInTheDocument();
    expect(screen.getByRole('option', { name: /kimi/i })).toBeInTheDocument();
    expect(screen.getByRole('option', { name: /glm/i })).toBeInTheDocument();
  });

  it('displays selected provider description', () => {
    const onChange = vi.fn();

    render(
      <AgentPicker
        providers={mockProviders}
        value="opus"
        onChange={onChange}
      />
    );

    const select = screen.getByRole('combobox');
    expect(select).toHaveValue('opus');

    const description = screen.getByText(/best for planning, architecture, and complex ui work/i);
    expect(description).toBeInTheDocument();
  });

  it('fires onChange callback when selection changes', () => {
    const onChange = vi.fn();

    render(
      <AgentPicker
        providers={mockProviders}
        value={null}
        onChange={onChange}
      />
    );

    const select = screen.getByRole('combobox');
    fireEvent.change(select, { target: { value: 'codex' } });

    expect(onChange).toHaveBeenCalledTimes(1);
    expect(onChange).toHaveBeenCalledWith('codex');
  });

  it('fires onChange with null when "No selection" is selected', () => {
    const onChange = vi.fn();

    render(
      <AgentPicker
        providers={mockProviders}
        value="opus"
        onChange={onChange}
      />
    );

    const select = screen.getByRole('combobox');
    fireEvent.change(select, { target: { value: '' } });

    expect(onChange).toHaveBeenCalledTimes(1);
    expect(onChange).toHaveBeenCalledWith(null);
  });

  it('resolves provider by canonical name', () => {
    const onChange = vi.fn();

    render(
      <AgentPicker
        providers={mockProviders}
        value="Claude Codex"
        onChange={onChange}
      />
    );

    const select = screen.getByRole('combobox');
    expect(select).toHaveValue('codex');

    const description = screen.getByText(/best for backend logic, apis, and code auditing/i);
    expect(description).toBeInTheDocument();
  });

  it('does not render "Create new agent" button', () => {
    const onChange = vi.fn();

    render(
      <AgentPicker
        providers={mockProviders}
        value={null}
        onChange={onChange}
      />
    );

    const createButton = screen.queryByRole('button', { name: /create new/i });
    expect(createButton).not.toBeInTheDocument();
  });
});
