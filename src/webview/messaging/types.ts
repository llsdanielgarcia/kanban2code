import { z } from 'zod';
import type { Task, Stage } from '../../types/task';

/**
 * Current protocol version.
 * Increment when making breaking changes to the message format.
 */
export const PROTOCOL_VERSION = 1;

/**
 * Base message envelope with version for compatibility checking.
 */
export interface MessageEnvelope<T = unknown> {
  version: typeof PROTOCOL_VERSION;
  type: string;
  payload: T;
  requestId?: string; // For request/response correlation
}

// ============================================================================
// Host → Webview Messages
// ============================================================================

/**
 * Host message types (extension → webview)
 */
export type HostMessageType =
  | 'tasks:loaded'
  | 'task:updated'
  | 'task:created'
  | 'task:deleted'
  | 'workspace:status'
  | 'error';

/**
 * All tasks have been loaded/refreshed.
 */
export interface TasksLoadedPayload {
  tasks: Task[];
}

/**
 * A single task was updated.
 */
export interface TaskUpdatedPayload {
  task: Task;
}

/**
 * A new task was created.
 */
export interface TaskCreatedPayload {
  task: Task;
}

/**
 * A task was deleted.
 */
export interface TaskDeletedPayload {
  id: string;
  filePath: string;
}

/**
 * Workspace status update.
 */
export interface WorkspaceStatusPayload {
  status: 'valid' | 'missing' | 'invalid' | 'forbidden';
  root: string | null;
  message: string;
}

/**
 * Error notification.
 */
export interface ErrorPayload {
  message: string;
  code?: string;
  details?: unknown;
}

/**
 * Union of all host messages.
 */
export type HostMessage =
  | MessageEnvelope<TasksLoadedPayload> & { type: 'tasks:loaded' }
  | MessageEnvelope<TaskUpdatedPayload> & { type: 'task:updated' }
  | MessageEnvelope<TaskCreatedPayload> & { type: 'task:created' }
  | MessageEnvelope<TaskDeletedPayload> & { type: 'task:deleted' }
  | MessageEnvelope<WorkspaceStatusPayload> & { type: 'workspace:status' }
  | MessageEnvelope<ErrorPayload> & { type: 'error' };

// ============================================================================
// Webview → Host Messages
// ============================================================================

/**
 * Webview message types (webview → extension)
 */
export type WebviewMessageType =
  | 'refresh'
  | 'task:move'
  | 'task:create'
  | 'task:archive'
  | 'task:open'
  | 'task:delete'
  | 'task:select'
  | 'filters:changed'
  | 'context:copy'
  | 'scaffold';

/**
 * Request to refresh all tasks.
 */
export interface RefreshPayload {
  force?: boolean;
}

/**
 * Request to move a task to a new stage.
 */
export interface TaskMovePayload {
  id: string;
  filePath: string;
  newStage: Stage;
}

/**
 * Request to create a new task.
 */
export interface TaskCreatePayload {
  title: string;
  project?: string;
  phase?: string;
  stage?: Stage;
  content?: string;
}

/**
 * Request to archive a task.
 */
export interface TaskArchivePayload {
  id: string;
  filePath: string;
}

/**
 * Request to open a task in the editor.
 */
export interface TaskOpenPayload {
  filePath: string;
}

/**
 * Request to delete a task.
 */
export interface TaskDeletePayload {
  id: string;
  filePath: string;
}

/**
 * Request to select a task (e.g., to sync selection with host).
 */
export interface TaskSelectPayload {
  id: string;
  filePath: string;
}

/**
 * Notify host of filter changes in the webview.
 */
export interface FiltersChangedPayload {
  project?: string | null;
  phase?: string | null;
  tags?: string[];
  search?: string;
}

/**
 * Request to copy a context file.
 */
export interface ContextCopyPayload {
  filePath: string;
}

/**
 * Request to scaffold the workspace.
 */
export interface ScaffoldPayload {
  // No payload needed
}

/**
 * Union of all webview messages.
 */
