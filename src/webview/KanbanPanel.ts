import * as vscode from 'vscode';
import { createEnvelope, parseDeleteTaskPayload, validateEnvelope, type MessageEnvelope } from './messaging';
import { WorkspaceState } from '../workspace/state';
import { findTaskById, loadAllTasks } from '../services/scanner';
import { changeStageAndReload } from '../services/stage-manager';
import { archiveTask } from '../services/archive';
import { listAvailableContexts, listAvailableAgents, listAvailableSkills, createContextFile, createAgentFile, type ContextFile, type Agent, type SkillFile } from '../services/context';
import { listProjectsAndPhases, createProject } from '../services/projects';
import { deleteTaskById } from '../services/delete-task';
import { loadTaskContentById, saveTaskContentById, saveTaskWithMetadata } from '../services/task-content';
import type { Task, Stage } from '../types/task';
import type { FilterState } from '../types/filters';
import { getSidebarProvider } from './viewRegistry';

export class KanbanPanel {
  public static currentPanel: KanbanPanel | undefined;
  private readonly _panel: vscode.WebviewPanel;
  private readonly _extensionUri: vscode.Uri;
  private _disposables: vscode.Disposable[] = [];
  private _tasks: Task[] = [];
  private _contexts: ContextFile[] = [];
  private _skills: SkillFile[] = [];
  private _agents: Agent[] = [];
  private _webviewReady = false;
  private _pendingMessages: MessageEnvelope[] = [];

  private constructor(panel: vscode.WebviewPanel, extensionUri: vscode.Uri) {
    this._panel = panel;
    this._extensionUri = extensionUri;
    this._panel.onDidDispose(() => this.dispose(), null, this._disposables);
    this._panel.webview.options = {
      enableScripts: true,
      localResourceRoots: [
        vscode.Uri.joinPath(this._extensionUri, 'dist'),
        vscode.Uri.joinPath(this._extensionUri, 'docs', 'design', 'styles'),
      ],
    };
    this._panel.webview.html = this._getWebviewContent();

    this._panel.webview.onDidReceiveMessage(
      async (data) => {
        await this._handleWebviewMessage(data);
      },
      null,
      this._disposables,
    );
  }

  public static createOrShow(extensionUri: vscode.Uri) {
    const column = vscode.window.activeTextEditor
      ? vscode.window.activeTextEditor.viewColumn
      : undefined;

    // If we already have a panel, show it.
    if (KanbanPanel.currentPanel) {
      KanbanPanel.currentPanel._panel.reveal(column);
      return;
    }

    // Otherwise, create a new panel.
    const panel = vscode.window.createWebviewPanel(
      'kanban2codeBoard',
      'Kanban Board',
      column || vscode.ViewColumn.One,
      {
        enableScripts: true,
        localResourceRoots: [vscode.Uri.joinPath(extensionUri, 'dist')],
      },
    );

    KanbanPanel.currentPanel = new KanbanPanel(panel, extensionUri);
  }

  public updateTasks(tasks: Task[]) {
    this._tasks = tasks;
    this._postMessage(createEnvelope('TaskUpdated', { tasks }));
  }

  public async refresh(): Promise<void> {
    await this._sendInitialState();
  }

  public postFilterState(filters: FilterState) {
    this._postMessage(createEnvelope('FilterChanged', { filters }));
  }

  public toggleLayout() {
    this._postMessage(createEnvelope('ToggleLayout', {}));
  }

  public showKeyboardShortcuts() {
    this._postMessage(createEnvelope('ShowKeyboardShortcuts', {}));
  }

  public dispose() {
    KanbanPanel.currentPanel = undefined;
    this._panel.dispose();
    while (this._disposables.length) {
      const x = this._disposables.pop();
      if (x) {
        x.dispose();
      }
    }
  }

