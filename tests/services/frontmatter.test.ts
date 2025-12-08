import { describe, it, expect } from 'vitest';
import {
  parseTaskFile,
  stringifyTask,
  isValidStage,
  generateTaskId,
  extractTitle,
  updateStageInContent,
} from '../../src/services/frontmatter';
import type { Task } from '../../src/types/task';

describe('frontmatter', () => {
  describe('isValidStage', () => {
    it('should return true for valid stages', () => {
      expect(isValidStage('inbox')).toBe(true);
      expect(isValidStage('plan')).toBe(true);
      expect(isValidStage('code')).toBe(true);
      expect(isValidStage('audit')).toBe(true);
      expect(isValidStage('completed')).toBe(true);
    });

    it('should return false for invalid stages', () => {
      expect(isValidStage('invalid')).toBe(false);
      expect(isValidStage('')).toBe(false);
      expect(isValidStage('INBOX')).toBe(false);
      expect(isValidStage(null)).toBe(false);
      expect(isValidStage(undefined)).toBe(false);
      expect(isValidStage(123)).toBe(false);
    });
  });

  describe('generateTaskId', () => {
    it('should generate id from filename', () => {
      expect(generateTaskId('/path/to/my-task.md')).toBe('my-task');
      expect(generateTaskId('/path/to/My Task.md')).toBe('my-task');
      expect(generateTaskId('simple.md')).toBe('simple');
    });

    it('should normalize special characters', () => {
      expect(generateTaskId('/path/to/task_name.md')).toBe('task_name');
      expect(generateTaskId('/path/to/task 123.md')).toBe('task-123');
      expect(generateTaskId('/path/to/UPPERCASE.md')).toBe('uppercase');
    });
  });

  describe('extractTitle', () => {
    it('should extract title from h1 heading', () => {
      const content = '# My Task Title\n\nSome content';
      expect(extractTitle(content, '/path/to/file.md')).toBe('My Task Title');
    });

    it('should handle h1 with extra whitespace', () => {
      const content = '#   Trimmed Title  \n\nContent';
      expect(extractTitle(content, '/path/to/file.md')).toBe('Trimmed Title');
    });

    it('should fall back to filename if no h1', () => {
      const content = 'Just some content without heading';
      expect(extractTitle(content, '/path/to/my-file.md')).toBe('my-file');
    });

    it('should ignore h2 and lower headings', () => {
      const content = '## Not a title\n\n### Also not';
      expect(extractTitle(content, '/path/to/fallback.md')).toBe('fallback');
    });
  });

  describe('parseTaskFile', () => {
    it('should parse valid frontmatter', () => {
      const content = `---
stage: plan
title: Test Task
tags:
  - mvp
  - feature
created: 2025-01-15T10:00:00Z
---

# Test Task

This is the content.`;

      const { task } = parseTaskFile(content, '/path/to/test-task.md');

      expect(task.id).toBe('test-task');
      expect(task.stage).toBe('plan');
      expect(task.title).toBe('Test Task');
      expect(task.tags).toEqual(['mvp', 'feature']);
      // Date may be parsed differently, just check it exists
      expect(task.created).toBeDefined();
      expect(task.content).toContain('# Test Task');
      expect(task.content).toContain('This is the content.');
    });

    it('should default stage to inbox if missing', () => {
      const content = `---
title: No Stage Task
---

# Content`;

      const { task } = parseTaskFile(content, '/path/to/task.md');
      expect(task.stage).toBe('inbox');
    });

    it('should default stage to inbox if invalid', () => {
      const content = `---
stage: invalid-stage
---

# Content`;

      const { task } = parseTaskFile(content, '/path/to/task.md');
      expect(task.stage).toBe('inbox');
    });

    it('should extract title from h1 if not in frontmatter', () => {
      const content = `---
stage: code
---

# Extracted Title

Content here.`;

      const { task } = parseTaskFile(content, '/path/to/task.md');
      expect(task.title).toBe('Extracted Title');
    });

    it('should handle single tag as string', () => {
      const content = `---
stage: inbox
tags: single-tag
---

# Task`;

      const { task } = parseTaskFile(content, '/path/to/task.md');
      expect(task.tags).toEqual(['single-tag']);
    });

    it('should handle empty frontmatter', () => {
      const content = `---
---

# Empty Frontmatter`;

      const { task } = parseTaskFile(content, '/path/to/task.md');
      expect(task.stage).toBe('inbox');
      expect(task.title).toBe('Empty Frontmatter');
    });

    it('should handle no frontmatter', () => {
      const content = '# Just Content\n\nNo frontmatter here.';

      const { task } = parseTaskFile(content, '/path/to/task.md');
      expect(task.stage).toBe('inbox');
      expect(task.title).toBe('Just Content');
    });

    it('should preserve unknown frontmatter fields', () => {
      const content = `---
stage: plan
customField: custom value
nestedObject:
  key: value
---

# Task`;

      const { rawFrontmatter } = parseTaskFile(content, '/path/to/task.md');
      expect(rawFrontmatter.customField).toBe('custom value');
      expect(rawFrontmatter.nestedObject).toEqual({ key: 'value' });
    });

    it('should handle malformed YAML gracefully', () => {
      const content = `---
stage: [invalid yaml
title: broken
---

# Content`;

      // Should not throw, should return defaults
      const { task } = parseTaskFile(content, '/path/to/task.md');
      expect(task.stage).toBe('inbox');
    });

    it('should parse optional fields correctly', () => {
      const content = `---
stage: code
agent: claude
parent: parent-task
contexts:
  - context1.md
  - context2.md
order: 5
---

# Task`;

      const { task } = parseTaskFile(content, '/path/to/task.md');
      expect(task.agent).toBe('claude');
      expect(task.parent).toBe('parent-task');
      expect(task.contexts).toEqual(['context1.md', 'context2.md']);
      expect(task.order).toBe(5);
    });
  });

  describe('stringifyTask', () => {
    it('should serialize task with all fields', () => {
      const task: Task = {
        id: 'test-task',
        filePath: '/path/to/test-task.md',
        title: 'Test Task',
        stage: 'plan',
        tags: ['mvp', 'feature'],
        created: '2025-01-15T10:00:00Z',
        content: '# Test Task\n\nContent here.',
      };

      const result = stringifyTask(task);

      expect(result).toContain('stage: plan');
      expect(result).toContain('tags:');
      expect(result).toContain('- mvp');
      expect(result).toContain('- feature');
      // Date format may vary with quotes
      expect(result).toContain('created:');
      expect(result).toContain('# Test Task');
      expect(result).toContain('Content here.');
    });

    it('should not include title if extractable from content', () => {
      const task: Task = {
        id: 'test',
        filePath: '/path/to/test.md',
        title: 'Test Title',
        stage: 'inbox',
        content: '# Test Title\n\nContent',
      };

      const result = stringifyTask(task);
      expect(result).not.toMatch(/^title:/m);
    });

    it('should include title if different from h1', () => {
      const task: Task = {
        id: 'test',
        filePath: '/path/to/test.md',
        title: 'Different Title',
        stage: 'inbox',
        content: '# Content Heading\n\nContent',
      };

      const result = stringifyTask(task);
      expect(result).toContain('title: Different Title');
    });

    it('should preserve unknown fields from raw frontmatter', () => {
      const task: Task = {
        id: 'test',
        filePath: '/path/to/test.md',
        title: 'Test',
        stage: 'plan',
        content: '# Test\n\nContent',
      };

      const rawFrontmatter = {
        customField: 'preserved',
        anotherField: 123,
      };

      const result = stringifyTask(task, rawFrontmatter);
      expect(result).toContain('customField: preserved');
      expect(result).toContain('anotherField: 123');
    });

    it('should not include empty arrays', () => {
      const task: Task = {
        id: 'test',
        filePath: '/path/to/test.md',
        title: 'Test',
        stage: 'inbox',
        tags: [],
        content: '# Test',
      };

      const result = stringifyTask(task);
      expect(result).not.toContain('tags:');
    });

    it('should not include project and phase in frontmatter', () => {
      const task: Task = {
        id: 'test',
        filePath: '/path/to/test.md',
        title: 'Test',
        stage: 'inbox',
        project: 'my-project',
        phase: 'phase-1',
        content: '# Test',
      };

      const result = stringifyTask(task);
      expect(result).not.toContain('project:');
      expect(result).not.toContain('phase:');
    });
  });

  describe('updateStageInContent', () => {
    it('should update stage while preserving other content', () => {
      const original = `---
stage: inbox
title: My Task
customField: preserved
---

# My Task

Content here.`;

      const updated = updateStageInContent(original, 'plan');

      expect(updated).toContain('stage: plan');
      expect(updated).toContain('customField: preserved');
      expect(updated).toContain('# My Task');
      expect(updated).toContain('Content here.');
    });

    it('should work with minimal frontmatter', () => {
      const original = `---
stage: code
---

# Task`;

      const updated = updateStageInContent(original, 'audit');
      expect(updated).toContain('stage: audit');
    });
  });

  describe('round-trip parsing', () => {
    it('should preserve content through parse/stringify cycle', () => {
      const original = `---
stage: plan
tags:
  - important
  - mvp
created: 2025-01-15T10:00:00Z
customField: should be preserved
---

# My Important Task

This is the task description with **bold** and *italic* text.

## Subtask 1

- Item 1
- Item 2

\`\`\`javascript
const code = 'example';
\`\`\``;

      const { task, rawFrontmatter } = parseTaskFile(original, '/path/to/task.md');
      const result = stringifyTask(task, rawFrontmatter);
      const { task: reparsed } = parseTaskFile(result, '/path/to/task.md');

      expect(reparsed.stage).toBe(task.stage);
      expect(reparsed.tags).toEqual(task.tags);
      expect(reparsed.created).toBe(task.created);
      expect(reparsed.content).toContain('**bold**');
      expect(reparsed.content).toContain('```javascript');
    });

    it('should handle special characters in content', () => {
      const original = `---
stage: inbox
---

# Task with Special Characters

Content with: colons, "quotes", 'apostrophes', and --- dashes.

Also émojis: 🎉 and unicode: café`;

      const { task, rawFrontmatter } = parseTaskFile(original, '/path/to/task.md');
      const result = stringifyTask(task, rawFrontmatter);
      const { task: reparsed } = parseTaskFile(result, '/path/to/task.md');

      expect(reparsed.content).toContain('colons');
      expect(reparsed.content).toContain('quotes');
      expect(reparsed.content).toContain('🎉');
      expect(reparsed.content).toContain('café');
    });
  });
});
