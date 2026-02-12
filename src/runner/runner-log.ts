import * as fs from 'node:fs/promises';
import * as path from 'node:path';
import { KANBAN_FOLDER, LOGS_FOLDER } from '../core/constants';

export type RunnerTaskStatus = 'completed' | 'failed' | 'crashed';

export type RunnerStopReason = 'completed' | 'stopped' | 'failed';

export interface RunnerTaskResult {
  taskId: string;
  title: string;
  status: RunnerTaskStatus;
  provider?: string;
  agent?: string;
  tokensIn?: number;
  tokensOut?: number;
  durationMs?: number;
  commit?: string;
  attempts?: number;
  error?: string;
}

interface RunnerLogOptions {
  now?: () => Date;
}

function formatReportTimestamp(date: Date): string {
  const yyyy = date.getFullYear();
  const mm = String(date.getMonth() + 1).padStart(2, '0');
  const dd = String(date.getDate()).padStart(2, '0');
  const hh = String(date.getHours()).padStart(2, '0');
  const min = String(date.getMinutes()).padStart(2, '0');
  return `${yyyy}-${mm}-${dd} ${hh}:${min}`;
}

function formatFileTimestamp(date: Date): string {
  const yyyy = date.getFullYear();
  const mm = String(date.getMonth() + 1).padStart(2, '0');
  const dd = String(date.getDate()).padStart(2, '0');
  const hh = String(date.getHours()).padStart(2, '0');
  const min = String(date.getMinutes()).padStart(2, '0');
  const sec = String(date.getSeconds()).padStart(2, '0');
  return `${yyyy}${mm}${dd}-${hh}${min}${sec}`;
}

function formatDuration(ms: number): string {
  const clamped = Math.max(0, Math.floor(ms));
  const totalSeconds = Math.floor(clamped / 1000);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${minutes}m ${String(seconds).padStart(2, '0')}s`;
}

function formatTokens(tokensIn?: number, tokensOut?: number): string {
  if (tokensIn === undefined && tokensOut === undefined) {
    return '-';
  }

  const inDisplay = tokensIn ?? 0;
  const outDisplay = tokensOut ?? 0;
  return `${inDisplay.toLocaleString()} in / ${outDisplay.toLocaleString()} out`;
}

function resolveLogsDirectory(root: string): string {
  const rootName = path.basename(root);
  if (rootName === KANBAN_FOLDER) {
    return path.join(root, LOGS_FOLDER);
  }

  return path.join(root, KANBAN_FOLDER, LOGS_FOLDER);
}

export class RunnerLog {
  private readonly now: () => Date;

  private startedAt: Date | null = null;

  private finishedAt: Date | null = null;

  private finishReason: RunnerStopReason | null = null;

  private readonly tasks: RunnerTaskResult[] = [];

  constructor(options: RunnerLogOptions = {}) {
    this.now = options.now ?? (() => new Date());
  }

  startRun(): void {
    this.startedAt = this.now();
    this.finishedAt = null;
    this.finishReason = null;
    this.tasks.length = 0;
  }

  recordTask(result: RunnerTaskResult): void {
    this.tasks.push(result);
  }

  finishRun(reason: RunnerStopReason): void {
    if (!this.startedAt) {
      this.startedAt = this.now();
    }

    this.finishedAt = this.now();
    this.finishReason = reason;
  }

  toMarkdown(): string {
    const start = this.startedAt ?? this.now();
    const end = this.finishedAt ?? this.now();

    const completed = this.tasks.filter((task) => task.status === 'completed').length;
    const failed = this.tasks.filter((task) => task.status === 'failed').length;
    const crashed = this.tasks.filter((task) => task.status === 'crashed').length;

    const lines: string[] = [];
    lines.push(`# Night Shift Report — ${formatReportTimestamp(start)}`);
    lines.push('');
    lines.push('## Summary');
    lines.push('| Metric | Value |');
    lines.push('| --- | --- |');
    lines.push(`| Tasks processed | ${this.tasks.length} |`);
    lines.push(`| Completed | ${completed} |`);
    lines.push(`| Failed | ${failed} |`);
    lines.push(`| Crashed | ${crashed} |`);
    lines.push(`| Total time | ${formatDuration(end.getTime() - start.getTime())} |`);
    lines.push(`| Finish reason | ${this.finishReason ?? 'in-progress'} |`);
    lines.push('');
    lines.push('## Tasks');

    if (this.tasks.length === 0) {
      lines.push('_No tasks were processed in this run._');
      lines.push('');
      return lines.join('\n');
    }

    for (const task of this.tasks) {
      lines.push('');
      lines.push(`### ${task.title || task.taskId}`);
      lines.push(`- Task: ${task.taskId}`);
      lines.push(`- Status: ${task.status}`);
      lines.push(`- Provider: ${task.provider ?? '-'}`);
      lines.push(`- Agent: ${task.agent ?? '-'}`);
      lines.push(`- Tokens: ${formatTokens(task.tokensIn, task.tokensOut)}`);
      lines.push(`- Time: ${task.durationMs !== undefined ? formatDuration(task.durationMs) : '-'}`);
      lines.push(`- Commit: ${task.commit ?? '-'}`);
      lines.push(`- Attempts: ${task.attempts ?? 0}`);
      lines.push(`- Error: ${task.error ?? '-'}`);
    }

    lines.push('');
    return lines.join('\n');
  }

  async save(root: string): Promise<string> {
    const start = this.startedAt ?? this.now();
    const logsDir = resolveLogsDirectory(root);
    await fs.mkdir(logsDir, { recursive: true });

    const fileName = `run-${formatFileTimestamp(start)}.md`;
    const filePath = path.join(logsDir, fileName);
    await fs.writeFile(filePath, this.toMarkdown(), 'utf-8');

    return filePath;
  }
}
