---
stage: plan
tags: [feature, ui, agent, mvp, p1]
---

# Task 6.5: Implement Agent Selection and Creation Modal

## Goal

Add agent selection dropdown to the Task Modal and implement the Agent Creation Modal following the design in `docs/design/forms/agent.html`.

## Design Reference

From `docs/design/forms/agent.html`:

### Quick Templates Grid
- Ncoder (Next.js expert)
- React Dev (Component specialist)
- API Builder (Backend expert)
- Code Reviewer (Quality assurance)
- UI/UX Dev (Styling and UX)
- Custom (Start from scratch)

### Agent Configuration Fields
- **Agent Name** (required) - Lowercase, no spaces
- **Description** (required) - Brief description of expertise
- **Agent Instructions** (required) - Detailed instructions/prompt

### XML Output Preview
- Live preview showing how agent will appear in XML context

## Scope

### Part 1: Agent Selection in TaskModal

1. **Add agent discovery service**
   - Scan `.kanban2code/_agents/` for agent files
   - Parse frontmatter for name and description
   - Return list of available agents

2. **Add AgentPicker component**
   ```typescript
   interface Agent {
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
   ```

3. **Update TaskModal**
   - Add agent state to form
   - Request agents on modal open
   - Add AgentPicker between Stage and Tags
   - Include "Create new agent" link

### Part 2: Agent Creation Modal

```typescript
interface AgentModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreated?: (agentId: string) => void;
}

interface AgentFormData {
  name: string;
  description: string;
  instructions: string;
  template: string | null; // Quick template ID
}
```

### Quick Templates

Pre-defined instruction sets:

```typescript
const AGENT_TEMPLATES = {
  ncoder: {
    name: 'Ncoder',
    icon: '💻',
    description: 'Next.js expert, server components',
    instructions: `You're a Next.js expert developer with deep knowledge of:
- Next.js App Router and server components
- Use server components by default...`
  },
  'react-dev': {
    name: 'React Dev',
    icon: '⚛️',
    description: 'Component specialist',
    instructions: `You're a React specialist focused on...`
  },
  // ... more templates
};
```

### Generated Agent File

Location: `.kanban2code/_agents/{name}.md`

```markdown
---
name: ncoder
description: Next.js expert specializing in server components and App Router
created: 2025-12-13
---

You're a Next.js expert developer with deep knowledge of:

- Next.js App Router and server components
- Use server components by default, only use client components when necessary
- Implement proper data fetching patterns with async components
- Follow Next.js best practices for performance and SEO
...
```

### UI Layout

1. **Quick Templates Section**
   - 2-column grid of template cards
   - Click to pre-fill form fields
   - Active state for selected template

2. **Agent Configuration Section**
   - Name input with validation hint
   - Description input
   - Large textarea for instructions

3. **XML Output Preview Section**
   - Shows `<agent>...</agent>` wrapper
   - Updates live as instructions change

## Files to Create/Modify

- `src/services/agent.ts` - Agent discovery and creation service
- `src/webview/ui/components/AgentPicker.tsx` - Selection dropdown
- `src/webview/ui/components/AgentModal.tsx` - Creation modal
- `src/webview/ui/components/AgentTemplates.tsx` - Template grid
- `src/webview/ui/components/TaskModal.tsx` - Add agent section
- `src/webview/messaging.ts` - Add RequestAgents, AgentsLoaded, CreateAgent
- `src/webview/SidebarProvider.ts` - Handle agent messages
- `src/webview/KanbanPanel.ts` - Handle agent messages
- `src/assets/agent-templates.ts` - Template definitions

## Testing

- Unit test for agent file parsing
- Unit test for agent file creation
- Component test for AgentPicker
- Manual test: select agent in task creation
- Manual test: create new agent from template
- Manual test: create custom agent

## Acceptance Criteria

- [ ] Task modal shows agent dropdown with available agents
- [ ] "No agent" option available (nullable)
- [ ] "Create new agent" link opens AgentModal
- [ ] AgentModal shows quick template grid
- [ ] Clicking template pre-fills form
- [ ] Custom template starts with empty form
- [ ] Agent name validation (lowercase, no spaces)
- [ ] Instructions textarea large and monospace
- [ ] XML preview updates live
- [ ] Agent file created in `_agents/` folder
- [ ] Agent immediately available in dropdown after creation
- [ ] Keyboard shortcuts: Esc to close, Ctrl+Enter to create
