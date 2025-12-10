import { expect, test } from 'vitest';
import { createMessage } from '../src/webview/messaging';

test('createMessage creates correct structure', () => {
  const msg = createMessage('ALERT', { text: 'Hello' });
  expect(msg).toEqual({
    type: 'ALERT',
    payload: { text: 'Hello' },
  });
});
