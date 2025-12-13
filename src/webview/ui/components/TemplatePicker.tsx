import React from 'react';

interface Template {
  id: string;
  name: string;
  description: string;
}

interface TemplatePickerProps {
  templates: Template[];
  value: string | null;
  onChange: (templateId: string | null) => void;
  onCreateNew?: () => void;
}

const DEFAULT_TEMPLATES: Template[] = [
  { id: 'bug', name: 'Bug Report', description: 'Track and fix a bug' },
  { id: 'feature', name: 'Feature', description: 'New feature development' },
  { id: 'spike', name: 'Spike', description: 'Research or exploration task' },
  { id: 'refactor', name: 'Refactor', description: 'Code improvement without new features' },
  { id: 'docs', name: 'Documentation', description: 'Documentation tasks' },
];

export const TemplatePicker: React.FC<TemplatePickerProps> = ({
  templates = DEFAULT_TEMPLATES,
  value,
  onChange,
  onCreateNew,
}) => {
  const allTemplates = templates.length > 0 ? templates : DEFAULT_TEMPLATES;

  return (
    <div className="template-picker">
      <div className="form-group">
        <label className="form-label">Template (optional)</label>
        <select
          className="form-select"
          value={value || ''}
          onChange={(e) => onChange(e.target.value || null)}
        >
          <option value="">No template</option>
          {allTemplates.map((template) => (
            <option key={template.id} value={template.id}>
              {template.name}
            </option>
          ))}
        </select>
        {value && (
          <p className="form-hint">
            {allTemplates.find((t) => t.id === value)?.description}
          </p>
        )}
        {onCreateNew && (
          <span className="form-hint">
            <button type="button" className="link-button" onClick={onCreateNew}>
              Create new template
            </button>
          </span>
        )}
      </div>
    </div>
  );
};
