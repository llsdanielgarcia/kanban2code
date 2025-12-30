import React, { useMemo } from 'react';

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

/**
 * Find an agent by ID or by canonical name.
 * Supports both file IDs (e.g., "06-✅auditor") and frontmatter names (e.g., "auditor").
 */
function findAgent(agents: Agent[], identifier: string | null): Agent | undefined {
  if (!identifier) return undefined;
  return agents.find((a) => a.id === identifier) ?? agents.find((a) => a.name === identifier);
}

export const AgentPicker: React.FC<AgentPickerProps> = ({
  agents,
  value,
  onChange,
  onCreateNew,
}) => {
  // Resolve the value to an agent ID (handles both ID and canonical name)
  const resolvedAgent = useMemo(() => findAgent(agents, value), [agents, value]);
  const selectValue = resolvedAgent?.id ?? '';

  return (
    <div className="agent-picker">
      <div className="form-group">
        <label className="form-label">Agent (optional)</label>
        <select
          className="form-select"
          value={selectValue}
          onChange={(e) => onChange(e.target.value || null)}
        >
          <option value="">No agent</option>
          {agents.map((agent) => (
            <option key={agent.id} value={agent.id}>
              {agent.name}
            </option>
          ))}
        </select>
        {resolvedAgent && (
          <p className="form-hint">
            {resolvedAgent.description}
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
