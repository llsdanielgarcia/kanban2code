import { afterEach, beforeEach, expect, test, vi } from 'vitest';
import * as fs from 'fs/promises';
import * as os from 'os';
import * as path from 'path';
import { DEFAULT_CONFIG } from '../src/types/config';
import { configService } from '../src/services/config';
import * as vscode from 'vscode';

let TEST_DIR: string;
let KANBAN_ROOT: string;

beforeEach(async () => {
  TEST_DIR = path.join(os.tmpdir(), `kanban-config-test-${Date.now()}`);
  KANBAN_ROOT = path.join(TEST_DIR, '.kanban2code');
  await fs.mkdir(KANBAN_ROOT, { recursive: true });
});

afterEach(async () => {
  configService.dispose();
  await fs.rm(TEST_DIR, { recursive: true, force: true });
});

test('loads defaults when config.json is missing', async () => {
  await configService.initialize(KANBAN_ROOT);
  expect(configService.getConfig()).toEqual(DEFAULT_CONFIG);
});

test('loads config.json and merges with defaults', async () => {
  await fs.writeFile(
    path.join(KANBAN_ROOT, 'config.json'),
    JSON.stringify(
      {
        version: '1.0.0',
        preferences: { defaultAgent: 'opus', archiveAfterDays: 3 },
        tags: {
          categories: {
            priority: {
              description: 'Custom priorities',
              values: ['p0', 'p1'],
            },
          },
        },
        stages: {
          inbox: {
            description: 'Incoming',
            order: 0,
            allowedTransitions: ['plan'],
          },
        },
      },
      null,
      2
    )
  );

  await configService.initialize(KANBAN_ROOT);

  expect(configService.getDefaultAgent()).toBe('opus');
  expect(configService.getPreferences().archiveAfterDays).toBe(3);

  // Default agents remain present
  expect(configService.getAgentNames()).toContain('codex');
  expect(configService.getAgentNames()).toContain('opus');

  // Custom tag category override merged in
  expect(configService.getTagCategory('priority')?.values).toEqual(['p0', 'p1']);
  // Non-overridden categories are preserved from defaults
  expect(configService.getTagCategory('type')?.values).toEqual(DEFAULT_CONFIG.tags.categories.type.values);

  // Stage names are ordered; inbox remains first
  expect(configService.getStageNames()[0]).toBe('inbox');
  expect(configService.getAllowedTransitions('inbox')).toEqual(['plan']);
});

test('falls back to defaults when config.json is invalid JSON', async () => {
  const warningSpy = vi.spyOn(vscode.window, 'showWarningMessage');
  await fs.writeFile(path.join(KANBAN_ROOT, 'config.json'), '{ this is not json }');

  await configService.initialize(KANBAN_ROOT);

  expect(configService.getConfig()).toEqual(DEFAULT_CONFIG);
  expect(warningSpy).toHaveBeenCalled();
});

