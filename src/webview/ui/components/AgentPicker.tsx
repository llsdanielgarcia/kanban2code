import React from 'react';

export interface Agent {
  id: string;
  name: string;
  description: string;
}

interface AgentPickerProps {
  agents: Agent[];
  value: string | null;
  onChange: (agentId: string | null) => void;
  onCreateNew: () => void;
}

export const AgentPicker: React.FC<AgentPickerProps> = ({
  agents,
  value,
  onChange,
  onCreateNew,
}) => {
  return (
    <div className="agent-picker">
      <div className="form-group">
        <label className="form-label">Agent (optional)</label>
        <select
          className="form-select"
          value={value || ''}
          onChange={(e) => onChange(e.target.value || null)}
        >
          <option value="">No agent</option>
          {agents.map((agent) => (
            <option key={agent.id} value={agent.id}>
              {agent.name}
            </option>
          ))}
        </select>
        {value && (
          <p className="form-hint">
            {agents.find((a) => a.id === value)?.description}
          </p>
        )}
        <span className="form-hint">
          <button type="button" className="link-button" onClick={onCreateNew}>
            Create new agent
          </button>
        </span>
      </div>
    </div>
  );
};
