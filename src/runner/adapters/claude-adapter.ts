import type { AgentCliConfig } from '../../types/agent';
import type {
  CliAdapter,
  CliAdapterOptions,
  CliCommandResult,
  CliResponse,
} from '../cli-adapter';

/**
 * Shape of Claude CLI's JSON output when using `--output-format json`.
 */
interface ClaudeJsonOutput {
  is_error: boolean;
  result: string;
  session_id?: string;
  total_cost_usd?: number;
  num_turns?: number;
}

/**
 * CLI adapter for the Claude CLI (`claude` command).
 *
 * Builds commands using `-p` flag for prompt input and parses
 * the single JSON object returned by `--output-format json`.
 */
export class ClaudeAdapter implements CliAdapter {
  /**
   * Build a Claude CLI command from config + prompt + options.
   *
   * Produces an argv like:
   *   claude -p "prompt" --model opus-4 --dangerously-skip-permissions
   *          --output-format json --max-turns 10 --append-system-prompt "..."
   */
  buildCommand(
    config: AgentCliConfig,
    prompt: string,
    options?: CliAdapterOptions,
  ): CliCommandResult {
    const args: string[] = [];

    // Subcommand (e.g. "chat") if specified
    if (config.subcommand) {
      args.push(config.subcommand);
    }

    // Prompt via -p flag (Claude prompt style)
    args.push('-p', prompt);

    // Model selection
    args.push('--model', config.model);

    // Unattended / auto-accept flags (e.g. --dangerously-skip-permissions)
    for (const flag of config.unattended_flags) {
      args.push(flag);
    }

    // Output format flags (always include --output-format json)
    args.push('--output-format', 'json');

    // Max turns from options override, else from safety config
    const maxTurns = options?.maxTurns ?? config.safety?.max_turns;
    if (maxTurns !== undefined) {
      args.push('--max-turns', String(maxTurns));
    }

    // System prompt
    if (options?.systemPrompt) {
      args.push('--append-system-prompt', options.systemPrompt);
    }

    // Resume session
    if (options?.sessionId) {
      args.push('--session-id', options.sessionId);
    }

    return {
      command: config.cli,
      args,
    };
  }

  /**
   * Parse Claude CLI stdout into a structured CliResponse.
   *
   * Expects a single JSON object with `is_error`, `result`,
   * `session_id`, `total_cost_usd`, and `num_turns` fields.
   *
   * Handles non-JSON output gracefully (e.g. crash / segfault).
   */
  parseResponse(stdout: string, exitCode: number): CliResponse {
    const trimmed = stdout.trim();

    // Non-zero exit with no output → crash scenario
    if (!trimmed) {
      return {
        success: false,
        result: '',
        error: `CLI exited with code ${exitCode} and no output`,
      };
    }

    let parsed: ClaudeJsonOutput;
    try {
      parsed = JSON.parse(trimmed) as ClaudeJsonOutput;
    } catch {
      // Non-JSON output — crash, timeout, or unexpected stderr leak
      return {
        success: false,
        result: trimmed,
        error: `Failed to parse CLI output as JSON: ${trimmed.slice(0, 200)}`,
      };
    }

    // Claude signals errors via is_error field
    if (parsed.is_error) {
      return {
        success: false,
        result: parsed.result,
        error: parsed.result,
        sessionId: parsed.session_id,
        cost: parsed.total_cost_usd,
        turns: parsed.num_turns,
      };
    }

    return {
      success: true,
      result: parsed.result,
      sessionId: parsed.session_id,
      cost: parsed.total_cost_usd,
      turns: parsed.num_turns,
    };
  }
}
