import type { ProviderConfig } from '../../types/provider';
import type {
  CliAdapter,
  CliAdapterOptions,
  CliCommandResult,
  CliResponse,
} from '../cli-adapter';

/**
 * CLI adapter for KIMI (`kimi` command).
 *
 * KIMI one-shot mode is flag-based (`-p`) and returns plain text when
 * used with `--print --quiet`.
 */
export class KimiAdapter implements CliAdapter {
  buildCommand(
    config: ProviderConfig,
    prompt: string,
    options?: CliAdapterOptions,
  ): CliCommandResult {
    const args: string[] = [];

    if (config.subcommand) {
      args.push(config.subcommand);
    }

    for (const flag of config.unattended_flags) {
      args.push(flag);
    }

    args.push('--model', config.model);

    // KIMI prompt style for runner one-shot calls.
    args.push('-p', prompt);

    for (const flag of config.output_flags) {
      args.push(flag);
    }

    const maxTurns = options?.maxTurns ?? config.safety?.max_turns;
    if (maxTurns !== undefined) {
      args.push('--max-steps-per-turn', String(maxTurns));
    }

    return {
      command: config.cli,
      args,
    };
  }

  parseResponse(stdout: string, exitCode: number): CliResponse {
    const trimmed = stdout.trim();

    if (!trimmed) {
      return {
        success: false,
        result: '',
        error: `CLI exited with code ${exitCode} and no output`,
      };
    }

    return {
      success: exitCode === 0,
      result: trimmed,
      error: exitCode === 0 ? undefined : `CLI exited with code ${exitCode}: ${trimmed.slice(0, 200)}`,
    };
  }
}
