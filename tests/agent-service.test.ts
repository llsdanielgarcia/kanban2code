import { beforeEach, afterEach, describe, expect, test } from 'vitest';
import * as fs from 'fs/promises';
import * as path from 'path';
import * as os from 'os';
import {
  listAvailableAgentConfigs,
  resolveAgentConfig,
  resolveAgentConfigFile,
  createAgentConfigFile,
  updateAgentConfigFile,
  deleteAgentConfigFile,
  loadAgentConfigContent,
  type AgentConfigFile,
} from '../src/services/agent-service';
import { KANBAN_FOLDER, AGENTS_FOLDER } from '../src/core/constants';

let TEST_DIR: string;
let KANBAN_ROOT: string;

beforeEach(async () => {
  TEST_DIR = path.join(os.tmpdir(), 'kanban-agent-' + Date.now());
  KANBAN_ROOT = path.join(TEST_DIR, KANBAN_FOLDER);
  await fs.mkdir(KANBAN_ROOT, { recursive: true });
});

afterEach(async () => {
  await fs.rm(TEST_DIR, { recursive: true, force: true });
});

describe('listAvailableAgentConfigs', () => {
  test('returns empty array when _agents/ does not exist', async () => {
    const agents = await listAvailableAgentConfigs(KANBAN_ROOT);
    expect(agents).toEqual([]);
  });

  test('parses opus.md with cli/model/prompt_style fields into AgentCliConfig', async () => {
    const agentsDir = path.join(KANBAN_ROOT, AGENTS_FOLDER);
    await fs.mkdir(agentsDir, { recursive: true });

    await fs.writeFile(
      path.join(agentsDir, 'opus.md'),
      `---
name: Opus
cli: claude
model: opus-4
subcommand: chat
unattended_flags:
  - --yes
  - --no-confirm
output_flags:
  - --format
  - json
prompt_style: flag
safety:
  max_turns: 10
  max_budget_usd: 5.0
  timeout: 300
provider: anthropic
---
# Opus Agent

Top-tier coding agent.
`,
    );

    const agents = await listAvailableAgentConfigs(KANBAN_ROOT);
    expect(agents).toHaveLength(1);
    expect(agents[0].id).toBe('opus');
    expect(agents[0].name).toBe('Opus');
    expect(agents[0].path).toBe('_agents/opus.md');
    expect(agents[0].config).toBeDefined();
    expect(agents[0].config?.cli).toBe('claude');
    expect(agents[0].config?.model).toBe('opus-4');
    expect(agents[0].config?.prompt_style).toBe('flag');
    expect(agents[0].config?.unattended_flags).toEqual(['--yes', '--no-confirm']);
    expect(agents[0].config?.output_flags).toEqual(['--format', 'json']);
  });

  test('invalid frontmatter (missing cli) handled gracefully - returns undefined config', async () => {
    const agentsDir = path.join(KANBAN_ROOT, AGENTS_FOLDER);
    await fs.mkdir(agentsDir, { recursive: true });

    await fs.writeFile(
      path.join(agentsDir, 'invalid.md'),
      `---
name: Invalid Agent
description: Missing required cli field
---
# Invalid Agent
`,
    );

    const agents = await listAvailableAgentConfigs(KANBAN_ROOT);
    expect(agents).toHaveLength(1);
    expect(agents[0].id).toBe('invalid');
    expect(agents[0].name).toBe('Invalid Agent');
    expect(agents[0].config).toBeUndefined();
  });

  test('empty _agents/ directory returns empty list', async () => {
    const agentsDir = path.join(KANBAN_ROOT, AGENTS_FOLDER);
    await fs.mkdir(agentsDir, { recursive: true });

    const agents = await listAvailableAgentConfigs(KANBAN_ROOT);
    expect(agents).toEqual([]);
  });

  test('uses filename as fallback name when frontmatter name missing', async () => {
    const agentsDir = path.join(KANBAN_ROOT, AGENTS_FOLDER);
    await fs.mkdir(agentsDir, { recursive: true });

    await fs.writeFile(
      path.join(agentsDir, 'custom-agent.md'),
      `---
cli: test-cli
model: test-model
unattended_flags: []
output_flags: []
prompt_style: stdin
---
Body content
`,
    );

    const agents = await listAvailableAgentConfigs(KANBAN_ROOT);
    expect(agents).toHaveLength(1);
    expect(agents[0].name).toBe('Custom Agent');
  });

  test('sorts agents by name', async () => {
    const agentsDir = path.join(KANBAN_ROOT, AGENTS_FOLDER);
    await fs.mkdir(agentsDir, { recursive: true });

    await fs.writeFile(
      path.join(agentsDir, 'zebra.md'),
      `---
name: Zebra Agent
cli: z
model: z-model
unattended_flags: []
output_flags: []
prompt_style: flag
---
`,
    );
    await fs.writeFile(
      path.join(agentsDir, 'alpha.md'),
      `---
name: Alpha Agent
cli: a
model: a-model
unattended_flags: []
output_flags: []
prompt_style: flag
---
`,
    );

    const agents = await listAvailableAgentConfigs(KANBAN_ROOT);
    expect(agents).toHaveLength(2);
    expect(agents[0].name).toBe('Alpha Agent');
    expect(agents[1].name).toBe('Zebra Agent');
  });
});

