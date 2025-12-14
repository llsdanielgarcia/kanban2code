import { describe, expect, it } from 'vitest';
import * as fs from 'fs/promises';
import * as path from 'path';
import { parseTaskContent } from '../src/services/frontmatter';
import { STAGES } from '../src/core/constants';

function extractMarkdownCodeBlocks(markdown: string): string[] {
  const blocks: string[] = [];
  const re = /```md\n([\s\S]*?)```/g;
  for (const match of markdown.matchAll(re)) {
    blocks.push(match[1]);
  }
  return blocks;
}

describe('ai-guide examples', () => {
  it('includes parseable task examples', async () => {
    const guidePath = path.join(process.cwd(), '.kanban2code/_context/ai-guide.md');
    const guide = await fs.readFile(guidePath, 'utf-8');

    const blocks = extractMarkdownCodeBlocks(guide);
    expect(blocks.length).toBeGreaterThan(0);

    const taskLike = blocks.filter((b) => b.trimStart().startsWith('---') && b.includes('\n# '));
    expect(taskLike.length).toBeGreaterThan(0);

    for (const block of taskLike) {
      const task = parseTaskContent(block, path.join(process.cwd(), '.kanban2code/inbox/example.md'));
      expect(STAGES).toContain(task.stage);
      expect(task.title.trim().length).toBeGreaterThan(0);
    }
  });
});

