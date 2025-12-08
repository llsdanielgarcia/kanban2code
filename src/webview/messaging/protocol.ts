import type * as vscode from 'vscode';
import type { Task } from '../../types/task';
import {
  PROTOCOL_VERSION,
  type HostMessage,
  type WebviewMessage,
  type MessageEnvelope,
  type TasksLoadedPayload,
  type TaskUpdatedPayload,
  type TaskCreatedPayload,
  type TaskDeletedPayload,
  type WorkspaceStatusPayload,
  type ErrorPayload,
  validateWebviewMessage,
} from './types';

/**
 * Creates a message envelope with the current protocol version.
 */
function createEnvelope<T>(type: string, payload: T, requestId?: string): MessageEnvelope<T> {
  return {
    version: PROTOCOL_VERSION,
    type,
    payload,
    ...(requestId && { requestId }),
  };
}

// ============================================================================
// Host → Webview Message Builders
// ============================================================================

/**
 * Creates a tasks:loaded message.
 */
export function createTasksLoadedMessage(tasks: Task[]): HostMessage {
  return createEnvelope<TasksLoadedPayload>('tasks:loaded', { tasks }) as HostMessage;
}

/**
 * Creates a task:updated message.
 */
export function createTaskUpdatedMessage(task: Task): HostMessage {
  return createEnvelope<TaskUpdatedPayload>('task:updated', { task }) as HostMessage;
}

/**
 * Creates a task:created message.
 */
export function createTaskCreatedMessage(task: Task): HostMessage {
  return createEnvelope<TaskCreatedPayload>('task:created', { task }) as HostMessage;
}

/**
 * Creates a task:deleted message.
 */
export function createTaskDeletedMessage(id: string, filePath: string): HostMessage {
  return createEnvelope<TaskDeletedPayload>('task:deleted', { id, filePath }) as HostMessage;
}

/**
 * Creates a workspace:status message.
 */
export function createWorkspaceStatusMessage(
  status: 'valid' | 'missing' | 'invalid' | 'forbidden',
  root: string | null,
  message: string,
): HostMessage {
  return createEnvelope<WorkspaceStatusPayload>('workspace:status', {
    status,
    root,
    message,
  }) as HostMessage;
}

/**
 * Creates an error message.
 */
export function createErrorMessage(
  message: string,
  code?: string,
  details?: unknown,
): HostMessage {
  return createEnvelope<ErrorPayload>('error', { message, code, details }) as HostMessage;
}

// ============================================================================
// Webview → Host Message Builders (for webview side)
// ============================================================================

/**
 * Creates a refresh request message.
 */
export function createRefreshMessage(force = false): WebviewMessage {
  return createEnvelope('refresh', { force }) as WebviewMessage;
}

/**
 * Creates a task:move request message.
 */
export function createTaskMoveMessage(
  id: string,
  filePath: string,
  newStage: string,
): WebviewMessage {
  return createEnvelope('task:move', { id, filePath, newStage }) as WebviewMessage;
}

/**
 * Creates a task:create request message.
 */
export function createTaskCreateMessage(
  title: string,
  options?: {
    project?: string;
    phase?: string;
    stage?: string;
    content?: string;
  },
): WebviewMessage {
  return createEnvelope('task:create', { title, ...options }) as WebviewMessage;
}

/**
 * Creates a task:archive request message.
 */
export function createTaskArchiveMessage(id: string, filePath: string): WebviewMessage {
  return createEnvelope('task:archive', { id, filePath }) as WebviewMessage;
}

/**
 * Creates a task:open request message.
 */
export function createTaskOpenMessage(filePath: string): WebviewMessage {
  return createEnvelope('task:open', { filePath }) as WebviewMessage;
}

/**
 * Creates a task:delete request message.
 */
export function createTaskDeleteMessage(id: string, filePath: string): WebviewMessage {
  return createEnvelope('task:delete', { id, filePath }) as WebviewMessage;
}

/**
 * Creates a task:select notification from the webview.
 */
export function createTaskSelectMessage(id: string, filePath: string): WebviewMessage {
  return createEnvelope('task:select', { id, filePath }) as WebviewMessage;
}

/**
 * Creates a filters:changed notification from the webview.
 */