  private _getWebviewContent() {
    const webview = this._panel.webview;
    const scriptUri = webview.asWebviewUri(
      vscode.Uri.joinPath(this._extensionUri, 'dist', 'webview.js'),
    );
    const styleUri = webview.asWebviewUri(
      vscode.Uri.joinPath(this._extensionUri, 'dist', 'webview.css'),
    );
    const distUri = webview.asWebviewUri(vscode.Uri.joinPath(this._extensionUri, 'dist'));

    const nonce = getNonce();

    return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta http-equiv="Content-Security-Policy" content="default-src 'none'; img-src ${webview.cspSource} data:; font-src ${webview.cspSource}; style-src ${webview.cspSource} 'unsafe-inline'; script-src ${webview.cspSource} 'nonce-${nonce}'; worker-src ${webview.cspSource} blob:;">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <link href="${styleUri}" rel="stylesheet">
    <title>Kanban Board</title>
</head>
<body>
    <div id="root"></div>
    <script nonce="${nonce}">window.__KANBAN2CODE_DIST_URI__ = "${distUri}";</script>
    <script nonce="${nonce}" src="${scriptUri}"></script>
</body>
</html>`;
  }

  private _postMessage(message: MessageEnvelope) {
    if (!this._webviewReady) {
      this._pendingMessages.push(message);
      return;
    }
    this._panel.webview.postMessage(message);
  }

  private _flushPendingMessages() {
    if (!this._webviewReady) return;
    const pending = this._pendingMessages;
    this._pendingMessages = [];
    for (const message of pending) {
      this._panel.webview.postMessage(message);
    }
  }

  private async _handleWebviewMessage(data: unknown) {
    try {
      const envelope = validateEnvelope(data);
      const { type, payload } = envelope;

      switch (type) {
        case 'RequestState':
          this._webviewReady = true;
          await this._sendInitialState();
          this._flushPendingMessages();
          break;

        case 'MoveTask': {
          const { taskId, toStage, newStage } = payload as { taskId: string; toStage?: Stage; newStage?: Stage };
          const stage = toStage ?? newStage;
          if (stage) {
            await changeStageAndReload(taskId, stage);
            await this._sendInitialState();
          }
          break;
        }

        case 'CreateTask':
          await vscode.commands.executeCommand('kanban2code.newTask', payload);
          await this._sendInitialState();
          break;

        case 'CopyContext': {
          const { taskId, mode } = payload as { taskId: string; mode: string };
          await vscode.commands.executeCommand('kanban2code.copyTaskContext', taskId, mode);
          break;
        }

        case 'ArchiveTask': {
          const { taskId } = payload as { taskId: string };
          const root = WorkspaceState.kanbanRoot;
          if (root && taskId) {
            const task = await findTaskById(root, taskId);
            if (task) {
              await archiveTask(task, root);
              await this._sendInitialState();
            }
          }
          break;
        }

        case 'DeleteTask': {
          const { taskId } = parseDeleteTaskPayload(payload);
          const tasks = await deleteTaskById(taskId);
          if (tasks) {
            this.updateTasks(tasks);
            getSidebarProvider()?.updateTasks(tasks);
          }
          break;
        }

        case 'OpenTask': {
          const { filePath } = payload as { filePath: string };
          if (filePath) {
            const doc = await vscode.workspace.openTextDocument(vscode.Uri.file(filePath));
            await vscode.window.showTextDocument(doc);
          }
          break;
        }

        case 'RequestTaskContent': {
          const { taskId } = payload as { taskId: string };
          try {
            const { content } = await loadTaskContentById(taskId);
            this._postMessage(createEnvelope('TaskContentLoaded', { taskId, content }));
          } catch (error) {
            const message = error instanceof Error ? error.message : 'Unknown error';
            this._postMessage(createEnvelope('TaskContentLoadFailed', { taskId, error: message }));
          }
          break;
        }

        case 'SaveTaskContent': {
          const { taskId, content } = payload as { taskId: string; content: string };
          try {
            const tasks = await saveTaskContentById(taskId, content);
            this.updateTasks(tasks);
            getSidebarProvider()?.updateTasks(tasks);
            this._postMessage(createEnvelope('TaskContentSaved', { taskId }));
          } catch (error) {
            const message = error instanceof Error ? error.message : 'Unknown error';
            vscode.window.showErrorMessage(`Failed to save task: ${message}`);
            this._postMessage(createEnvelope('TaskContentSaveFailed', { taskId, error: message }));
          }
          break;
        }

        case 'RequestFullTaskData': {
          const { taskId } = payload as { taskId: string };
          try {
            const root = WorkspaceState.kanbanRoot;
            if (!root) throw new Error('Kanban workspace not detected.');
            const { task, content } = await loadTaskContentById(taskId);
            const contexts = await listAvailableContexts(root);
            const skills = await listAvailableSkills(root);
            const agents = await listAvailableAgents(root);
            const listing = await listProjectsAndPhases(root);

            this._postMessage(createEnvelope('FullTaskDataLoaded', {
              taskId,
              content,
              metadata: {
                title: task.title,
                location: task.project
                  ? { type: 'project', project: task.project, phase: task.phase }
                  : { type: 'inbox' },
                agent: task.agent || null,
                contexts: task.contexts || [],
                skills: task.skills || [],
                tags: task.tags || [],
              },
              contexts,
              skills,
              agents,
              projects: listing.projects,
              phasesByProject: listing.phasesByProject,
            }));
          } catch (error) {
            const message = error instanceof Error ? error.message : 'Unknown error';
            this._postMessage(createEnvelope('FullTaskDataLoadFailed', { taskId, error: message }));
          }
          break;
        }

        case 'SaveTaskWithMetadata': {
          const { taskId, content, metadata } = payload as {
            taskId: string;
            content: string;
            metadata: {
              title: string;
              location: { type: 'inbox' } | { type: 'project'; project: string; phase?: string };
              agent: string | null;
              contexts: string[];
              skills: string[];
              tags: string[];
            };
          };
          try {
            const tasks = await saveTaskWithMetadata(taskId, content, metadata);
            this.updateTasks(tasks);
            getSidebarProvider()?.updateTasks(tasks);
            this._postMessage(createEnvelope('TaskMetadataSaved', { taskId }));
          } catch (error) {
            const message = error instanceof Error ? error.message : 'Unknown error';
            vscode.window.showErrorMessage(`Failed to save task: ${message}`);
            this._postMessage(createEnvelope('TaskMetadataSaveFailed', { taskId, error: message }));
          }
          break;
        }

        case 'ALERT': {
          const text = (payload as { text?: string })?.text ?? 'Alert from Kanban2Code';
          vscode.window.showInformationMessage(text);
          break;
        }

        case 'CreateProject': {
          const projectPayload = payload as {
            name?: string;
            phases?: string[];
          };
          if (projectPayload.name) {
            const root = WorkspaceState.kanbanRoot;
            if (root) {
              try {
                await createProject(root, {
                  name: projectPayload.name,
                  phases: projectPayload.phases,
                });
                await this._sendInitialState();
              } catch (error) {
                vscode.window.showErrorMessage(`Failed to create project: ${error instanceof Error ? error.message : 'Unknown error'}`);
              }
            }
          }
          break;
        }

        case 'CreateContext': {
          const contextPayload = payload as {
            name?: string;
            scope?: 'global' | 'project';
            project?: string;
            description?: string;
            fileReferences?: string[];
            content?: string;
          };
          if (contextPayload.name && contextPayload.description !== undefined) {
            const root = WorkspaceState.kanbanRoot;
            if (root) {
              try {
                await createContextFile(root, {
                  name: contextPayload.name,
                  scope: contextPayload.scope || 'global',
                  project: contextPayload.project,
                  description: contextPayload.description,
                  fileReferences: contextPayload.fileReferences,
                  content: contextPayload.content || '',
                });
                await this._sendInitialState();
              } catch (error) {
                vscode.window.showErrorMessage(`Failed to create context: ${error instanceof Error ? error.message : 'Unknown error'}`);
              }
            }
          }
          break;
        }

        case 'CreateAgent': {
          const agentPayload = payload as {
            name?: string;
            description?: string;
            instructions?: string;
          };
          if (agentPayload.name && agentPayload.description !== undefined && agentPayload.instructions !== undefined) {
            const root = WorkspaceState.kanbanRoot;
            if (root) {
              try {
                await createAgentFile(root, {
                  name: agentPayload.name,
                  description: agentPayload.description,
                  instructions: agentPayload.instructions,
                });
                await this._sendInitialState();
              } catch (error) {
                vscode.window.showErrorMessage(`Failed to create agent: ${error instanceof Error ? error.message : 'Unknown error'}`);
              }
            }
          }
          break;
        }

        case 'RequestContexts': {
          const root = WorkspaceState.kanbanRoot;
          if (root) {
            const contexts = await listAvailableContexts(root);
            this._contexts = contexts;
            this._postMessage(createEnvelope('ContextsLoaded', { contexts }));
          }
          break;
        }

        case 'RequestAgents': {
          const root = WorkspaceState.kanbanRoot;
          if (root) {
            const agents = await listAvailableAgents(root);
            this._agents = agents;
            this._postMessage(createEnvelope('AgentsLoaded', { agents }));
          }
          break;
        }

        case 'PickFile': {
          const options: vscode.OpenDialogOptions = {
            canSelectMany: false,
            openLabel: 'Select',
            canSelectFiles: true,
            canSelectFolders: false,
          };
          const root = WorkspaceState.kanbanRoot;
          if (root) {
            options.defaultUri = vscode.Uri.file(root);
          }
          const fileUri = await vscode.window.showOpenDialog(options);
          if (fileUri && fileUri[0]) {
            const relativePath = root
              ? fileUri[0].fsPath.replace(root, '').replace(/^[/\\]/, '')
              : fileUri[0].fsPath;
            this._postMessage(createEnvelope('FilePicked', { path: relativePath }));
          }
          break;
        }

        case 'PickFolder': {
          const { requestId } = (payload as { requestId?: string }) ?? {};
          const options: vscode.OpenDialogOptions = {
            canSelectMany: false,
            openLabel: 'Select',
            canSelectFiles: false,
            canSelectFolders: true,
          };
          const root = WorkspaceState.kanbanRoot;
          if (root) {
            options.defaultUri = vscode.Uri.file(root);
          }
          const folderUri = await vscode.window.showOpenDialog(options);
          if (folderUri && folderUri[0]) {
            const relativePath = root
              ? folderUri[0].fsPath.replace(root, '').replace(/^[/\\]/, '').replace(/[/\\]$/, '')
              : folderUri[0].fsPath.replace(/[/\\]$/, '');
            this._postMessage(createEnvelope('FolderPicked', { path: relativePath, requestId }));
          }
          break;
        }
      }
    } catch (error) {
      console.error('Error handling board webview message:', error);
    }
  }

  private async _sendInitialState() {
    const kanbanRoot = WorkspaceState.kanbanRoot;
    const hasKanban = !!kanbanRoot;
    let projects: string[] = [];
    let phasesByProject: Record<string, string[]> = {};
    if (hasKanban && kanbanRoot) {
      try {
        const [tasks, contexts, agents, listing] = await Promise.all([
          loadAllTasks(kanbanRoot),
          listAvailableContexts(kanbanRoot),
          listAvailableAgents(kanbanRoot),
          listProjectsAndPhases(kanbanRoot),
        ]);
        this._tasks = tasks;
        this._contexts = contexts;
        this._agents = agents;
        projects = listing.projects;
        phasesByProject = listing.phasesByProject;
      } catch (error) {
        console.error('Error loading tasks for board:', error);
        this._tasks = [];
        this._contexts = [];
        this._agents = [];
        projects = [];
        phasesByProject = {};
      }
    } else {
      this._tasks = [];
      this._contexts = [];
      this._agents = [];
      projects = [];
      phasesByProject = {};
    }

    this._postMessage(createEnvelope('InitState', {
      context: 'board',
      hasKanban,
      tasks: this._tasks,
      contexts: this._contexts,
      agents: this._agents,
      projects,
      phasesByProject,
      workspaceRoot: kanbanRoot,
      filterState: WorkspaceState.filterState as FilterState | null ?? undefined,
    }));
  }
}

function getNonce() {
  let text = '';
  const possible = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  for (let i = 0; i < 32; i++) {
    text += possible.charAt(Math.floor(Math.random() * possible.length));
  }
  return text;
}