describe('resolveAgentConfig', () => {
  test('finds agent config by filename (id)', async () => {
    const agentsDir = path.join(KANBAN_ROOT, AGENTS_FOLDER);
    await fs.mkdir(agentsDir, { recursive: true });
    await fs.writeFile(
      path.join(agentsDir, 'coder.md'),
      `---
cli: claude
model: sonnet
unattended_flags: []
output_flags: []
prompt_style: flag
---
`,
    );

    const config = await resolveAgentConfig(KANBAN_ROOT, 'coder');
    expect(config).toBeDefined();
    expect(config?.cli).toBe('claude');
    expect(config?.model).toBe('sonnet');
  });

  test('finds agent config by frontmatter name', async () => {
    const agentsDir = path.join(KANBAN_ROOT, AGENTS_FOLDER);
    await fs.mkdir(agentsDir, { recursive: true });
    await fs.writeFile(
      path.join(agentsDir, 'coder.md'),
      `---
name: Coder
cli: claude
model: sonnet
unattended_flags: []
output_flags: []
prompt_style: flag
---
`,
    );

    const config = await resolveAgentConfig(KANBAN_ROOT, 'Coder');
    expect(config).toBeDefined();
    expect(config?.cli).toBe('claude');
  });

  test('returns undefined when agent not found', async () => {
    const config = await resolveAgentConfig(KANBAN_ROOT, 'nonexistent');
    expect(config).toBeUndefined();
  });

  test('returns undefined for agent with invalid config', async () => {
    const agentsDir = path.join(KANBAN_ROOT, AGENTS_FOLDER);
    await fs.mkdir(agentsDir, { recursive: true });
    await fs.writeFile(
      path.join(agentsDir, 'invalid.md'),
      `---
name: Invalid
description: Missing cli field
---
`,
    );

    const config = await resolveAgentConfig(KANBAN_ROOT, 'invalid');
    expect(config).toBeUndefined();
  });
});

describe('resolveAgentConfigFile', () => {
  test('returns full AgentConfigFile object', async () => {
    const agentsDir = path.join(KANBAN_ROOT, AGENTS_FOLDER);
    await fs.mkdir(agentsDir, { recursive: true });
    await fs.writeFile(
      path.join(agentsDir, 'test.md'),
      `---
name: Test Agent
cli: test-cli
model: test-model
unattended_flags: []
output_flags: []
prompt_style: stdin
---
`,
    );

    const agent = await resolveAgentConfigFile(KANBAN_ROOT, 'test');
    expect(agent).toBeDefined();
    expect(agent?.id).toBe('test');
    expect(agent?.name).toBe('Test Agent');
    expect(agent?.path).toBe('_agents/test.md');
    expect(agent?.config?.cli).toBe('test-cli');
  });
});

describe('createAgentConfigFile', () => {
  test('writes new agent config file with frontmatter', async () => {
    const relativePath = await createAgentConfigFile(KANBAN_ROOT, {
      name: 'Test Agent',
      config: {
        cli: 'test-cli',
        model: 'test-model',
        unattended_flags: ['--yes'],
        output_flags: ['--format', 'json'],
        prompt_style: 'flag',
      },
      content: '# Test Agent\n\nThis is the body.',
    });

    expect(relativePath).toBe('_agents/test-agent.md');

    const filePath = path.join(KANBAN_ROOT, relativePath);
    const content = await fs.readFile(filePath, 'utf-8');

    expect(content).toContain('name: Test Agent');
    expect(content).toContain('cli: test-cli');
    expect(content).toContain('model: test-model');
    expect(content).toContain('prompt_style: flag');
    expect(content).toContain('# Test Agent');
    expect(content).toContain('This is the body.');
  });

  test('creates _agents directory if it does not exist', async () => {
    await createAgentConfigFile(KANBAN_ROOT, {
      name: 'New Agent',
      config: {
        cli: 'new-cli',
        model: 'new-model',
        unattended_flags: [],
        output_flags: [],
        prompt_style: 'stdin',
      },
    });

    const agentsDir = path.join(KANBAN_ROOT, AGENTS_FOLDER);
    const stat = await fs.stat(agentsDir);
    expect(stat.isDirectory()).toBe(true);
  });
});

