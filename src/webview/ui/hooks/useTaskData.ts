import { useState, useEffect } from 'react';
import type { Task } from '../../../types/task';
import type { FilterState } from '../../../types/filters';
import { createMessage, parseRunnerState, type MessageEnvelope } from '../../messaging';
import { vscode } from '../vscodeApi';

export interface ContextFile {
  id: string;
  name: string;
  description: string;
  path: string;
  scope?: 'global' | 'project';
}

export interface Agent {
  id: string;
  name: string;
  description: string;
  path: string;
}

export interface Mode {
  id: string;
  name: string;
  description: string;
  path: string;
  stage?: string;
}

interface InitStatePayload {
  tasks: Task[];
  contexts?: ContextFile[];
  agents?: Agent[];
  modes?: Mode[];
  projects?: string[];
  phasesByProject?: Record<string, string[]>;
  workspaceRoot: string;
  context?: 'sidebar' | 'board';
  filterState?: FilterState;
  isRunnerActive?: boolean;
  activeRunnerTaskId?: string;
}

interface TaskUpdatedPayload {
  tasks: Task[];
}

interface FilterChangedPayload {
  filters: FilterState;
}

interface ModesLoadedPayload {
  modes: Mode[];
}

interface UseTaskDataResult {
  tasks: Task[];
  contexts: ContextFile[];
  agents: Agent[];
  modes: Mode[];
  projects: string[];
  phasesByProject: Record<string, string[]>;
  workspaceRoot: string | null;
  isLoading: boolean;
  error: string | null;
  context: 'sidebar' | 'board' | null;
  filterState: FilterState | null;
  isRunnerActive: boolean;
  activeRunnerTaskId: string | null;
}

export function useTaskData(): UseTaskDataResult {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [contexts, setContexts] = useState<ContextFile[]>([]);
  const [agents, setAgents] = useState<Agent[]>([]);
  const [modes, setModes] = useState<Mode[]>([]);
  const [projects, setProjects] = useState<string[]>([]);
  const [phasesByProject, setPhasesByProject] = useState<Record<string, string[]>>({});
  const [workspaceRoot, setWorkspaceRoot] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [context, setContext] = useState<'sidebar' | 'board' | null>(null);
  const [filterState, setFilterState] = useState<FilterState | null>(null);
  const [isRunnerActive, setIsRunnerActive] = useState(false);
  const [activeRunnerTaskId, setActiveRunnerTaskId] = useState<string | null>(null);

  useEffect(() => {
    let timeout: ReturnType<typeof setTimeout> | null = null;
    let receivedInitState = false;

    const handleMessage = (event: MessageEvent<MessageEnvelope>) => {
      const message = event.data;
      if (!message?.type) return;

      switch (message.type) {
        case 'InitState': {
          const payload = message.payload as InitStatePayload;
          setTasks(payload.tasks || []);
          setContexts(payload.contexts || []);
          setAgents(payload.agents || []);
          setModes(payload.modes || []);
          setProjects(payload.projects || []);
          setPhasesByProject(payload.phasesByProject || {});
          setWorkspaceRoot(payload.workspaceRoot || null);
          if (payload.context) setContext(payload.context);
          if (payload.filterState) setFilterState(payload.filterState);
          setIsRunnerActive(payload.isRunnerActive ?? false);
          setActiveRunnerTaskId(payload.activeRunnerTaskId ?? null);
          setIsLoading(false);
          setError(null);
          receivedInitState = true;
          if (timeout) {
            clearTimeout(timeout);
            timeout = null;
          }
          break;
        }
        case 'TaskUpdated': {
          const payload = message.payload as TaskUpdatedPayload;
          if (payload.tasks) {
            setTasks(payload.tasks);
          }
          break;
        }
        case 'FilterChanged': {
          const payload = message.payload as FilterChangedPayload;
          if (payload.filters) setFilterState(payload.filters);
          break;
        }
        case 'ModesLoaded': {
          const payload = message.payload as ModesLoadedPayload;
          setModes(payload.modes || []);
          break;
        }
        case 'RunnerStateChanged': {
          try {
            const payload = parseRunnerState(message.payload);
            setIsRunnerActive(payload.isRunning);
            setActiveRunnerTaskId(payload.activeTaskId ?? null);
          } catch {
            // Ignore malformed runner state messages from stale webviews/extensions.
          }
          break;
        }
      }
    };

    window.addEventListener('message', handleMessage);

    // Request state in case this hook mounted after the initial InitState was posted
    if (vscode) {
      vscode.postMessage(createMessage('RequestState', {}));
    }

    timeout = setTimeout(() => {
      if (!receivedInitState) {
        setError('Timeout waiting for task data');
        setIsLoading(false);
      }
    }, 10000);

    return () => {
      window.removeEventListener('message', handleMessage);
      if (timeout) clearTimeout(timeout);
    };
  }, []);

  return {
    tasks,
    contexts,
    agents,
    modes,
    projects,
    phasesByProject,
    workspaceRoot,
    isLoading,
    error,
    context,
    filterState,
    isRunnerActive,
    activeRunnerTaskId,
  };
}
