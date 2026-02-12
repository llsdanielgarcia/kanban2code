import React, { useMemo } from 'react';

export interface LlmProvider {
  id: string;
  name: string;
  description: string;
  primaryUse?: string[];
  secondaryUse?: string[];
}

interface AgentPickerProps {
  providers: LlmProvider[];
  value: string | null;
  onChange: (providerId: string | null) => void;
}

/**
 * Find an LLM provider by ID or by canonical name.
 * Supports both provider IDs (e.g., "opus", "codex") and display names.
 */
function findProvider(providers: LlmProvider[], identifier: string | null): LlmProvider | undefined {
  if (!identifier) return undefined;
  return providers.find((p) => p.id === identifier) ?? providers.find((p) => p.name === identifier);
}

export const AgentPicker: React.FC<AgentPickerProps> = ({
  providers,
  value,
  onChange,
}) => {
  // Resolve the value to a provider ID (handles both ID and canonical name)
  const resolvedProvider = useMemo(() => findProvider(providers, value), [providers, value]);
  const selectValue = resolvedProvider?.id ?? '';

  return (
    <div className="agent-picker">
      <div className="form-group">
        <label className="form-label">Agent</label>
        <select
          className="form-select"
          value={selectValue}
          onChange={(e) => onChange(e.target.value || null)}
        >
          <option value="">No selection</option>
          {providers.map((provider) => (
            <option key={provider.id} value={provider.id}>
              {provider.name}
            </option>
          ))}
        </select>
        {resolvedProvider && (
          <p className="form-hint">
            {resolvedProvider.description}
          </p>
        )}
      </div>
    </div>
  );
};
