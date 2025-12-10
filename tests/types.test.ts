import { expect, test } from 'vitest';
import { STAGES } from '../src/core/constants';
import { Stage } from '../src/types/task';

test('STAGES are in correct order', () => {
  expect(STAGES).toEqual(['inbox', 'plan', 'code', 'audit', 'completed']);
});

test('Stage type matches constants', () => {
  const stage: Stage = 'inbox';
  expect(STAGES).toContain(stage);
});
