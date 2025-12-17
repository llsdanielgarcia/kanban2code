/**
 * E2E Test Setup
 * Phase 5.6: E2E Tests for Core Workflows
 *
 * Sets up the VS Code test environment for E2E tests.
 */

import { vi, beforeAll, afterAll } from 'vitest';
import * as path from 'path';
import * as fs from 'fs';
import * as os from 'os';

// Test workspace directory
export const TEST_WORKSPACE = path.join(os.tmpdir(), 'kanban2code-e2e-test');

// Setup test workspace before all tests
beforeAll(async () => {
  // Create fresh test workspace
  if (fs.existsSync(TEST_WORKSPACE)) {
    fs.rmSync(TEST_WORKSPACE, { recursive: true });
  }
  fs.mkdirSync(TEST_WORKSPACE, { recursive: true });

  console.log(`E2E test workspace created at: ${TEST_WORKSPACE}`);
});

// Cleanup after all tests
afterAll(async () => {
  // Remove test workspace
  if (fs.existsSync(TEST_WORKSPACE)) {
    fs.rmSync(TEST_WORKSPACE, { recursive: true });
  }
  console.log('E2E test workspace cleaned up');
});

// Test utilities
export const e2eUtils = {
  /**
   * Create a .kanban2code workspace structure
   */
  async createKanbanWorkspace(rootPath: string = TEST_WORKSPACE): Promise<void> {
    const kanbanPath = path.join(rootPath, '.kanban2code');

    const directories = [
      kanbanPath,
      path.join(kanbanPath, 'inbox'),
      path.join(kanbanPath, 'projects'),
      path.join(kanbanPath, '_agents'),
      path.join(kanbanPath, '_archive'),
      path.join(kanbanPath, '_context'),
    ];

    for (const dir of directories) {
      fs.mkdirSync(dir, { recursive: true });
    }

    // Create how-it-works.md
    fs.writeFileSync(
      path.join(kanbanPath, 'how-it-works.md'),
      `# How Kanban2Code Works\n\nThis is a test workspace.\n`
    );
  },

  /**
   * Create a test task file
   */
  async createTask(
    title: string,
    stage: string = 'inbox',
    options: {
      project?: string;
      phase?: string;
      tags?: string[];
      agent?: string;
      content?: string;
    } = {}
  ): Promise<string> {
    const kanbanPath = path.join(TEST_WORKSPACE, '.kanban2code');
    const timestamp = Date.now();
    const slug = title.toLowerCase().replace(/[^a-z0-9]+/g, '-');
    const filename = `${timestamp}-${slug}.md`;

    let targetDir: string;
    if (options.project) {
      const projectPath = path.join(kanbanPath, 'projects', options.project);
      if (options.phase) {
        targetDir = path.join(projectPath, options.phase);
      } else {
        targetDir = projectPath;
      }
    } else {
      targetDir = path.join(kanbanPath, 'inbox');
    }

    fs.mkdirSync(targetDir, { recursive: true });

    const frontmatter = [
      `stage: ${stage}`,
      `created: ${new Date().toISOString()}`,
    ];

    if (options.tags?.length) {
      frontmatter.push(`tags: [${options.tags.join(', ')}]`);
    }

    if (options.agent) {
      frontmatter.push(`agent: ${options.agent}`);
    }

    const content = `---
${frontmatter.join('\n')}
---

# ${title}

${options.content ?? 'Test task content.'}
`;

    const filePath = path.join(targetDir, filename);
    fs.writeFileSync(filePath, content);

    return filePath;
  },

  /**
   * Read a task file and parse frontmatter
   */
  async readTask(filePath: string): Promise<{ stage: string; title: string; content: string }> {
    const content = fs.readFileSync(filePath, 'utf-8');
    const match = content.match(/^---\n([\s\S]*?)\n---\n\n# (.+)\n\n([\s\S]*)$/);

    if (!match) {
      throw new Error(`Invalid task format: ${filePath}`);
    }

    const frontmatter = match[1];
    const stageMatch = frontmatter.match(/stage: (\w+)/);

    return {
      stage: stageMatch?.[1] ?? 'inbox',
      title: match[2],
      content: match[3].trim(),
    };
  },

  /**
   * Wait for a condition with timeout
   */
  async waitFor(
    condition: () => boolean | Promise<boolean>,
    timeout: number = 5000,
    interval: number = 100
  ): Promise<void> {
    const start = Date.now();
    while (Date.now() - start < timeout) {
      if (await condition()) {
        return;
      }
      await new Promise(resolve => setTimeout(resolve, interval));
    }
    throw new Error(`Timeout waiting for condition after ${timeout}ms`);
  },

  /**
   * Clean the test workspace
   */
  async cleanWorkspace(): Promise<void> {
    const kanbanPath = path.join(TEST_WORKSPACE, '.kanban2code');
    if (fs.existsSync(kanbanPath)) {
      fs.rmSync(kanbanPath, { recursive: true });
    }
  },
};

// Make utilities available globally
declare global {
  var e2eUtils: typeof e2eUtils;
}

globalThis.e2eUtils = e2eUtils;
