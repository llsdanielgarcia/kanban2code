import { describe, expect, test } from 'vitest';
import { ClaudeAdapter } from '../src/runner/adapters/claude-adapter';
import type { ProviderConfig } from '../src/types/provider';
import type { CliResponse } from '../src/runner/cli-adapter';

/**
 * Builds a realistic opus-style AgentCliConfig for test use.
 */
function makeOpusConfig(overrides?: Partial<ProviderConfig>): ProviderConfig {
  return {
    cli: 'claude',
    model: 'opus-4',
    subcommand: undefined,
    unattended_flags: ['--dangerously-skip-permissions'],
    output_flags: ['--output-format', 'json'],
    prompt_style: 'flag',
    safety: {
      max_turns: 10,
      max_budget_usd: 5.0,
      timeout: 300,
    },
    provider: 'anthropic',
    ...overrides,
  };
}

describe('ClaudeAdapter', () => {
  const adapter = new ClaudeAdapter();

  describe('buildCommand', () => {
    test('produces correct argv array for opus config', () => {
      const config = makeOpusConfig();
      const result = adapter.buildCommand(config, 'Implement the feature');

      expect(result.command).toBe('claude');
      expect(result.args).toContain('-p');
      expect(result.args).toContain('Implement the feature');
      expect(result.args).toContain('--model');
      expect(result.args).toContain('opus-4');
      expect(result.args).toContain('--dangerously-skip-permissions');
      expect(result.args).toContain('--output-format');
      expect(result.args).toContain('json');
      expect(result.args).toContain('--max-turns');
      expect(result.args).toContain('10');

      // Verify -p comes before the prompt text
      const pIdx = result.args.indexOf('-p');
      expect(result.args[pIdx + 1]).toBe('Implement the feature');

      // Verify --model comes before the model name
      const modelIdx = result.args.indexOf('--model');
      expect(result.args[modelIdx + 1]).toBe('opus-4');
    });

    test('includes subcommand when specified', () => {
      const config = makeOpusConfig({ subcommand: 'chat' });
      const result = adapter.buildCommand(config, 'Hello');

      // Subcommand should be first
      expect(result.args[0]).toBe('chat');
    });

    test('includes --append-system-prompt flag when system prompt provided', () => {
      const config = makeOpusConfig();
      const result = adapter.buildCommand(config, 'Do the task', {
        systemPrompt: 'You are a careful coder.',
      });

      expect(result.args).toContain('--append-system-prompt');
      const idx = result.args.indexOf('--append-system-prompt');
      expect(result.args[idx + 1]).toBe('You are a careful coder.');
    });

    test('does not include --append-system-prompt when no system prompt', () => {
      const config = makeOpusConfig();
      const result = adapter.buildCommand(config, 'Do the task');

      expect(result.args).not.toContain('--append-system-prompt');
    });

    test('uses options.maxTurns over config.safety.max_turns', () => {
      const config = makeOpusConfig();
      const result = adapter.buildCommand(config, 'Task', {
        maxTurns: 25,
      });

      const idx = result.args.indexOf('--max-turns');
      expect(result.args[idx + 1]).toBe('25');
    });

    test('omits --max-turns when neither options nor safety specify it', () => {
      const config = makeOpusConfig({ safety: undefined });
      const result = adapter.buildCommand(config, 'Task');

      expect(result.args).not.toContain('--max-turns');
    });

    test('includes --session-id when sessionId option provided', () => {
      const config = makeOpusConfig();
      const result = adapter.buildCommand(config, 'Continue', {
        sessionId: 'sess-abc-123',
      });

      expect(result.args).toContain('--session-id');
      const idx = result.args.indexOf('--session-id');
      expect(result.args[idx + 1]).toBe('sess-abc-123');
    });

    test('does not set stdin (Claude uses -p flag, not stdin)', () => {
      const config = makeOpusConfig();
      const result = adapter.buildCommand(config, 'Prompt');

      expect(result.stdin).toBeUndefined();
    });
  });

  describe('parseResponse', () => {
    test('extracts result from valid JSON', () => {
      const stdout = JSON.stringify({
        is_error: false,
        result: 'Task completed successfully. Created 3 files.',
        session_id: 'sess-xyz-789',
        total_cost_usd: 0.42,
        num_turns: 5,
      });

      const response: CliResponse = adapter.parseResponse(stdout, 0);

      expect(response.success).toBe(true);
      expect(response.result).toBe('Task completed successfully. Created 3 files.');
      expect(response.sessionId).toBe('sess-xyz-789');
      expect(response.cost).toBe(0.42);
      expect(response.turns).toBe(5);
      expect(response.error).toBeUndefined();
    });

    test('handles is_error: true correctly', () => {
      const stdout = JSON.stringify({
        is_error: true,
        result: 'Rate limit exceeded. Try again in 60 seconds.',
        session_id: 'sess-err-456',
        total_cost_usd: 0.01,
        num_turns: 1,
      });

      const response: CliResponse = adapter.parseResponse(stdout, 1);

      expect(response.success).toBe(false);
      expect(response.result).toBe('Rate limit exceeded. Try again in 60 seconds.');
      expect(response.error).toBe('Rate limit exceeded. Try again in 60 seconds.');
      expect(response.sessionId).toBe('sess-err-456');
      expect(response.cost).toBe(0.01);
      expect(response.turns).toBe(1);
    });

    test('handles non-JSON output gracefully (crash scenario)', () => {
      const stdout = 'Segmentation fault (core dumped)';

      const response: CliResponse = adapter.parseResponse(stdout, 139);

      expect(response.success).toBe(false);
      expect(response.result).toBe('Segmentation fault (core dumped)');
      expect(response.error).toContain('Failed to parse CLI output as JSON');
      expect(response.error).toContain('Segmentation fault');
    });

    test('handles empty output with non-zero exit code', () => {
      const response: CliResponse = adapter.parseResponse('', 1);

      expect(response.success).toBe(false);
      expect(response.result).toBe('');
      expect(response.error).toContain('CLI exited with code 1 and no output');
    });

    test('handles JSON with missing optional fields', () => {
      const stdout = JSON.stringify({
        is_error: false,
        result: 'Done.',
      });

      const response: CliResponse = adapter.parseResponse(stdout, 0);

      expect(response.success).toBe(true);
      expect(response.result).toBe('Done.');
      expect(response.sessionId).toBeUndefined();
      expect(response.cost).toBeUndefined();
      expect(response.turns).toBeUndefined();
    });

    test('handles whitespace-padded JSON output', () => {
      const stdout = `
        ${JSON.stringify({
          is_error: false,
          result: 'Completed.',
          session_id: 'sess-pad',
          total_cost_usd: 0.1,
          num_turns: 2,
        })}
      `;

      const response: CliResponse = adapter.parseResponse(stdout, 0);

      expect(response.success).toBe(true);
      expect(response.result).toBe('Completed.');
    });
  });
});
