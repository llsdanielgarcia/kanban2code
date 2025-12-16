import { z } from 'zod';

export const MESSAGE_VERSION = 1 as const;

export const HostToWebviewMessageTypes = [
  'ShowKeyboardShortcuts',
  'OpenTaskModal',
  'TaskUpdated',
  'TaskSelected',
  'ToggleLayout',
  'FilterChanged',
  'InitState',
  'TemplatesLoaded',
  'ContextsLoaded',
  'AgentsLoaded',
  'FilePicked',
  'FolderPicked',
  'TaskContentLoaded',
  'TaskContentLoadFailed',
  'TaskContentSaved',
  'TaskContentSaveFailed',
  'FullTaskDataLoaded',
  'FullTaskDataLoadFailed',
  'TaskMetadataSaved',
  'TaskMetadataSaveFailed',
  'TemplateContentLoaded',
  'TemplateContentLoadFailed',
] as const;

export const WebviewToHostMessageTypes = [
  // Filter changes can originate from sidebar or board
  'FilterChanged',
  'CreateTask',
  'MoveTask',
  'MoveTaskToLocation',
  'ArchiveTask',
  'DeleteTask',
  'CopyContext',
  'OpenTask',
  'OpenBoard',
  'OpenSettings',
  'CreateKanban',
  'CreateProject',
  'CreateContext',
  'CreateAgent',
  'CreateTemplate',
  'UpdateTemplate',
  'TaskContextMenu',
  'RequestTemplates',
  'RequestContexts',
  'RequestAgents',
  'PickFile',
  'PickFolder',
  'RequestTaskContent',
  'SaveTaskContent',
  'RequestFullTaskData',
  'SaveTaskWithMetadata',
  'RequestTemplateContent',
  // Webview ready handshake - requests initial state from host
  'RequestState',
  // Basic demo/ping path used by the placeholder UI
  'ALERT',
] as const;

export type HostToWebviewType = typeof HostToWebviewMessageTypes[number];
export type WebviewToHostType = typeof WebviewToHostMessageTypes[number];
export type MessageType = HostToWebviewType | WebviewToHostType;

export interface MessageEnvelope<TPayload = unknown> {
  version: typeof MESSAGE_VERSION;
  type: MessageType;
  payload: TPayload;
}

// Backward-compatible alias used by the webview/host code
export type WebviewMessage<TPayload = unknown> = MessageEnvelope<TPayload>;

export const EnvelopeSchema = z.object({
  version: z.literal(MESSAGE_VERSION),
  type: z.union([
    z.enum(HostToWebviewMessageTypes),
    z.enum(WebviewToHostMessageTypes),
  ]),
  payload: z.unknown(),
});

export const DeleteTaskPayloadSchema = z.object({
  taskId: z.string().min(1),
});

export function createEnvelope<TPayload>(type: MessageType, payload: TPayload): MessageEnvelope<TPayload> {
  return { version: MESSAGE_VERSION, type, payload };
}

export function validateEnvelope<TPayload = unknown>(data: unknown): MessageEnvelope<TPayload> {
  const result = EnvelopeSchema.safeParse(data);
  if (!result.success) {
    throw new Error(`Invalid message envelope: ${result.error.message}`);
  }
  return result.data as MessageEnvelope<TPayload>;
}

export function parseDeleteTaskPayload(payload: unknown): { taskId: string } {
  const parsed = DeleteTaskPayloadSchema.safeParse(payload);
  if (!parsed.success) {
    throw new Error(`Invalid DeleteTask payload: ${parsed.error.message}`);
  }
  return parsed.data;
}

// Convenience helper for UI/host callers who expect a simple creator
export const createMessage = createEnvelope;
