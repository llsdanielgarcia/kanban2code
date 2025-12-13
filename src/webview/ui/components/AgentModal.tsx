import React, { useState, useEffect, useCallback } from 'react';
import { createMessage } from '../../messaging';
import { vscode } from '../vscodeApi';

function postMessage(type: string, payload: unknown) {
  if (vscode) {
    vscode.postMessage(createMessage(type as never, payload));
  }
}

interface AgentModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreated?: (agentId: string) => void;
}

interface AgentFormData {
  name: string;
  description: string;
  instructions: string;
  template: string | null;
}

interface AgentTemplate {
  id: string;
  name: string;
  icon: string;
  description: string;
  instructions: string;
}

const AGENT_TEMPLATES: AgentTemplate[] = [
  {
    id: 'ncoder',
    name: 'Ncoder',
    icon: '💻',
    description: 'Next.js expert, server components',
    instructions: `You're a Next.js expert developer with deep knowledge of:

- Next.js App Router and server components
- Use server components by default, only use client components when necessary
- Implement proper data fetching patterns with async components
- Follow Next.js best practices for performance and SEO
- Use TypeScript with strict type checking
- Implement proper error handling and loading states
- Follow the project's existing patterns and conventions`,
  },
  {
    id: 'react-dev',
    name: 'React Dev',
    icon: '⚛️',
    description: 'Component specialist',
    instructions: `You're a React specialist focused on building reusable, maintainable components:

- Create well-structured, reusable components
- Follow React best practices and hooks patterns
- Implement proper state management
- Write accessible components with ARIA support
- Use TypeScript for type safety
- Follow the project's component patterns`,
  },
  {
    id: 'api-builder',
    name: 'API Builder',
    icon: '🔌',
    description: 'Backend expert',
    instructions: `You're a backend API expert with knowledge of:

- RESTful API design principles
- Database schema design and queries
- Authentication and authorization patterns
- Input validation and error handling
- API versioning and documentation
- Performance optimization and caching`,
  },
  {
    id: 'code-reviewer',
    name: 'Code Reviewer',
    icon: '🔍',
    description: 'Quality assurance',
    instructions: `You're a thorough code reviewer focused on quality:

- Review code for correctness, performance, and maintainability
- Identify potential bugs and security issues
- Suggest improvements to code structure and patterns
- Ensure code follows project conventions
- Check for proper error handling
- Verify test coverage and edge cases`,
  },
  {
    id: 'ui-ux-dev',
    name: 'UI/UX Dev',
    icon: '🎨',
    description: 'Styling and UX',
    instructions: `You're a UI/UX developer specializing in:

- CSS and modern styling techniques
- Responsive design and mobile-first approach
- Accessibility and WCAG compliance
- Animation and micro-interactions
- Design system implementation
- Cross-browser compatibility`,
  },
  {
    id: 'custom',
    name: 'Custom',
    icon: '✨',
    description: 'Start from scratch',
    instructions: '',
  },
];

export const AgentModal: React.FC<AgentModalProps> = ({
  isOpen,
  onClose,
  onCreated,
}) => {
  const [formData, setFormData] = useState<AgentFormData>({
    name: '',
    description: '',
    instructions: '',
    template: null,
  });

  // Reset form when modal opens
  useEffect(() => {
    if (isOpen) {
      setFormData({
        name: '',
        description: '',
        instructions: '',
        template: null,
      });
    }
  }, [isOpen]);

  // Handle keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
      if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') {
        handleSubmit();
      }
    };

    if (isOpen) {
      window.addEventListener('keydown', handleKeyDown);
      return () => window.removeEventListener('keydown', handleKeyDown);
    }
  }, [isOpen, onClose, formData]);

  const handleTemplateSelect = (template: AgentTemplate) => {
    if (template.id === 'custom') {
      setFormData({
        name: '',
        description: '',
        instructions: '',
        template: 'custom',
      });
    } else {
      setFormData({
        name: template.name.toLowerCase().replace(/\s+/g, '-'),
        description: template.description,
        instructions: template.instructions,
        template: template.id,
      });
    }
  };

  const handleSubmit = useCallback(() => {
    if (!formData.name.trim() || !formData.instructions.trim()) return;

    const agentData = {
      name: formData.name.trim().toLowerCase().replace(/\s+/g, '-'),
      description: formData.description.trim(),
      instructions: formData.instructions,
    };

    postMessage('CreateAgent', agentData);
    onClose();
    if (onCreated) {
      onCreated(agentData.name);
    }
  }, [formData, onClose, onCreated]);

  const handleOverlayClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  const generateXmlPreview = () => {
    const name = formData.name || 'agent-name';
    const instructions = formData.instructions || 'Agent instructions here...';
    return `<agent name="${name}">
${instructions.split('\n').map(line => `  ${line}`).join('\n')}
</agent>`;
  };

  if (!isOpen) return null;

  return (
    <div className="glass-overlay" onClick={handleOverlayClick}>
      <div className="glass-modal agent-modal" role="dialog" aria-labelledby="agent-modal-title">
        <div className="modal-header">
          <h2 id="agent-modal-title">Create Agent</h2>
          <button className="modal-close-btn" onClick={onClose} aria-label="Close">
            ×
          </button>
        </div>

        <div className="modal-body">
          {/* Quick Templates */}
          <div className="form-group">
            <label className="form-label">Quick Templates</label>
            <div className="agent-template-grid">
              {AGENT_TEMPLATES.map((template) => (
                <div
                  key={template.id}
                  className={`agent-template-card ${formData.template === template.id ? 'active' : ''}`}
                  onClick={() => handleTemplateSelect(template)}
                >
                  <span className="agent-template-icon">{template.icon}</span>
                  <span className="agent-template-name">{template.name}</span>
                  <span className="agent-template-desc">{template.description}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Agent Name */}
          <div className="form-group">
            <label className="form-label" htmlFor="agent-name">
              Agent Name <span className="required">*</span>
            </label>
            <input
              id="agent-name"
              type="text"
              className="form-input"
              value={formData.name}
              onChange={(e) => setFormData((prev) => ({ ...prev, name: e.target.value }))}
              placeholder="e.g., ncoder, react-dev"
            />
            <span className="form-hint">
              Lowercase, no spaces. Will be used as filename and identifier.
            </span>
          </div>

          {/* Description */}
          <div className="form-group">
            <label className="form-label" htmlFor="agent-description">Description</label>
            <input
              id="agent-description"
              type="text"
              className="form-input"
              value={formData.description}
              onChange={(e) => setFormData((prev) => ({ ...prev, description: e.target.value }))}
              placeholder="Brief description of agent expertise..."
            />
          </div>

          {/* Instructions */}
          <div className="form-group">
            <label className="form-label" htmlFor="agent-instructions">
              Agent Instructions <span className="required">*</span>
            </label>
            <textarea
              id="agent-instructions"
              className="form-textarea monospace"
              value={formData.instructions}
              onChange={(e) => setFormData((prev) => ({ ...prev, instructions: e.target.value }))}
              placeholder="Enter detailed instructions for the agent..."
              rows={10}
            />
          </div>

          {/* XML Preview */}
          <div className="form-group">
            <div className="xml-preview-label">XML Output Preview</div>
            <pre className="xml-preview">{generateXmlPreview()}</pre>
          </div>
        </div>

        <div className="modal-footer">
          <button className="btn btn-secondary" onClick={onClose}>
            Cancel
          </button>
          <button
            className="btn btn-primary"
            onClick={handleSubmit}
            disabled={!formData.name.trim() || !formData.instructions.trim()}
          >
            Create Agent
          </button>
        </div>
      </div>
    </div>
  );
};
