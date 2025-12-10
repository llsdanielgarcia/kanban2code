import { expect, test } from 'vitest';
import { createEnvelope, validateEnvelope, MESSAGE_VERSION, HostToWebviewMessageTypes } from '../src/webview/messaging';

test('createEnvelope creates versioned envelope', () => {
  const msg = createEnvelope('TaskUpdated', { id: '1' });
  expect(msg).toEqual({ version: MESSAGE_VERSION, type: 'TaskUpdated', payload: { id: '1' } });
});

test('validateEnvelope accepts known message types', () => {
  const raw = { version: MESSAGE_VERSION, type: HostToWebviewMessageTypes[0], payload: { foo: 'bar' } };
  const parsed = validateEnvelope(raw);
  expect(parsed.type).toBe(raw.type);
});

test('validateEnvelope throws on invalid data', () => {
  expect(() => validateEnvelope({ version: 99, type: 'NOPE', payload: {} })).toThrow('Invalid message envelope');
});
