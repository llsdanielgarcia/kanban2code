import { EventEmitter } from 'node:events';
import { spawn as spawnProcess } from 'node:child_process';
import * as fs from 'node:fs/promises';
import * as path from 'node:path';
import type { ChildProcess } from 'node:child_process';
import type { Task, Stage } from '../types/task';
import { parseTaskFile, stringifyTaskFile } from '../services/frontmatter';
import { loadAllTasks, getOrderedTasksForStage } from '../services/scanner';
import { buildRunnerPrompt } from '../services/prompt-builder';
import { resolveAgentConfig } from '../services/agent-service';
import { getAdapterForCli } from './adapter-factory';
import {
  parseAuditRating,
  parseAuditVerdict,
  parseFilesChanged,
  parseStageTransition,
} from './output-parser';
import { CONFIG_FILE, MODES_FOLDER } from '../core/constants';
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

interface ModeInfo {
  id: string;
  stage?: string;
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

function getFallbackModeForStage(stage: RunnerPipelineStage): string {
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

      await this.setTaskStageModeAgent(task, stage);
      this.emit('stageStarted', { task: { ...task }, stage } satisfies RunnerStageStartedEvent);

      const { xmlPrompt, modeInstructions } = await buildRunnerPrompt(task, this.kanbanRoot);

      const agentName = task.agent;
      if (!agentName) {
        const error = `No agent configured for mode '${task.mode ?? 'unknown'}'`;
        this.emit('taskFailed', { task, error, hardStop: true } satisfies RunnerTaskFailedEvent);
        return { status: 'failed', error, hardStop: true };
      }

      const agentConfig = await resolveAgentConfig(this.kanbanRoot, agentName);
      if (!agentConfig) {
        const error = `Agent config not found for '${agentName}'`;
        this.emit('taskFailed', { task, error, hardStop: true } satisfies RunnerTaskFailedEvent);
        return { status: 'failed', error, hardStop: true };
      }

      const adapter = getAdapterForCli(agentConfig.cli);
      const command = adapter.buildCommand(agentConfig, xmlPrompt, {
        systemPrompt: modeInstructions,
        maxTurns: agentConfig.safety?.max_turns,
      });

      const execution = await this.executeCommand(command.command, command.args, command.stdin);

      // Non-zero exit codes are treated as hard crashes.
      if (execution.exitCode !== 0) {
        const error = `CLI crash for ${agentConfig.cli} (exit ${execution.exitCode}): ${execution.stderr || execution.stdout || 'no output'}`;
        this.emit('taskFailed', { task, error, hardStop: true } satisfies RunnerTaskFailedEvent);
        return { status: 'failed', error, hardStop: true };
      }

      const parsed = adapter.parseResponse(execution.stdout, execution.exitCode);
      if (!parsed.success) {
        const error = parsed.error ?? `CLI execution failed for ${agentConfig.cli}`;
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

  private async setTaskStageModeAgent(task: Task, stage: RunnerPipelineStage): Promise<void> {
    const defaultMode = (await this.getDefaultModeForStage(stage)) ?? getFallbackModeForStage(stage);
    const defaultAgent = await this.getDefaultAgentForMode(defaultMode);

    await this.persistTask(task, {
      stage,
      mode: defaultMode,
      agent: defaultAgent ?? task.agent ?? DEFAULT_CONFIG.preferences.defaultAgent ?? 'codex',
    });
  }

  private async persistTask(task: Task, updates: Partial<Pick<Task, 'stage' | 'mode' | 'agent' | 'attempts'>>): Promise<void> {
    const freshTask = await parseTaskFile(task.filePath);
    const originalContent = await fs.readFile(task.filePath, 'utf-8');

    const merged: Task = {
      ...freshTask,
      ...updates,
    };

    const serialized = stringifyTaskFile(merged, originalContent);
    await fs.writeFile(task.filePath, serialized, 'utf-8');

    task.stage = merged.stage;
    task.mode = merged.mode;
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

  private async getDefaultModeForStage(stage: RunnerPipelineStage): Promise<string | undefined> {
    const modes = await this.listModesWithStage();
    const match = modes.find((mode) => mode.stage === stage);
    return match?.id;
  }

  private async listModesWithStage(): Promise<ModeInfo[]> {
    const modesDir = path.join(this.kanbanRoot, MODES_FOLDER);
    const modes: ModeInfo[] = [];

    try {
      const entries = await fs.readdir(modesDir, { withFileTypes: true });
      for (const entry of entries) {
        if (!entry.isFile() || !entry.name.endsWith('.md')) {
          continue;
        }

        const filePath = path.join(modesDir, entry.name);
        const id = path.basename(entry.name, '.md');
        const parsed = await parseTaskLikeFrontmatter(filePath);

        modes.push({
          id,
          stage: typeof parsed.stage === 'string' ? parsed.stage : undefined,
        });
      }
    } catch {
      return [];
    }

    return modes.sort((a, b) => a.id.localeCompare(b.id));
  }

  private async getDefaultAgentForMode(modeName: string): Promise<string | undefined> {
    const configPath = path.join(this.kanbanRoot, CONFIG_FILE);

    try {
      const raw = await fs.readFile(configPath, 'utf-8');
      const parsed = JSON.parse(raw) as {
        modeDefaults?: Record<string, string>;
      };

      return parsed.modeDefaults?.[modeName] ?? DEFAULT_CONFIG.modeDefaults?.[modeName];
    } catch {
      return DEFAULT_CONFIG.modeDefaults?.[modeName];
    }
  }
}

async function parseTaskLikeFrontmatter(filePath: string): Promise<Record<string, unknown>> {
  const raw = await fs.readFile(filePath, 'utf-8');
  const match = raw.match(/^---\n([\s\S]*?)\n---/);
  if (!match) {
    return {};
  }

  const data: Record<string, unknown> = {};
  for (const line of match[1].split('\n')) {
    const idx = line.indexOf(':');
    if (idx === -1) continue;

    const key = line.slice(0, idx).trim();
    const value = line.slice(idx + 1).trim().replace(/^['"]|['"]$/g, '');
    data[key] = value;
  }

  return data;
}
