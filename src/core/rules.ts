import { Stage } from '../types/task';

export const ALLOWED_TRANSITIONS: Record<Stage, Stage[]> = {
  'inbox': ['plan', 'completed'], // Can go to Plan or straight to Completed (wontfix/done)
  'plan': ['code', 'inbox'],      // Forward or back to inbox
  'code': ['audit', 'plan'],      // Forward or back to plan
  'audit': ['completed', 'code'], // Forward or back to code
  'completed': ['audit', 'plan', 'inbox'], // Reopen to any previous stage
};

export function isTransitionAllowed(current: Stage, target: Stage): boolean {
  if (current === target) return true;
  return ALLOWED_TRANSITIONS[current]?.includes(target) ?? false;
}
