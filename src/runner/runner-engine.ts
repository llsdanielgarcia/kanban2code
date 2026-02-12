import { EventEmitter } from 'node:events';
import { spawn as spawnProcess } from 'node:child_process';
import * as fs from 'node:fs/promises';
import * as path from 'node:path';
import type { ChildProcess } from 'node:child_process';
import type { Task, Stage } from '../types/task';
import { parseTaskFile, stringifyTaskFile } from '../services/frontmatter';
import { loadAllTasks, getOrderedTasksForStage } from '../services/scanner';
import { buildRunnerPrompt } from '../services/prompt-builder';
import { resolveProviderConfig } from '../services/provider-service';
import { getDefaultAgentForStage, getDefaultProviderForAgent } from '../services/stage-manager';
import { getAdapterForCli } from './adapter-factory';
import {
  parseAuditRating,
  parseAuditVerdict,
  parseFilesChanged,
  parseStageTransition,
} from './output-parser';
import { DEFAULT_CONFIG } from '../types/config';

export type RunnerPipelineStage = Extract<Stage, 'plan' | 'code' | 'audit'>;

export type RunnerStopReason = 'completed' | 'stopped' | 'failed';

export interface RunnerRunResult {
  status: 'completed' | 'failed' | 'stopped';
  error?: string;
  hardStop?: boolean;
}

export interface RunnerTaskStartedEvent {
  task: Task;
}

export interface RunnerStageStartedEvent {
  task: Task;
  stage: RunnerPipelineStage;
}

export interface RunnerStageCompletedEvent {
  task: Task;
  stage: RunnerPipelineStage;
  output: string;
  stageTransition?: Stage;
  filesChanged?: string[];
  auditRating?: number;
  auditVerdict?: 'ACCEPTED' | 'NEEDS_WORK';
}

export interface RunnerTaskCompletedEvent {
  task: Task;
}

export interface RunnerTaskFailedEvent {
  task: Task;
  error: string;
  hardStop: boolean;
}

export interface RunnerStoppedEvent {
  reason: RunnerStopReason;
  error?: string;
}

interface RunnerEngineDeps {
  spawn?: typeof spawnProcess;
}

interface CommandExecutionResult {
  stdout: string;
  stderr: string;
  exitCode: number;
}

function getStagesFrom(start: Stage): RunnerPipelineStage[] {
  switch (start) {
    case 'plan':
      return ['plan', 'code', 'audit'];
    case 'code':
      return ['code', 'audit'];
    case 'audit':
      return ['audit'];
    default:
      return [];
  }
}

function getFallbackAgentForStage(stage: RunnerPipelineStage): string {
  if (stage === 'plan') return 'planner';
  if (stage === 'code') return 'coder';
  return 'auditor';
}

export class RunnerEngine extends EventEmitter {
  private readonly kanbanRoot: string;

  private readonly spawnFn: typeof spawnProcess;

  private isRunning = false;

  private stopRequested = false;

  private currentProcess: ChildProcess | null = null;

  constructor(kanbanRoot: string, deps: RunnerEngineDeps = {}) {
    super();
    this.kanbanRoot = kanbanRoot;
    this.spawnFn = deps.spawn ?? spawnProcess;
  }

  stop(): void {
    this.stopRequested = true;
    if (this.currentProcess && !this.currentProcess.killed) {
      this.currentProcess.kill('SIGTERM');
    }
  }

  async runTask(task: Task): Promise<RunnerRunResult> {
    if (this.isRunning) {
      throw new Error('Runner is already active');
    }

    this.isRunning = true;
    this.stopRequested = false;

    try {
      await this.ensureWorkingTreeClean();
      const refreshed = await parseTaskFile(task.filePath);
      const result = await this.runTaskPipeline(refreshed);
      this.emit('runnerStopped', { reason: result.status === 'failed' ? 'failed' : result.status } satisfies RunnerStoppedEvent);
      return result;
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      this.emit('runnerStopped', { reason: 'failed', error: message } satisfies RunnerStoppedEvent);
      return { status: 'failed', error: message, hardStop: true };
    } finally {
      this.isRunning = false;
      this.currentProcess = null;
    }
  }

