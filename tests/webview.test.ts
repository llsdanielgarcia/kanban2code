import { expect, test } from 'vitest';
import {
  createEnvelope,
  parseDeleteTaskPayload,
  parseRunnerState,
  validateEnvelope,
  MESSAGE_VERSION,
  HostToWebviewMessageTypes,
  WebviewToHostMessageTypes,
  EnvelopeSchema,
  RunnerStateSchema,
} from '../src/webview/messaging';

test('createEnvelope creates versioned envelope', () => {
  const msg = createEnvelope('TaskUpdated', { id: '1' });
  expect(msg).toEqual({ version: MESSAGE_VERSION, type: 'TaskUpdated', payload: { id: '1' } });
});

test('validateEnvelope accepts known message types', () => {
  const raw = {
    version: MESSAGE_VERSION,
    type: HostToWebviewMessageTypes[0],
    payload: { foo: 'bar' },
  };
  const parsed = validateEnvelope(raw);
  expect(parsed.type).toBe(raw.type);
});

test('validateEnvelope throws on invalid data', () => {
  expect(() => validateEnvelope({ version: 99, type: 'NOPE', payload: {} })).toThrow(
    'Invalid message envelope',
  );
});

test('parseDeleteTaskPayload accepts a taskId', () => {
  expect(parseDeleteTaskPayload({ taskId: 'abc' })).toEqual({ taskId: 'abc' });
});

test('parseDeleteTaskPayload throws on invalid payload', () => {
  expect(() => parseDeleteTaskPayload({ taskId: '' })).toThrow('Invalid DeleteTask payload');
});

test('new HostToWebview message types validate through EnvelopeSchema', () => {
  expect(() =>
    EnvelopeSchema.parse({ version: MESSAGE_VERSION, type: 'ModesLoaded', payload: { modes: [] } }),
  ).not.toThrow();
  expect(() =>
    EnvelopeSchema.parse({
      version: MESSAGE_VERSION,
      type: 'RunnerStateChanged',
      payload: { isRunning: true },
    }),
  ).not.toThrow();
});

test('new WebviewToHost message types validate through EnvelopeSchema', () => {
  expect(() =>
    EnvelopeSchema.parse({ version: MESSAGE_VERSION, type: 'RequestModes', payload: {} }),
  ).not.toThrow();
  expect(() =>
    EnvelopeSchema.parse({
      version: MESSAGE_VERSION,
      type: 'CreateMode',
      payload: { name: 'test' },
    }),
  ).not.toThrow();
  expect(() =>
    EnvelopeSchema.parse({
      version: MESSAGE_VERSION,
      type: 'UpdateMode',
      payload: { name: 'test' },
    }),
  ).not.toThrow();
  expect(() =>
    EnvelopeSchema.parse({
      version: MESSAGE_VERSION,
      type: 'DeleteMode',
      payload: { name: 'test' },
    }),
  ).not.toThrow();
  expect(() =>
    EnvelopeSchema.parse({ version: MESSAGE_VERSION, type: 'RunTask', payload: { taskId: 't1' } }),
  ).not.toThrow();
  expect(() =>
    EnvelopeSchema.parse({
      version: MESSAGE_VERSION,
      type: 'RunColumn',
      payload: { stage: 'code' },
    }),
  ).not.toThrow();
  expect(() =>
    EnvelopeSchema.parse({ version: MESSAGE_VERSION, type: 'StopRunner', payload: {} }),
  ).not.toThrow();
});

test('RunnerStateSchema validates valid runner state', () => {
  expect(RunnerStateSchema.parse({ isRunning: true })).toEqual({ isRunning: true });
  expect(
    RunnerStateSchema.parse({
      isRunning: false,
      activeTaskId: 't1',
      activeStage: 'code',
      progress: 50,
    }),
  ).toEqual({
    isRunning: false,
    activeTaskId: 't1',
    activeStage: 'code',
    progress: 50,
  });
});

test('RunnerStateSchema rejects invalid stage', () => {
  expect(() => RunnerStateSchema.parse({ isRunning: true, activeStage: 'invalid' })).toThrow();
});

test('RunnerStateSchema rejects out-of-range progress', () => {
  expect(() => RunnerStateSchema.parse({ isRunning: true, progress: 150 })).toThrow();
  expect(() => RunnerStateSchema.parse({ isRunning: true, progress: -10 })).toThrow();
});

test('parseRunnerState accepts valid payload', () => {
  expect(parseRunnerState({ isRunning: true, activeTaskId: 't1' })).toEqual({
    isRunning: true,
    activeTaskId: 't1',
  });
});

test('parseRunnerState throws on invalid payload', () => {
  expect(() => parseRunnerState({ isRunning: 'yes' })).toThrow('Invalid RunnerState payload');
});
