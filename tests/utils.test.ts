import { expect, test } from 'vitest';
import { slugify } from '../src/utils/text';

test('slugify converts text to kebab-case', () => {
  expect(slugify('Hello World')).toBe('hello-world');
  expect(slugify('Kanban2Code is Awesome!')).toBe('kanban2code-is-awesome');
  expect(slugify('  Trim Me  ')).toBe('trim-me');
});
