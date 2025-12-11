import { z } from 'zod';

export const MESSAGE_VERSION = 1 as const;

export const HostToWebviewMessageTypes = [
  'TaskUpdated',
  'TaskSelected',
  'FilterChanged',
  'InitState',
] as const;

export const WebviewToHostMessageTypes = [
  'CreateTask',
  'MoveTask',
  'CopyContext',
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

// Convenience helper for UI/host callers who expect a simple creator
export const createMessage = createEnvelope;
