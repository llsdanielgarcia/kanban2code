import { EventEmitter } from 'node:events';
import type { Stage } from '../types/task';

export interface RunnerStateSnapshot {
  isRunning: boolean;
  activeTaskId?: string;
  activeStage?: Stage;
}

const runnerStateEvents = new EventEmitter();

let currentRunnerState: RunnerStateSnapshot = { isRunning: false };

export function getRunnerState(): RunnerStateSnapshot {
  return { ...currentRunnerState };
}

export function setRunnerState(nextState: RunnerStateSnapshot): void {
  currentRunnerState = { ...nextState };
  runnerStateEvents.emit('changed', getRunnerState());
}

export function onRunnerStateChanged(listener: (state: RunnerStateSnapshot) => void): () => void {
  runnerStateEvents.on('changed', listener);
  return () => {
    runnerStateEvents.off('changed', listener);
  };
}
