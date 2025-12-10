import { expect, test } from 'vitest';
import { WorkspaceState } from '../src/workspace/state';

test('WorkspaceState stores and retrieves root', () => {
  WorkspaceState.setKanbanRoot('/tmp/test');
  expect(WorkspaceState.kanbanRoot).toBe('/tmp/test');
  
  WorkspaceState.setKanbanRoot(null);
  expect(WorkspaceState.kanbanRoot).toBeNull();
});
