import React, { useMemo } from 'react';

export interface Mode {
  id: string;
  name: string;
  description: string;
  stage?: string;
  path: string;
}

interface ModePickerProps {
  modes: Mode[];
  value: string | null;
  onChange: (modeId: string | null) => void;
  onCreateNew: () => void;
}

/**
 * Find a mode by ID or by canonical name.
 * Supports both file IDs and frontmatter names.
 */
function findMode(modes: Mode[], identifier: string | null): Mode | undefined {
  if (!identifier) return undefined;
  return modes.find((m) => m.id === identifier) ?? modes.find((m) => m.name === identifier);
}

export const ModePicker: React.FC<ModePickerProps> = ({
  modes,
  value,
  onChange,
  onCreateNew,
}) => {
  // Resolve the value to a mode ID (handles both ID and canonical name)
  const resolvedMode = useMemo(() => findMode(modes, value), [modes, value]);
  const selectValue = resolvedMode?.id ?? '';

  return (
    <div className="mode-picker">
      <div className="form-group">
        <label className="form-label">Mode (optional)</label>
        <select
          className="form-select"
          value={selectValue}
          onChange={(e) => onChange(e.target.value || null)}
        >
          <option value="">No selection</option>
          {modes.map((mode) => (
            <option key={mode.id} value={mode.id}>
              {mode.name}
            </option>
          ))}
        </select>
        {resolvedMode && (
          <p className="form-hint">
            {resolvedMode.description}
          </p>
        )}
        <span className="form-hint">
          <button type="button" className="link-button" onClick={onCreateNew}>
            Create new mode
          </button>
        </span>
      </div>
    </div>
  );
};
