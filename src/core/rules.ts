import { Stage } from '../types/task';

export const ALLOWED_TRANSITIONS: Record<Stage, Stage[]> = {
  inbox: ['plan'],
  plan: ['inbox', 'code'],
  code: ['plan', 'audit'],
  audit: ['code', 'completed'],
  // Completed items should only be archived, not moved back into the board
  completed: [],
};

export function isTransitionAllowed(current: Stage, target: Stage): boolean {
  if (current === target) return true;
  return ALLOWED_TRANSITIONS[current]?.includes(target) ?? false;
}