export function createFiltersChangedMessage(options: {
  project?: string | null;
  phase?: string | null;
  tags?: string[];
  search?: string;
}): WebviewMessage {
  return createEnvelope('filters:changed', { ...options }) as WebviewMessage;
}

/**
 * Creates a context:copy request.
 */
export function createContextCopyMessage(filePath: string): WebviewMessage {
  return createEnvelope('context:copy', { filePath }) as WebviewMessage;
}

/**
 * Creates a scaffold request message.
 */
export function createScaffoldMessage(): WebviewMessage {
  return createEnvelope('scaffold', {}) as WebviewMessage;
}

// ============================================================================
// Message Handler Types
// ============================================================================

/**
 * Handler function type for webview messages.
 */
export type WebviewMessageHandler = (message: WebviewMessage) => Promise<void> | void;

/**
 * Handler function type for host messages (in webview).
 */
export type HostMessageHandler = (message: HostMessage) => void;

// ============================================================================
// Message Bridge (Host Side)
// ============================================================================

/**
 * Message bridge for the host (extension) side.
 * Handles communication between extension and webview.
 */
export class HostMessageBridge {
  private handlers: Map<string, WebviewMessageHandler> = new Map();

  constructor(private readonly webview: vscode.Webview) {}

  /**
   * Sends a message to the webview.
   */
  async send(message: HostMessage): Promise<boolean> {
    return this.webview.postMessage(message);
  }

  /**
   * Registers a handler for a specific message type.
   */
  on(type: string, handler: WebviewMessageHandler): void {
    this.handlers.set(type, handler);
  }

  /**
   * Removes a handler for a specific message type.
   */
  off(type: string): void {
    this.handlers.delete(type);
  }

  /**
   * Handles an incoming message from the webview.
   * Should be called from webview.onDidReceiveMessage.
   */
  async handleMessage(rawMessage: unknown): Promise<void> {
    const result = validateWebviewMessage(rawMessage);

    if (!result.success) {
      console.warn('Invalid webview message:', result.error);
      await this.send(createErrorMessage(result.error, 'INVALID_MESSAGE'));
      return;
    }

    const message = result.data;
    const handler = this.handlers.get(message.type);

    if (!handler) {
      console.warn(`No handler registered for message type: ${message.type}`);
      return;
    }

    try {
      await handler(message);
    } catch (error) {
      console.error(`Error handling message ${message.type}:`, error);
      await this.send(
        createErrorMessage(
          error instanceof Error ? error.message : 'Unknown error',
          'HANDLER_ERROR',
        ),
      );
    }
  }

  /**
   * Creates a disposable subscription to webview messages.
   */
  subscribe(): vscode.Disposable {
    return this.webview.onDidReceiveMessage((message) => {
      this.handleMessage(message);
    });
  }
}

// ============================================================================
// Webview Messaging Utilities (for webview side)
// ============================================================================

/**
 * Type for the VS Code API available in webviews.
 */
interface VSCodeApi {
  postMessage(message: unknown): void;
  getState(): unknown;
  setState(state: unknown): void;
}

/**
 * Gets the VS Code API in a webview context.
 * Must be called only once per webview.
 */
let vscodeApi: VSCodeApi | null = null;

export function getVSCodeApi(): VSCodeApi {
  if (vscodeApi) {
    return vscodeApi;
  }

  // @ts-expect-error - acquireVsCodeApi is provided by VS Code webview
  if (typeof acquireVsCodeApi === 'function') {
    // @ts-expect-error - acquireVsCodeApi is provided by VS Code webview
    vscodeApi = acquireVsCodeApi();
  } else {
    // Mock for testing outside VS Code
    vscodeApi = {
      postMessage: (message: unknown) => {
        console.log('[Mock VSCode] postMessage:', message);
      },
      getState: () => null,
      setState: () => {},
    };
  }

  return vscodeApi!;
}

/**
 * Sends a message from the webview to the host.
 */
export function postMessageToHost(message: WebviewMessage): void {
  const api = getVSCodeApi();
  api.postMessage(message);
}

/**
 * Registers a handler for messages from the host.
 */
export function onHostMessage(handler: HostMessageHandler): () => void {
  const listener = (event: MessageEvent) => {
    const message = event.data as HostMessage;
    if (message && message.version === PROTOCOL_VERSION) {
      handler(message);
    }
  };

  window.addEventListener('message', listener);
  return () => window.removeEventListener('message', listener);
}
