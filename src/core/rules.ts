import { Stage } from '../types/task';

export const ALLOWED_TRANSITIONS: Record<Stage, Stage[]> = {
  inbox: ['plan'],
  plan: ['code'],
  code: ['audit'],
  audit: ['completed'],
  // Completed items should only be archived, not moved back into the board
  completed: [],
};

export function isTransitionAllowed(current: Stage, target: Stage): boolean {
  if (current === target) return true;
  return ALLOWED_TRANSITIONS[current]?.includes(target) ?? false;
}