  async runColumn(stage: Stage): Promise<RunnerRunResult> {
    if (this.isRunning) {
      throw new Error('Runner is already active');
    }

    this.isRunning = true;
    this.stopRequested = false;

    try {
      await this.ensureWorkingTreeClean();
      const tasks = getOrderedTasksForStage(await loadAllTasks(this.kanbanRoot), stage);

      for (const task of tasks) {
        if (this.stopRequested) {
          this.emit('runnerStopped', { reason: 'stopped' } satisfies RunnerStoppedEvent);
          return { status: 'stopped' };
        }

        const result = await this.runTaskPipeline(task);
        if (result.status === 'stopped') {
          this.emit('runnerStopped', { reason: 'stopped' } satisfies RunnerStoppedEvent);
          return result;
        }

        if (result.status === 'failed' && result.hardStop) {
          this.emit('runnerStopped', { reason: 'failed', error: result.error } satisfies RunnerStoppedEvent);
          return result;
        }
      }

      this.emit('runnerStopped', { reason: 'completed' } satisfies RunnerStoppedEvent);
      return { status: 'completed' };
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      this.emit('runnerStopped', { reason: 'failed', error: message } satisfies RunnerStoppedEvent);
      return { status: 'failed', error: message, hardStop: true };
    } finally {
      this.isRunning = false;
      this.currentProcess = null;
    }
  }

  private async runTaskPipeline(task: Task): Promise<RunnerRunResult> {
    this.emit('taskStarted', { task } satisfies RunnerTaskStartedEvent);
    const remainingStages = getStagesFrom(task.stage);
    if (remainingStages.length === 0) {
      const error = `Runner cannot execute task from stage '${task.stage}'`;
      this.emit('taskFailed', { task, error, hardStop: true } satisfies RunnerTaskFailedEvent);
      return { status: 'failed', error, hardStop: true };
    }

    for (const stage of remainingStages) {
      if (this.stopRequested) {
        return { status: 'stopped' };
      }

      await this.setTaskStageProviderAgent(task, stage);
      this.emit('stageStarted', { task: { ...task }, stage } satisfies RunnerStageStartedEvent);

      const { xmlPrompt, agentInstructions } = await buildRunnerPrompt(task, this.kanbanRoot);

      const providerName = task.provider;
      if (!providerName) {
        const error = `No provider configured for stage '${stage}'`;
        this.emit('taskFailed', { task, error, hardStop: true } satisfies RunnerTaskFailedEvent);
        return { status: 'failed', error, hardStop: true };
      }

      const providerConfig = await resolveProviderConfig(this.kanbanRoot, providerName);
      if (!providerConfig) {
        const error = `Provider config not found for '${providerName}'`;
        this.emit('taskFailed', { task, error, hardStop: true } satisfies RunnerTaskFailedEvent);
        return { status: 'failed', error, hardStop: true };
      }

      const adapter = getAdapterForCli(providerConfig.cli);
      const command = adapter.buildCommand(providerConfig, xmlPrompt, {
        systemPrompt: agentInstructions,
        maxTurns: providerConfig.safety?.max_turns,
      });

      const execution = await this.executeCommand(command.command, command.args, command.stdin);

      // Non-zero exit codes are treated as hard crashes.
      if (execution.exitCode !== 0) {
        const error = `CLI crash for ${providerConfig.cli} (exit ${execution.exitCode}): ${execution.stderr || execution.stdout || 'no output'}`;
        this.emit('taskFailed', { task, error, hardStop: true } satisfies RunnerTaskFailedEvent);
        return { status: 'failed', error, hardStop: true };
      }

      const parsed = adapter.parseResponse(execution.stdout, execution.exitCode);
      if (!parsed.success) {
        const error = parsed.error ?? `CLI execution failed for ${providerConfig.cli}`;
        this.emit('taskFailed', { task, error, hardStop: true } satisfies RunnerTaskFailedEvent);
        return { status: 'failed', error, hardStop: true };
      }

      const stageTransition = parseStageTransition(parsed.result);
      const filesChanged = parseFilesChanged(parsed.result);
      const auditRating = stage === 'audit' ? parseAuditRating(parsed.result) : undefined;
      const auditVerdict = stage === 'audit' ? parseAuditVerdict(parsed.result) : undefined;

      this.emit('stageCompleted', {
        task: { ...task },
        stage,
        output: parsed.result,
        stageTransition,
        filesChanged,
        auditRating,
        auditVerdict,
      } satisfies RunnerStageCompletedEvent);

      if (stage === 'audit') {
        const isAccepted = (auditRating !== undefined && auditRating >= 8) || auditVerdict === 'ACCEPTED';

        if (isAccepted) {
          await this.persistTask(task, { stage: 'completed' });
          this.emit('taskCompleted', { task: { ...task } } satisfies RunnerTaskCompletedEvent);
          return { status: 'completed' };
        }

        const attempts = (task.attempts ?? 0) + 1;
        if (attempts >= 2) {
          await this.persistTask(task, { attempts, stage: 'audit' });
          const error = `Audit failed with rating ${auditRating ?? 'unknown'} at attempt ${attempts}`;
          this.emit('taskFailed', { task, error, hardStop: true } satisfies RunnerTaskFailedEvent);
          return { status: 'failed', error, hardStop: true };
        }

        await this.persistTask(task, { attempts, stage: 'code' });
        const error = `Audit failed with rating ${auditRating ?? 'unknown'} (attempt ${attempts})`;
        this.emit('taskFailed', { task, error, hardStop: false } satisfies RunnerTaskFailedEvent);
        return { status: 'failed', error, hardStop: false };
      }
    }

    return { status: 'completed' };
  }

