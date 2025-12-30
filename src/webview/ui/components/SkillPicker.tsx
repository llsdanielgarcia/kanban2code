import React from 'react';

export interface SkillFile {
  id: string;
  name: string;
  description: string;
  path: string;
  framework?: string;
  priority?: 'high' | 'medium' | 'low';
  alwaysAttach?: boolean;
  triggers?: string[];
}

interface SkillPickerProps {
  skills: SkillFile[];
  selected: string[];
  onChange: (selected: string[]) => void;
}

export const SkillPicker: React.FC<SkillPickerProps> = ({
  skills,
  selected,
  onChange,
}) => {
  const handleToggle = (skillId: string) => {
    if (selected.includes(skillId)) {
      onChange(selected.filter((id) => id !== skillId));
    } else {
      onChange([...selected, skillId]);
    }
  };

  const getPriorityColor = (priority?: string) => {
    switch (priority) {
      case 'high': return 'var(--vscode-charts-red)';
      case 'medium': return 'var(--vscode-charts-orange)';
      case 'low': return 'var(--vscode-charts-blue)';
      default: return 'var(--vscode-descriptionForeground)';
    }
  };

  return (
    <div className="skill-picker">
      <div className="form-group">
        <div className="context-list">
          {skills.length === 0 ? (
            <div className="context-list-empty">
              No skills available
            </div>
          ) : (
            skills.map((skill) => (
              <label key={skill.id} className="context-item">
                <input
                  type="checkbox"
                  checked={selected.includes(skill.id)}
                  onChange={() => handleToggle(skill.id)}
                />
                <div className="context-item-content">
                  <div className="context-item-header" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <div className="context-item-name">{skill.name}</div>
                    {skill.framework && (
                      <span className="badge badge-framework" style={{ 
                        fontSize: '0.7em', 
                        padding: '1px 4px', 
                        borderRadius: '3px',
                        backgroundColor: 'var(--vscode-badge-background)',
                        color: 'var(--vscode-badge-foreground)'
                      }}>
                        {skill.framework}
                      </span>
                    )}
                    {skill.priority && (
                      <span className="badge badge-priority" style={{ 
                        fontSize: '0.7em', 
                        padding: '1px 4px', 
                        borderRadius: '3px',
                        border: `1px solid ${getPriorityColor(skill.priority)}`,
                        color: getPriorityColor(skill.priority)
                      }}>
                        {skill.priority}
                      </span>
                    )}
                    {skill.alwaysAttach && (
                      <span className="badge badge-always-attach" style={{ 
                        fontSize: '0.7em', 
                        padding: '1px 4px', 
                        borderRadius: '3px',
                        backgroundColor: 'var(--vscode-charts-green)',
                        color: 'white'
                      }}>
                        Always
                      </span>
                    )}
                  </div>
                  {skill.description && (
                    <div className="context-item-description">
                      {skill.description}
                    </div>
                  )}
                  {skill.triggers && skill.triggers.length > 0 && (
                     <div className="context-item-triggers" style={{ fontSize: '0.75em', opacity: 0.8, marginTop: '2px' }}>
                        Triggers: {skill.triggers.join(', ')}
                     </div>
                  )}
                </div>
              </label>
            ))
          )}
        </div>
      </div>
    </div>
  );
};
