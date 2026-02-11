import { z } from 'zod';

/**
 * Mode configuration for behavioral instruction files
 * Loaded from YAML frontmatter in `_modes/` files (coder, auditor, planner, etc.)
 * Contains system prompts and behavior rules
 */
export const ModeConfigSchema = z.object({
  id: z.string(),
  name: z.string(),
  description: z.string(),
  stage: z.string().optional(),
  path: z.string(),
  content: z.string().optional(),
});

export type ModeConfig = z.infer<typeof ModeConfigSchema>;