  private async setTaskStageProviderAgent(task: Task, stage: RunnerPipelineStage): Promise<void> {
    const defaultAgent = (await getDefaultAgentForStage(this.kanbanRoot, stage)) ?? getFallbackAgentForStage(stage);
    const defaultProvider = getDefaultProviderForAgent(defaultAgent);

    await this.persistTask(task, {
      stage,
      provider: defaultProvider ?? task.provider ?? DEFAULT_CONFIG.preferences.defaultAgent ?? 'codex',
      agent: defaultAgent,
    });
  }

  private async persistTask(task: Task, updates: Partial<Pick<Task, 'stage' | 'provider' | 'agent' | 'attempts'>>): Promise<void> {
    const freshTask = await parseTaskFile(task.filePath);
    const originalContent = await fs.readFile(task.filePath, 'utf-8');

    const merged: Task = {
      ...freshTask,
      ...updates,
    };

    const serialized = stringifyTaskFile(merged, originalContent);
    await fs.writeFile(task.filePath, serialized, 'utf-8');

    task.stage = merged.stage;
    task.provider = merged.provider;
    task.agent = merged.agent;
    task.attempts = merged.attempts;
    task.content = merged.content;
  }

  private async executeCommand(command: string, args: string[], stdin?: string): Promise<CommandExecutionResult> {
    return new Promise<CommandExecutionResult>((resolve, reject) => {
      const child = this.spawnFn(command, args, {
        cwd: path.resolve(this.kanbanRoot, '..'),
        stdio: 'pipe',
      });

      this.currentProcess = child;

      let stdout = '';
      let stderr = '';

      child.stdout?.on('data', (chunk: Buffer | string) => {
        stdout += chunk.toString();
      });

      child.stderr?.on('data', (chunk: Buffer | string) => {
        stderr += chunk.toString();
      });

      child.on('error', (error) => {
        reject(error);
      });

      child.on('close', (code) => {
        this.currentProcess = null;
        resolve({
          stdout,
          stderr,
          exitCode: code ?? 1,
        });
      });

      if (stdin) {
        child.stdin?.write(stdin);
      }
      child.stdin?.end();
    });
  }

  private async ensureWorkingTreeClean(): Promise<void> {
    const gitResult = await this.executeCommand('git', ['status', '--porcelain']);

    if (gitResult.exitCode !== 0) {
      throw new Error(`Unable to check git working tree: ${gitResult.stderr || gitResult.stdout || 'git status failed'}`);
    }

    if (gitResult.stdout.trim().length > 0) {
      throw new Error('Refusing to run: git working tree is dirty. Commit or stash changes first.');
    }
  }
}
