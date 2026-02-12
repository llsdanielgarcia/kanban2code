import { z } from 'zod';

/**
 * Prompt style determines how the prompt is passed to the CLI
 */
export const PromptStyleSchema = z.enum(['flag', 'positional', 'stdin']);
export type PromptStyle = z.infer<typeof PromptStyleSchema>;

/**
 * Safety limits for provider execution
 */
export const ProviderSafetySchema = z.object({
  max_turns: z.number().int().positive().optional(),
  max_budget_usd: z.number().positive().optional(),
  timeout: z.number().int().positive().optional(),
}).optional();

export type ProviderSafety = z.infer<typeof ProviderSafetySchema>;

/**
 * Provider CLI configuration for LLM providers (opus, codex, kimi, glm)
 * Loaded from YAML frontmatter in `_providers/` files
 */
export const ProviderConfigSchema = z.object({
  cli: z.string(),
  model: z.string(),
  subcommand: z.string().optional(),
  unattended_flags: z.array(z.string()),
  output_flags: z.array(z.string()),
  prompt_style: PromptStyleSchema,
  safety: ProviderSafetySchema,
  provider: z.string().optional(),
  config_overrides: z.record(z.string(), z.unknown()).optional(),
});

export type ProviderConfig = z.infer<typeof ProviderConfigSchema>;
