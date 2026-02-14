import type { ProviderConfig } from '../../types/provider';
import type {
  CliAdapter,
  CliAdapterOptions,
  CliCommandResult,
  CliResponse,
} from '../cli-adapter';

interface JsonlEvent {
  is_error?: boolean;
  error?: unknown;
  message?: unknown;
  result?: unknown;
  output_text?: unknown;
  text?: unknown;
  content?: unknown;
  final?: unknown;
  delta?: unknown;
  session_id?: unknown;
  sessionId?: unknown;
  total_cost_usd?: unknown;
  num_turns?: unknown;
  type?: unknown;
}

function extractText(value: unknown): string | undefined {
  if (typeof value === 'string') {
    const trimmed = value.trim();
    return trimmed ? trimmed : undefined;
  }

  if (Array.isArray(value)) {
    const parts = value
      .map(item => extractText(item))
      .filter((item): item is string => Boolean(item));
    if (parts.length > 0) {
      return parts.join('\n').trim();
    }
    return undefined;
  }

  if (!value || typeof value !== 'object') {
    return undefined;
  }

  const obj = value as Record<string, unknown>;

  const preferredKeys = ['result', 'output_text', 'text', 'content', 'message', 'final', 'delta'];
  for (const key of preferredKeys) {
    const nested = extractText(obj[key]);
    if (nested) {
      return nested;
    }
  }

  return undefined;
}

/**
 * CLI adapter for Kilo (`kilo` command).
 *
 * Kilo uses positional prompts, `--auto`, `--format json`, and combined
 * model flag style `-m provider/model`.
 */
export class KiloAdapter implements CliAdapter {
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
      if (flag !== '--yolo') {
        args.push(flag);
      }
    }

    // Kilo expects --format json (not --json).
    args.push('--format', 'json');

    // Kilo model syntax is a combined provider/model via -m.
    args.push('-m', config.model);

    // Kilo does not support --append-system-prompt. Prepend system prompt to main prompt.
    let finalPrompt = prompt;
    if (options?.systemPrompt) {
      finalPrompt = `${options.systemPrompt}\n\n${prompt}`;
    }

    // Positional prompt text.
    args.push(finalPrompt);

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

    const lines = trimmed.split(/\r?\n/).map(line => line.trim()).filter(Boolean);

    let lastText: string | undefined;
    let lastError: string | undefined;
    let sessionId: string | undefined;
    let cost: number | undefined;
    let turns: number | undefined;
    let parsedAny = false;

    for (const line of lines) {
      try {
        const event = JSON.parse(line) as JsonlEvent;
        parsedAny = true;

        const text = extractText(event);
        if (text) {
          lastText = text;
        }

        if (event.is_error === true) {
          lastError = extractText(event.error) ?? extractText(event.message) ?? 'Kilo reported an error';
        }

        if (typeof event.error === 'string' && event.error.trim()) {
          lastError = event.error.trim();
        }

        if (typeof event.message === 'string' && String(event.type).toLowerCase() === 'error') {
          lastError = event.message.trim();
        }

        if (typeof event.session_id === 'string') {
          sessionId = event.session_id;
        } else if (typeof event.sessionId === 'string') {
          sessionId = event.sessionId;
        }

        if (typeof event.total_cost_usd === 'number') {
          cost = event.total_cost_usd;
        }

        if (typeof event.num_turns === 'number') {
          turns = event.num_turns;
        }
      } catch {
        // Ignore non-JSON lines in streamed output.
      }
    }

    if (!parsedAny) {
      return {
        success: exitCode === 0,
        result: trimmed,
        error: exitCode === 0 ? undefined : `CLI exited with code ${exitCode}: ${trimmed.slice(0, 200)}`,
      };
    }

    const result = lastText ?? '';
    const success = exitCode === 0 && !lastError;

    return {
      success,
      result,
      error: success ? undefined : (lastError ?? `CLI exited with code ${exitCode}`),
      sessionId,
      cost,
      turns,
    };
  }
}
