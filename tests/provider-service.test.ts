import { beforeEach, afterEach, describe, expect, test } from 'vitest';
import * as fs from 'fs/promises';
import * as path from 'path';
import * as os from 'os';
import {
  listAvailableProviders,
  resolveProviderConfig,
  resolveProviderConfigFile,
  createProviderConfigFile,
  updateProviderConfigFile,
  deleteProviderConfigFile,
  loadProviderConfigContent,
  type ProviderConfigFile,
} from '../src/services/provider-service';
import { KANBAN_FOLDER, PROVIDERS_FOLDER } from '../src/core/constants';

let TEST_DIR: string;
let KANBAN_ROOT: string;

beforeEach(async () => {
  TEST_DIR = path.join(os.tmpdir(), 'kanban-provider-' + Date.now());
  KANBAN_ROOT = path.join(TEST_DIR, KANBAN_FOLDER);
  await fs.mkdir(KANBAN_ROOT, { recursive: true });
});

afterEach(async () => {
  await fs.rm(TEST_DIR, { recursive: true, force: true });
});

describe('listAvailableProviders', () => {
  test('returns empty array when _providers/ does not exist', async () => {
    const providers = await listAvailableProviders(KANBAN_ROOT);
    expect(providers).toEqual([]);
  });

  test('parses opus.md with cli/model/prompt_style fields into ProviderConfig', async () => {
    const providersDir = path.join(KANBAN_ROOT, PROVIDERS_FOLDER);
    await fs.mkdir(providersDir, { recursive: true });

    await fs.writeFile(
      path.join(providersDir, 'opus.md'),
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
# Opus Provider

Top-tier coding provider.
`,
    );

    const providers = await listAvailableProviders(KANBAN_ROOT);
    expect(providers).toHaveLength(1);
    expect(providers[0].id).toBe('opus');
    expect(providers[0].name).toBe('Opus');
    expect(providers[0].path).toBe('_providers/opus.md');
    expect(providers[0].config).toBeDefined();
    expect(providers[0].config?.cli).toBe('claude');
    expect(providers[0].config?.model).toBe('opus-4');
    expect(providers[0].config?.prompt_style).toBe('flag');
    expect(providers[0].config?.unattended_flags).toEqual(['--yes', '--no-confirm']);
    expect(providers[0].config?.output_flags).toEqual(['--format', 'json']);
  });

  test('invalid frontmatter (missing cli) handled gracefully - returns undefined config', async () => {
    const providersDir = path.join(KANBAN_ROOT, PROVIDERS_FOLDER);
    await fs.mkdir(providersDir, { recursive: true });

    await fs.writeFile(
      path.join(providersDir, 'invalid.md'),
      `---
name: Invalid Provider
description: Missing required cli field
---
# Invalid Provider
`,
    );

    const providers = await listAvailableProviders(KANBAN_ROOT);
    expect(providers).toHaveLength(1);
    expect(providers[0].id).toBe('invalid');
    expect(providers[0].name).toBe('Invalid Provider');
    expect(providers[0].config).toBeUndefined();
  });

  test('empty _providers/ directory returns empty list', async () => {
    const providersDir = path.join(KANBAN_ROOT, PROVIDERS_FOLDER);
    await fs.mkdir(providersDir, { recursive: true });

    const providers = await listAvailableProviders(KANBAN_ROOT);
    expect(providers).toEqual([]);
  });

  test('uses filename as fallback name when frontmatter name missing', async () => {
    const providersDir = path.join(KANBAN_ROOT, PROVIDERS_FOLDER);
    await fs.mkdir(providersDir, { recursive: true });

    await fs.writeFile(
      path.join(providersDir, 'custom-provider.md'),
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

    const providers = await listAvailableProviders(KANBAN_ROOT);
    expect(providers).toHaveLength(1);
    expect(providers[0].name).toBe('Custom Provider');
  });

  test('sorts providers by name', async () => {
    const providersDir = path.join(KANBAN_ROOT, PROVIDERS_FOLDER);
    await fs.mkdir(providersDir, { recursive: true });

    await fs.writeFile(
      path.join(providersDir, 'zebra.md'),
      `---
name: Zebra Provider
cli: z
model: z-model
unattended_flags: []
output_flags: []
prompt_style: flag
---
`,
    );
    await fs.writeFile(
      path.join(providersDir, 'alpha.md'),
      `---
name: Alpha Provider
cli: a
model: a-model
unattended_flags: []
output_flags: []
prompt_style: flag
---
`,
    );

    const providers = await listAvailableProviders(KANBAN_ROOT);
    expect(providers).toHaveLength(2);
    expect(providers[0].name).toBe('Alpha Provider');
    expect(providers[1].name).toBe('Zebra Provider');
  });
});

describe('resolveProviderConfig', () => {
  test('finds provider config by filename (id)', async () => {
    const providersDir = path.join(KANBAN_ROOT, PROVIDERS_FOLDER);
    await fs.mkdir(providersDir, { recursive: true });
    await fs.writeFile(
      path.join(providersDir, 'coder.md'),
      `---
cli: claude
model: sonnet
unattended_flags: []
output_flags: []
prompt_style: flag
---
`,
    );

    const config = await resolveProviderConfig(KANBAN_ROOT, 'coder');
    expect(config).toBeDefined();
    expect(config?.cli).toBe('claude');
    expect(config?.model).toBe('sonnet');
  });

  test('finds provider config by frontmatter name', async () => {
    const providersDir = path.join(KANBAN_ROOT, PROVIDERS_FOLDER);
    await fs.mkdir(providersDir, { recursive: true });
    await fs.writeFile(
      path.join(providersDir, 'coder.md'),
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

    const config = await resolveProviderConfig(KANBAN_ROOT, 'Coder');
    expect(config).toBeDefined();
    expect(config?.cli).toBe('claude');
  });

  test('returns undefined when provider not found', async () => {
    const config = await resolveProviderConfig(KANBAN_ROOT, 'nonexistent');
    expect(config).toBeUndefined();
  });

  test('returns undefined for provider with invalid config', async () => {
    const providersDir = path.join(KANBAN_ROOT, PROVIDERS_FOLDER);
    await fs.mkdir(providersDir, { recursive: true });
    await fs.writeFile(
      path.join(providersDir, 'invalid.md'),
      `---
name: Invalid
description: Missing cli field
---
`,
    );

    const config = await resolveProviderConfig(KANBAN_ROOT, 'invalid');
    expect(config).toBeUndefined();
  });
});

describe('resolveProviderConfigFile', () => {
  test('returns full ProviderConfigFile object', async () => {
    const providersDir = path.join(KANBAN_ROOT, PROVIDERS_FOLDER);
    await fs.mkdir(providersDir, { recursive: true });
    await fs.writeFile(
      path.join(providersDir, 'test.md'),
      `---
name: Test Provider
cli: test-cli
model: test-model
unattended_flags: []
output_flags: []
prompt_style: stdin
---
`,
    );

    const provider = await resolveProviderConfigFile(KANBAN_ROOT, 'test');
    expect(provider).toBeDefined();
    expect(provider?.id).toBe('test');
    expect(provider?.name).toBe('Test Provider');
    expect(provider?.path).toBe('_providers/test.md');
    expect(provider?.config?.cli).toBe('test-cli');
  });
});

describe('createProviderConfigFile', () => {
  test('writes new provider config file with frontmatter', async () => {
    const relativePath = await createProviderConfigFile(KANBAN_ROOT, {
      name: 'Test Provider',
      config: {
        cli: 'test-cli',
        model: 'test-model',
        unattended_flags: ['--yes'],
        output_flags: ['--format', 'json'],
        prompt_style: 'flag',
      },
      content: '# Test Provider\n\nThis is the body.',
    });

    expect(relativePath).toBe('_providers/test-provider.md');

    const filePath = path.join(KANBAN_ROOT, relativePath);
    const content = await fs.readFile(filePath, 'utf-8');

    expect(content).toContain('name: Test Provider');
    expect(content).toContain('cli: test-cli');
    expect(content).toContain('model: test-model');
    expect(content).toContain('prompt_style: flag');
    expect(content).toContain('# Test Provider');
    expect(content).toContain('This is the body.');
  });

  test('creates _providers directory if it does not exist', async () => {
    await createProviderConfigFile(KANBAN_ROOT, {
      name: 'New Provider',
      config: {
        cli: 'new-cli',
        model: 'new-model',
        unattended_flags: [],
        output_flags: [],
        prompt_style: 'stdin',
      },
    });

    const providersDir = path.join(KANBAN_ROOT, PROVIDERS_FOLDER);
    const stat = await fs.stat(providersDir);
    expect(stat.isDirectory()).toBe(true);
  });
});

describe('updateProviderConfigFile', () => {
  test('overwrites existing provider config file', async () => {
    const providersDir = path.join(KANBAN_ROOT, PROVIDERS_FOLDER);
    await fs.mkdir(providersDir, { recursive: true });
    await fs.writeFile(
      path.join(providersDir, 'existing.md'),
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

    await updateProviderConfigFile(KANBAN_ROOT, 'existing', {
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

    const content = await fs.readFile(path.join(providersDir, 'existing.md'), 'utf-8');
    expect(content).toContain('name: New Name');
    expect(content).toContain('cli: new-cli');
    expect(content).toContain('model: new-model');
    expect(content).toContain('New body');
    expect(content).not.toContain('Old');
  });

  test('preserves existing content when content not provided', async () => {
    const providersDir = path.join(KANBAN_ROOT, PROVIDERS_FOLDER);
    await fs.mkdir(providersDir, { recursive: true });
    await fs.writeFile(
      path.join(providersDir, 'preserve.md'),
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

    await updateProviderConfigFile(KANBAN_ROOT, 'preserve', {
      config: {
        cli: 'updated-cli',
        model: 'updated-model',
        unattended_flags: [],
        output_flags: [],
        prompt_style: 'stdin',
      },
    });

    const content = await fs.readFile(path.join(providersDir, 'preserve.md'), 'utf-8');
    expect(content).toContain('cli: updated-cli');
    expect(content).toContain('Preserved body content');
  });

  test('throws when provider not found', async () => {
    await expect(
      updateProviderConfigFile(KANBAN_ROOT, 'nonexistent', {
        config: {
          cli: 'test',
          model: 'test',
          unattended_flags: [],
          output_flags: [],
          prompt_style: 'flag',
        },
      }),
    ).rejects.toThrow('Provider config not found');
  });
});

describe('deleteProviderConfigFile', () => {
  test('deletes provider config file and returns true', async () => {
    const providersDir = path.join(KANBAN_ROOT, PROVIDERS_FOLDER);
    await fs.mkdir(providersDir, { recursive: true });
    await fs.writeFile(
      path.join(providersDir, 'to-delete.md'),
      `---
cli: test
model: test
unattended_flags: []
output_flags: []
prompt_style: flag
---
`,
    );

    const result = await deleteProviderConfigFile(KANBAN_ROOT, 'to-delete');
    expect(result).toBe(true);

    await expect(fs.stat(path.join(providersDir, 'to-delete.md'))).rejects.toThrow();
  });

  test('returns false when provider not found', async () => {
    const result = await deleteProviderConfigFile(KANBAN_ROOT, 'nonexistent');
    expect(result).toBe(false);
  });
});

describe('loadProviderConfigContent', () => {
  test('returns full file content as string', async () => {
    const providersDir = path.join(KANBAN_ROOT, PROVIDERS_FOLDER);
    await fs.mkdir(providersDir, { recursive: true });
    await fs.writeFile(
      path.join(providersDir, 'coder.md'),
      `---
name: Coder
cli: claude
model: sonnet
unattended_flags: []
output_flags: []
prompt_style: flag
---
# Coder Provider

You write code.
`,
    );

    const content = await loadProviderConfigContent(KANBAN_ROOT, 'coder');
    expect(content).toContain('---');
    expect(content).toContain('name: Coder');
    expect(content).toContain('# Coder Provider');
    expect(content).toContain('You write code.');
  });

  test('returns empty string for null/undefined providerName', async () => {
    expect(await loadProviderConfigContent(KANBAN_ROOT, null)).toBe('');
    expect(await loadProviderConfigContent(KANBAN_ROOT, undefined)).toBe('');
  });

  test('returns empty string when provider not found', async () => {
    const content = await loadProviderConfigContent(KANBAN_ROOT, 'nonexistent');
    expect(content).toBe('');
  });
});