describe('updateAgentConfigFile', () => {
  test('overwrites existing agent config file', async () => {
    const agentsDir = path.join(KANBAN_ROOT, AGENTS_FOLDER);
    await fs.mkdir(agentsDir, { recursive: true });
    await fs.writeFile(
      path.join(agentsDir, 'existing.md'),
      `---
name: Old Name
cli: old-cli
model: old-model
unattended_flags: []
output_flags: []
prompt_style: flag
---
Old body
`,
    );

    await updateAgentConfigFile(KANBAN_ROOT, 'existing', {
      name: 'New Name',
      config: {
        cli: 'new-cli',
        model: 'new-model',
        unattended_flags: ['--yes'],
        output_flags: [],
        prompt_style: 'positional',
      },
      content: 'New body',
    });

    const content = await fs.readFile(path.join(agentsDir, 'existing.md'), 'utf-8');
    expect(content).toContain('name: New Name');
    expect(content).toContain('cli: new-cli');
    expect(content).toContain('model: new-model');
    expect(content).toContain('New body');
    expect(content).not.toContain('Old');
  });

  test('preserves existing content when content not provided', async () => {
    const agentsDir = path.join(KANBAN_ROOT, AGENTS_FOLDER);
    await fs.mkdir(agentsDir, { recursive: true });
    await fs.writeFile(
      path.join(agentsDir, 'preserve.md'),
      `---
name: Preserve
cli: test-cli
model: test-model
unattended_flags: []
output_flags: []
prompt_style: flag
---
Preserved body content
`,
    );

    await updateAgentConfigFile(KANBAN_ROOT, 'preserve', {
      config: {
        cli: 'updated-cli',
        model: 'updated-model',
        unattended_flags: [],
        output_flags: [],
        prompt_style: 'stdin',
      },
    });

    const content = await fs.readFile(path.join(agentsDir, 'preserve.md'), 'utf-8');
    expect(content).toContain('cli: updated-cli');
    expect(content).toContain('Preserved body content');
  });

  test('throws when agent not found', async () => {
    await expect(
      updateAgentConfigFile(KANBAN_ROOT, 'nonexistent', {
        config: {
          cli: 'test',
          model: 'test',
          unattended_flags: [],
          output_flags: [],
          prompt_style: 'flag',
        },
      }),
    ).rejects.toThrow('Agent config not found');
  });
});

describe('deleteAgentConfigFile', () => {
  test('deletes agent config file and returns true', async () => {
    const agentsDir = path.join(KANBAN_ROOT, AGENTS_FOLDER);
    await fs.mkdir(agentsDir, { recursive: true });
    await fs.writeFile(
      path.join(agentsDir, 'to-delete.md'),
      `---
cli: test
model: test
unattended_flags: []
output_flags: []
prompt_style: flag
---
`,
    );

    const result = await deleteAgentConfigFile(KANBAN_ROOT, 'to-delete');
    expect(result).toBe(true);

    await expect(fs.stat(path.join(agentsDir, 'to-delete.md'))).rejects.toThrow();
  });

  test('returns false when agent not found', async () => {
    const result = await deleteAgentConfigFile(KANBAN_ROOT, 'nonexistent');
    expect(result).toBe(false);
  });
});

describe('loadAgentConfigContent', () => {
  test('returns full file content as string', async () => {
    const agentsDir = path.join(KANBAN_ROOT, AGENTS_FOLDER);
    await fs.mkdir(agentsDir, { recursive: true });
    await fs.writeFile(
      path.join(agentsDir, 'coder.md'),
      `---
name: Coder
cli: claude
model: sonnet
unattended_flags: []
output_flags: []
prompt_style: flag
---
# Coder Agent

You write code.
`,
    );

    const content = await loadAgentConfigContent(KANBAN_ROOT, 'coder');
    expect(content).toContain('---');
    expect(content).toContain('name: Coder');
    expect(content).toContain('# Coder Agent');
    expect(content).toContain('You write code.');
  });

  test('returns empty string for null/undefined agentName', async () => {
    expect(await loadAgentConfigContent(KANBAN_ROOT, null)).toBe('');
    expect(await loadAgentConfigContent(KANBAN_ROOT, undefined)).toBe('');
  });

  test('returns empty string when agent not found', async () => {
    const content = await loadAgentConfigContent(KANBAN_ROOT, 'nonexistent');
    expect(content).toBe('');
  });
});
