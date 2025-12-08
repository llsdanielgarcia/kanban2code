import { describe, it, expect } from 'vitest';
import {
  PROTOCOL_VERSION,
  isValidVersion,
  validateWebviewMessage,
  StageSchema,
  TaskMovePayloadSchema,
  TaskCreatePayloadSchema,
  TaskSelectPayloadSchema,
  FiltersChangedPayloadSchema,
  ContextCopyPayloadSchema,
} from '../../src/webview/messaging/types';
import {
  createTasksLoadedMessage,
  createTaskUpdatedMessage,
  createTaskDeletedMessage,
  createWorkspaceStatusMessage,
  createErrorMessage,
  createRefreshMessage,
  createTaskMoveMessage,
  createTaskCreateMessage,
  createTaskArchiveMessage,
  createTaskOpenMessage,
  createTaskDeleteMessage,
  createTaskSelectMessage,
  createFiltersChangedMessage,
  createContextCopyMessage,
  createScaffoldMessage,
} from '../../src/webview/messaging/protocol';
import type { Task } from '../../src/types/task';

describe('webview messaging', () => {
  describe('PROTOCOL_VERSION', () => {
    it('should be defined and be a number', () => {
      expect(PROTOCOL_VERSION).toBeDefined();
      expect(typeof PROTOCOL_VERSION).toBe('number');
    });
  });

  describe('isValidVersion', () => {
    it('should return true for messages with correct version', () => {
      const message = { version: PROTOCOL_VERSION, type: 'test', payload: {} };
      expect(isValidVersion(message)).toBe(true);
    });

    it('should return false for messages with wrong version', () => {
      const message = { version: 999, type: 'test', payload: {} };
      expect(isValidVersion(message)).toBe(false);
    });

    it('should return false for non-objects', () => {
      expect(isValidVersion(null)).toBe(false);
      expect(isValidVersion(undefined)).toBe(false);
      expect(isValidVersion('string')).toBe(false);
    });
  });

  describe('StageSchema', () => {
    it('should validate valid stages', () => {
      expect(StageSchema.safeParse('inbox').success).toBe(true);
      expect(StageSchema.safeParse('plan').success).toBe(true);
      expect(StageSchema.safeParse('code').success).toBe(true);
      expect(StageSchema.safeParse('audit').success).toBe(true);
      expect(StageSchema.safeParse('completed').success).toBe(true);
    });

    it('should reject invalid stages', () => {
      expect(StageSchema.safeParse('invalid').success).toBe(false);
      expect(StageSchema.safeParse('').success).toBe(false);
      expect(StageSchema.safeParse(123).success).toBe(false);
    });
  });

  describe('TaskMovePayloadSchema', () => {
    it('should validate valid move payload', () => {
      const payload = {
        id: 'task-1',
        filePath: '/path/to/task.md',
        newStage: 'plan',
      };
      expect(TaskMovePayloadSchema.safeParse(payload).success).toBe(true);
    });

    it('should reject invalid move payload', () => {
      expect(TaskMovePayloadSchema.safeParse({}).success).toBe(false);
      expect(
        TaskMovePayloadSchema.safeParse({ id: 'task', newStage: 'invalid' }).success,
      ).toBe(false);
    });
  });

  describe('TaskCreatePayloadSchema', () => {
    it('should validate valid create payload', () => {
      expect(
        TaskCreatePayloadSchema.safeParse({ title: 'New Task' }).success,
      ).toBe(true);
      expect(
        TaskCreatePayloadSchema.safeParse({
          title: 'New Task',
          project: 'my-project',
          stage: 'plan',
        }).success,
      ).toBe(true);
    });

    it('should reject empty title', () => {
      expect(TaskCreatePayloadSchema.safeParse({ title: '' }).success).toBe(false);
    });
  });

  describe('TaskSelectPayloadSchema', () => {
    it('should validate valid select payload', () => {
      const payload = { id: 'task-1', filePath: '/path/to/task.md' };
      expect(TaskSelectPayloadSchema.safeParse(payload).success).toBe(true);
    });

    it('should reject missing fields', () => {
      expect(TaskSelectPayloadSchema.safeParse({}).success).toBe(false);
    });
  });

  describe('FiltersChangedPayloadSchema', () => {
    it('should validate filters payload', () => {
      const payload = { project: 'proj', phase: null, tags: ['a', 'b'], search: 'text' };
      expect(FiltersChangedPayloadSchema.safeParse(payload).success).toBe(true);
    });
  });

  describe('ContextCopyPayloadSchema', () => {
    it('should validate copy payload', () => {
      const payload = { filePath: '/path/to/context.md' };
      expect(ContextCopyPayloadSchema.safeParse(payload).success).toBe(true);
    });
  });

  describe('validateWebviewMessage', () => {
    it('should validate refresh message', () => {
      const message = createRefreshMessage();
      const result = validateWebviewMessage(message);
      expect(result.success).toBe(true);
    });

    it('should validate task:move message', () => {
      const message = createTaskMoveMessage('task-1', '/path/to/task.md', 'plan');
      const result = validateWebviewMessage(message);
      expect(result.success).toBe(true);
    });

    it('should validate task:create message', () => {
      const message = createTaskCreateMessage('New Task', { project: 'proj' });
      const result = validateWebviewMessage(message);
      expect(result.success).toBe(true);
    });

    it('should validate task:select message', () => {
      const message = createTaskSelectMessage('task-1', '/path/to/task.md');
      const result = validateWebviewMessage(message);
      expect(result.success).toBe(true);
    });

    it('should validate filters:changed message', () => {
      const message = createFiltersChangedMessage({ project: 'proj', tags: ['a'] });
      const result = validateWebviewMessage(message);
      expect(result.success).toBe(true);
    });

    it('should validate context:copy message', () => {
      const message = createContextCopyMessage('/path/context.md');
      const result = validateWebviewMessage(message);
      expect(result.success).toBe(true);
    });

    it('should validate task:archive message', () => {
      const message = createTaskArchiveMessage('task-1', '/path/to/task.md');
      const result = validateWebviewMessage(message);
      expect(result.success).toBe(true);
    });

    it('should validate task:open message', () => {
      const message = createTaskOpenMessage('/path/to/task.md');
      const result = validateWebviewMessage(message);
      expect(result.success).toBe(true);
    });

    it('should validate task:delete message', () => {
      const message = createTaskDeleteMessage('task-1', '/path/to/task.md');
      const result = validateWebviewMessage(message);
      expect(result.success).toBe(true);
    });

    it('should validate scaffold message', () => {
      const message = createScaffoldMessage();
      const result = validateWebviewMessage(message);
      expect(result.success).toBe(true);
    });

    it('should reject message with wrong version', () => {
      const message = { version: 999, type: 'refresh', payload: {} };
      const result = validateWebviewMessage(message);
      expect(result.success).toBe(false);
    });

    it('should reject message with unknown type', () => {
      const message = { version: PROTOCOL_VERSION, type: 'unknown', payload: {} };
      const result = validateWebviewMessage(message);
      expect(result.success).toBe(false);
    });

    it('should reject message with invalid payload', () => {
      const message = {
        version: PROTOCOL_VERSION,
        type: 'task:move',
        payload: { invalid: 'data' },
      };
      const result = validateWebviewMessage(message);
      expect(result.success).toBe(false);
    });
  });

  describe('Host message builders', () => {
    const mockTask: Task = {
      id: 'test-task',
      filePath: '/path/to/test-task.md',
      title: 'Test Task',
      stage: 'plan',
      content: '# Test Task',
    };

    it('should create tasks:loaded message', () => {
      const message = createTasksLoadedMessage([mockTask]);
      expect(message.version).toBe(PROTOCOL_VERSION);
      expect(message.type).toBe('tasks:loaded');
      expect(message.payload.tasks).toEqual([mockTask]);
    });

    it('should create task:updated message', () => {
      const message = createTaskUpdatedMessage(mockTask);
      expect(message.version).toBe(PROTOCOL_VERSION);
      expect(message.type).toBe('task:updated');
      expect(message.payload.task).toEqual(mockTask);
    });

    it('should create task:deleted message', () => {
      const message = createTaskDeletedMessage('task-1', '/path/to/task.md');
      expect(message.version).toBe(PROTOCOL_VERSION);
      expect(message.type).toBe('task:deleted');
      expect(message.payload.id).toBe('task-1');
      expect(message.payload.filePath).toBe('/path/to/task.md');
    });

    it('should create workspace:status message', () => {
      const message = createWorkspaceStatusMessage('valid', '/path/to/root', 'OK');
      expect(message.version).toBe(PROTOCOL_VERSION);
      expect(message.type).toBe('workspace:status');
      expect(message.payload.status).toBe('valid');
      expect(message.payload.root).toBe('/path/to/root');
      expect(message.payload.message).toBe('OK');
    });

    it('should create error message', () => {
      const message = createErrorMessage('Something went wrong', 'ERR_CODE', {
        extra: 'data',
      });
      expect(message.version).toBe(PROTOCOL_VERSION);
      expect(message.type).toBe('error');
      expect(message.payload.message).toBe('Something went wrong');
      expect(message.payload.code).toBe('ERR_CODE');
      expect(message.payload.details).toEqual({ extra: 'data' });
    });
  });

  describe('Webview message builders', () => {
    it('should create refresh message', () => {
      const message = createRefreshMessage(true);
      expect(message.version).toBe(PROTOCOL_VERSION);
      expect(message.type).toBe('refresh');
      expect(message.payload.force).toBe(true);
    });

    it('should create task:move message', () => {
      const message = createTaskMoveMessage('task-1', '/path/to/task.md', 'code');
      expect(message.version).toBe(PROTOCOL_VERSION);
      expect(message.type).toBe('task:move');
      expect(message.payload.id).toBe('task-1');
      expect(message.payload.newStage).toBe('code');
    });

    it('should create task:create message with options', () => {
      const message = createTaskCreateMessage('New Task', {
        project: 'proj',
        phase: 'phase-1',
        stage: 'plan',
        content: '# New Task',
      });
      expect(message.version).toBe(PROTOCOL_VERSION);
      expect(message.type).toBe('task:create');
      expect(message.payload.title).toBe('New Task');
      expect(message.payload.project).toBe('proj');
      expect(message.payload.phase).toBe('phase-1');
    });

    it('should create scaffold message', () => {
      const message = createScaffoldMessage();
      expect(message.version).toBe(PROTOCOL_VERSION);
      expect(message.type).toBe('scaffold');
    });
  });
});
