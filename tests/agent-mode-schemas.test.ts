import { expect, test, describe } from 'vitest';
import { AgentCliConfigSchema, PromptStyleSchema } from '../src/types/agent';
import { ModeConfigSchema } from '../src/types/mode';

describe('AgentCliConfig Zod Schema', () => {
  test('validates a valid opus agent config object', () => {
    const validConfig = {
      cli: 'claude',
      model: 'opus-4',
      subcommand: 'chat',
      unattended_flags: ['--yes', '--no-confirm'],
      output_flags: ['--format', 'json'],
      prompt_style: 'flag' as const,
      safety: {
        max_turns: 10,
        max_budget_usd: 5.0,
        timeout: 300,
      },
      provider: 'anthropic',
      config_overrides: {
        temperature: 0.7,
      },
    };

    const result = AgentCliConfigSchema.safeParse(validConfig);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.cli).toBe('claude');
      expect(result.data.model).toBe('opus-4');
      expect(result.data.prompt_style).toBe('flag');
    }
  });

  test('validates config without optional fields', () => {
    const minimalConfig = {
      cli: 'claude',
      model: 'opus-4',
      unattended_flags: [],
      output_flags: [],
      prompt_style: 'stdin' as const,
    };

    const result = AgentCliConfigSchema.safeParse(minimalConfig);
    expect(result.success).toBe(true);
  });

  test('rejects missing required field: cli', () => {
    const invalidConfig = {
      model: 'opus-4',
      unattended_flags: [],
      output_flags: [],
      prompt_style: 'flag' as const,
    };

    const result = AgentCliConfigSchema.safeParse(invalidConfig);
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues.some(issue => issue.path.includes('cli'))).toBe(true);
    }
  });

  test('rejects missing required field: model', () => {
    const invalidConfig = {
      cli: 'claude',
      unattended_flags: [],
      output_flags: [],
      prompt_style: 'positional' as const,
    };

    const result = AgentCliConfigSchema.safeParse(invalidConfig);
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues.some(issue => issue.path.includes('model'))).toBe(true);
    }
  });

  test('validates all prompt_style variants', () => {
    const styles = ['flag', 'positional', 'stdin'] as const;

    styles.forEach(style => {
      const result = PromptStyleSchema.safeParse(style);
      expect(result.success).toBe(true);
    });
  });

  test('rejects invalid prompt_style', () => {
    const result = PromptStyleSchema.safeParse('invalid');
    expect(result.success).toBe(false);
  });

  test('validates safety limits with positive integers', () => {
    const configWithSafety = {
      cli: 'claude',
      model: 'opus-4',
      unattended_flags: [],
      output_flags: [],
      prompt_style: 'flag' as const,
      safety: {
        max_turns: 5,
        max_budget_usd: 10.50,
        timeout: 600,
      },
    };

    const result = AgentCliConfigSchema.safeParse(configWithSafety);
    expect(result.success).toBe(true);
  });
});

describe('ModeConfig Zod Schema', () => {
  test('validates with all fields including optional stage', () => {
    const validMode = {
      id: 'coder',
      name: 'Coder',
      description: 'Implementation agent',
      stage: 'code',
      path: '/path/to/coder.md',
      content: 'Agent instructions here...',
    };

    const result = ModeConfigSchema.safeParse(validMode);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.id).toBe('coder');
      expect(result.data.stage).toBe('code');
    }
  });

  test('validates without optional stage field', () => {
    const modeWithoutStage = {
      id: 'planner',
      name: 'Planner',
      description: 'Planning agent',
      path: '/path/to/planner.md',
    };

    const result = ModeConfigSchema.safeParse(modeWithoutStage);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.stage).toBeUndefined();
    }
  });

  test('validates without optional content field', () => {
    const modeWithoutContent = {
      id: 'auditor',
      name: 'Auditor',
      description: 'Code review agent',
      stage: 'audit',
      path: '/path/to/auditor.md',
    };

    const result = ModeConfigSchema.safeParse(modeWithoutContent);
    expect(result.success).toBe(true);
  });

  test('rejects missing required field: id', () => {
    const invalidMode = {
      name: 'Coder',
      description: 'Implementation agent',
      path: '/path/to/coder.md',
    };

    const result = ModeConfigSchema.safeParse(invalidMode);
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues.some(issue => issue.path.includes('id'))).toBe(true);
    }
  });

  test('rejects missing required field: path', () => {
    const invalidMode = {
      id: 'coder',
      name: 'Coder',
      description: 'Implementation agent',
    };

    const result = ModeConfigSchema.safeParse(invalidMode);
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues.some(issue => issue.path.includes('path'))).toBe(true);
    }
  });
});