export type WebviewMessage =
  | MessageEnvelope<RefreshPayload> & { type: 'refresh' }
  | MessageEnvelope<TaskMovePayload> & { type: 'task:move' }
  | MessageEnvelope<TaskCreatePayload> & { type: 'task:create' }
  | MessageEnvelope<TaskArchivePayload> & { type: 'task:archive' }
  | MessageEnvelope<TaskOpenPayload> & { type: 'task:open' }
  | MessageEnvelope<TaskDeletePayload> & { type: 'task:delete' }
  | MessageEnvelope<TaskSelectPayload> & { type: 'task:select' }
  | MessageEnvelope<FiltersChangedPayload> & { type: 'filters:changed' }
  | MessageEnvelope<ContextCopyPayload> & { type: 'context:copy' }
  | MessageEnvelope<ScaffoldPayload> & { type: 'scaffold' };

// ============================================================================
// Zod Schemas for Runtime Validation
// ============================================================================

/**
 * Stage schema
 */
export const StageSchema = z.enum(['inbox', 'plan', 'code', 'audit', 'completed']);

/**
 * Base envelope schema
 */
export const MessageEnvelopeSchema = z.object({
  version: z.literal(PROTOCOL_VERSION),
  type: z.string(),
  payload: z.unknown(),
  requestId: z.string().optional(),
});

/**
 * Webview message payload schemas
 */
export const RefreshPayloadSchema = z.object({
  force: z.boolean().optional(),
});

export const TaskMovePayloadSchema = z.object({
  id: z.string(),
  filePath: z.string(),
  newStage: StageSchema,
});

export const TaskCreatePayloadSchema = z.object({
  title: z.string().min(1),
  project: z.string().optional(),
  phase: z.string().optional(),
  stage: StageSchema.optional(),
  content: z.string().optional(),
});

export const TaskArchivePayloadSchema = z.object({
  id: z.string(),
  filePath: z.string(),
});

export const TaskOpenPayloadSchema = z.object({
  filePath: z.string(),
});

export const TaskDeletePayloadSchema = z.object({
  id: z.string(),
  filePath: z.string(),
});

export const TaskSelectPayloadSchema = z.object({
  id: z.string(),
  filePath: z.string(),
});

export const FiltersChangedPayloadSchema = z.object({
  project: z.string().nullable().optional(),
  phase: z.string().nullable().optional(),
  tags: z.array(z.string()).optional(),
  search: z.string().optional(),
});

export const ContextCopyPayloadSchema = z.object({
  filePath: z.string(),
});

export const ScaffoldPayloadSchema = z.object({});

/**
 * Map of message types to their payload schemas
 */
export const WebviewPayloadSchemas: Record<WebviewMessageType, z.ZodSchema> = {
  refresh: RefreshPayloadSchema,
  'task:move': TaskMovePayloadSchema,
  'task:create': TaskCreatePayloadSchema,
  'task:archive': TaskArchivePayloadSchema,
  'task:open': TaskOpenPayloadSchema,
  'task:delete': TaskDeletePayloadSchema,
  'task:select': TaskSelectPayloadSchema,
  'filters:changed': FiltersChangedPayloadSchema,
  'context:copy': ContextCopyPayloadSchema,
  scaffold: ScaffoldPayloadSchema,
};

// ============================================================================
// Type Guards
// ============================================================================

/**
 * Checks if a message has the correct protocol version.
 */
export function isValidVersion(message: unknown): boolean {
  if (typeof message !== 'object' || message === null) {
    return false;
  }
  return (message as MessageEnvelope).version === PROTOCOL_VERSION;
}

/**
 * Validates a webview message and returns typed result.
 */
export function validateWebviewMessage(
  message: unknown,
): { success: true; data: WebviewMessage } | { success: false; error: string } {
  // Check basic envelope structure
  const envelopeResult = MessageEnvelopeSchema.safeParse(message);
  if (!envelopeResult.success) {
    return { success: false, error: 'Invalid message envelope' };
  }

  const { type, payload } = envelopeResult.data;

  // Check if type is valid
  if (!(type in WebviewPayloadSchemas)) {
    return { success: false, error: `Unknown message type: ${type}` };
  }

  // Validate payload against type-specific schema
  const payloadSchema = WebviewPayloadSchemas[type as WebviewMessageType];
  const payloadResult = payloadSchema.safeParse(payload);
  if (!payloadResult.success) {
    return {
      success: false,
      error: `Invalid payload for ${type}: ${payloadResult.error.message}`,
    };
  }

  return { success: true, data: message as WebviewMessage };
}
