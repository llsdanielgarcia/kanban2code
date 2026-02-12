import { describe, expect, test } from 'vitest';
import { CodexAdapter } from '../src/runner/adapters/codex-adapter';
import { KimiAdapter } from '../src/runner/adapters/kimi-adapter';
import { KiloAdapter } from '../src/runner/adapters/kilo-adapter';
import { getAdapterForCli } from '../src/runner/adapter-factory';
import type { ProviderConfig } from '../src/types/provider';

function makeCodexConfig(overrides?: Partial<ProviderConfig>): ProviderConfig {
  return {
    cli: 'codex',
    subcommand: 'exec',
    model: 'gpt-5.3-codex',
    unattended_flags: ['--yolo'],
    output_flags: ['--json'],
    prompt_style: 'stdin',
    provider: 'openai',
    ...overrides,
  };
}

function makeKimiConfig(overrides?: Partial<ProviderConfig>): ProviderConfig {
  return {
    cli: 'kimi',
    model: 'kimi-k2-thinking-turbo',
    unattended_flags: ['--print'],
    output_flags: ['--quiet'],
    prompt_style: 'flag',
    provider: 'moonshot',
    ...overrides,
  };
}

function makeKiloConfig(overrides?: Partial<ProviderConfig>): ProviderConfig {
  return {
    cli: 'kilo',
    subcommand: 'run',
    model: 'openrouter/z-ai/glm-4.7',
    unattended_flags: ['--auto'],
    output_flags: ['--format', 'json'],
    prompt_style: 'positional',
    provider: 'openrouter',
    ...overrides,
  };
}

describe('Other CLI adapters', () => {
  test('Codex adapter pipes prompt via stdin using - sentinel', () => {
    const adapter = new CodexAdapter();
    const config = makeCodexConfig();

    const result = adapter.buildCommand(config, 'Implement task 4.2');

    expect(result.command).toBe('codex');
    expect(result.args[0]).toBe('exec');
    expect(result.args).toContain('--yolo');
    expect(result.args).toContain('--json');
    expect(result.args).toContain('--model');
    expect(result.args).toContain('gpt-5.3-codex');
    expect(result.args[result.args.length - 1]).toBe('-');
    expect(result.stdin).toBe('Implement task 4.2');
  });

  test('KIMI adapter uses -p flag style correctly', () => {
    const adapter = new KimiAdapter();
    const config = makeKimiConfig();

    const result = adapter.buildCommand(config, 'Review this diff');

    expect(result.command).toBe('kimi');
    expect(result.args).toContain('--print');
    expect(result.args).toContain('--quiet');
    expect(result.args).toContain('--model');
    expect(result.args).toContain('kimi-k2-thinking-turbo');

    const promptFlagIndex = result.args.indexOf('-p');
    expect(promptFlagIndex).toBeGreaterThan(-1);
    expect(result.args[promptFlagIndex + 1]).toBe('Review this diff');
    expect(result.stdin).toBeUndefined();
  });

  test('Kilo adapter uses --format json and combined -m provider/model', () => {
    const adapter = new KiloAdapter();
    const config = makeKiloConfig({ unattended_flags: ['--auto', '--yolo'], output_flags: ['--json'] });

    const result = adapter.buildCommand(config, 'Ship it');

    expect(result.command).toBe('kilo');
    expect(result.args[0]).toBe('run');
    expect(result.args).toContain('--auto');
    expect(result.args).not.toContain('--yolo');
    expect(result.args).not.toContain('--json');

    const formatIndex = result.args.indexOf('--format');
    expect(formatIndex).toBeGreaterThan(-1);
    expect(result.args[formatIndex + 1]).toBe('json');

    const modelIndex = result.args.indexOf('-m');
    expect(modelIndex).toBeGreaterThan(-1);
    expect(result.args[modelIndex + 1]).toBe('openrouter/z-ai/glm-4.7');

    expect(result.args[result.args.length - 1]).toBe('Ship it');
  });

  test('JSONL parser extracts final message from multi-line event stream', () => {
    const adapter = new CodexAdapter();
    const stdout = [
      JSON.stringify({ type: 'event.start', message: 'thinking...' }),
      JSON.stringify({ type: 'event.delta', delta: 'partial draft' }),
      JSON.stringify({ type: 'event.final', result: 'Final completed answer.' }),
    ].join('\n');

    const parsed = adapter.parseResponse(stdout, 0);

    expect(parsed.success).toBe(true);
    expect(parsed.result).toBe('Final completed answer.');
    expect(parsed.error).toBeUndefined();
  });

  test('Factory returns correct adapter for each CLI name', () => {
    expect(getAdapterForCli('claude').constructor.name).toBe('ClaudeAdapter');
    expect(getAdapterForCli('codex')).toBeInstanceOf(CodexAdapter);
    expect(getAdapterForCli('kimi')).toBeInstanceOf(KimiAdapter);
    expect(getAdapterForCli('kilo')).toBeInstanceOf(KiloAdapter);

    expect(() => getAdapterForCli('unknown-cli')).toThrow('Unsupported CLI adapter');
  });
});
