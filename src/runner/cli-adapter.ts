import type { ProviderConfig } from '../types/provider';

/**
 * Structured response from a CLI adapter after parsing stdout.
 */
export interface CliResponse {
  /** Whether the CLI invocation succeeded */
  success: boolean;
  /** The main result text / content from the CLI */
  result: string;
  /** Error message if the invocation failed */
  error?: string;
  /** Session identifier for resumable sessions */
  sessionId?: string;
  /** Total cost in USD for the run */
  cost?: number;
  /** Number of agentic turns taken */
  turns?: number;
}

/**
 * The command descriptor produced by `buildCommand`.
 * Contains everything needed to spawn the CLI process.
 */
export interface CliCommandResult {
  /** The CLI executable (e.g. "claude", "codex") */
  command: string;
  /** Argument vector to pass to the process */
  args: string[];
  /** Optional string to pipe into stdin */
  stdin?: string;
}

/**
 * Optional overrides passed to `buildCommand`.
 */
export interface CliAdapterOptions {
  /** System prompt to append via CLI flag */
  systemPrompt?: string;
  /** Override the max turns safety limit */
  maxTurns?: number;
  /** Resume a previous session by ID */
  sessionId?: string;
}

/**
 * Adapter interface that abstracts differences between LLM CLI tools.
 *
 * Each provider (Claude, Codex, KIMI, Kilo) implements this interface
 * so the runner can build shell commands and parse responses uniformly.
 */
export interface CliAdapter {
  /**
   * Build the shell command and argument vector for a given config + prompt.
   *
   * @param config  - Agent CLI configuration (cli, model, flags, etc.)
   * @param prompt  - The prompt text to send to the CLI
   * @param options - Optional overrides (system prompt, max turns, session)
   * @returns A command descriptor ready for process spawning
   */
  buildCommand(
    config: ProviderConfig,
    prompt: string,
    options?: CliAdapterOptions,
  ): CliCommandResult;

  /**
   * Parse the raw stdout and exit code from a CLI invocation
   * into a structured `CliResponse`.
   *
   * @param stdout   - Raw standard output from the process
   * @param exitCode - Process exit code (0 = success)
   * @returns Parsed CLI response
   */
  parseResponse(stdout: string, exitCode: number): CliResponse;
}
