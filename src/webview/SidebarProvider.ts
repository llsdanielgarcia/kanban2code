import * as vscode from 'vscode';
import { WorkspaceState } from '../workspace/state';
import { findKanbanRoot } from '../workspace/validation';
import { loadAllTasks, findTaskById } from '../services/scanner';
import { createEnvelope, parseDeleteTaskPayload, validateEnvelope, type MessageEnvelope } from './messaging';
import type { Task } from '../types/task';
import type { Stage } from '../types/task';
import type { FilterState } from '../types/filters';
import { changeStageAndReload, moveTaskToLocation, type TaskLocation } from '../services/stage-manager';
import { archiveTask } from '../services/archive';
import { loadTaskTemplates, createTaskTemplate, updateTaskTemplate, type TaskTemplate } from '../services/template';
import { listAvailableContexts, listAvailableAgents, createContextFile, createAgentFile, type ContextFile, type Agent } from '../services/context';
import { KanbanPanel } from './KanbanPanel';
import { listProjectsAndPhases } from '../services/projects';
import { deleteTaskById } from '../services/delete-task';
import { loadTaskContentById, saveTaskContentById } from '../services/task-content';

export class SidebarProvider implements vscode.WebviewViewProvider {
  public static readonly viewType = 'kanban2code.sidebar';
  private _view?: vscode.WebviewView;
  private _tasks: Task[] = [];
  private _templates: TaskTemplate[] = [];
  private _contexts: ContextFile[] = [];
  private _agents: Agent[] = [];
  private _filterState: FilterState | null = null;

  constructor(private readonly _extensionUri: vscode.Uri) {}

  public resolveWebviewView(
    webviewView: vscode.WebviewView,
    _context: vscode.WebviewViewResolveContext,
    _token: vscode.CancellationToken,
  ) {
    void _context;
    void _token;
    this._view = webviewView;

    webviewView.webview.options = {
      enableScripts: true,
      localResourceRoots: [
        vscode.Uri.joinPath(this._extensionUri, 'dist'),
        vscode.Uri.joinPath(this._extensionUri, 'docs', 'design', 'styles'),
      ],
    };

    webviewView.webview.html = this._getWebviewContent(webviewView.webview);

    // Handle messages from webview
    webviewView.webview.onDidReceiveMessage(async (data) => {
      await this._handleWebviewMessage(data);
    });

    // Send initial state when view becomes visible
    webviewView.onDidChangeVisibility(() => {
      if (webviewView.visible) {
        this._sendInitialState();
      }
    });

    // Send initial state
    this._sendInitialState();
  }

  private async _handleWebviewMessage(data: unknown) {
    try {
      const envelope = validateEnvelope(data);
      const { type, payload } = envelope;

      switch (type) {
        case 'FilterChanged': {
          const { filters } = payload as { filters: FilterState };
          if (filters) {
            this._filterState = filters;
            WorkspaceState.setFilterState(filters);
            KanbanPanel.currentPanel?.postFilterState(filters);
          }
          break;
        }

        case 'CreateKanban':
          await vscode.commands.executeCommand('kanban2code.scaffoldWorkspace');
          await this._refreshStateAndView();
          break;

        case 'OpenBoard':
          await vscode.commands.executeCommand('kanban2code.openBoard');
          break;

        case 'OpenSettings':
          await vscode.commands.executeCommand('kanban2code.openSettings');
          break;

        case 'CreateTask': {
          await vscode.commands.executeCommand('kanban2code.newTask', payload);
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
            KanbanPanel.currentPanel?.updateTasks(tasks);
            this._postMessage(createEnvelope('TaskContentSaved', { taskId }));
          } catch (error) {
            const message = error instanceof Error ? error.message : 'Unknown error';
            vscode.window.showErrorMessage(`Failed to save task: ${message}`);
            this._postMessage(createEnvelope('TaskContentSaveFailed', { taskId, error: message }));
          }
          break;
        }

        case 'CopyContext': {
          const { taskId, mode } = payload as { taskId: string; mode: string };
          await vscode.commands.executeCommand('kanban2code.copyTaskContext', taskId, mode);
          break;
        }

        case 'CreateProject':
          await vscode.commands.executeCommand('kanban2code.newProject');
          break;

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
          } else {
            await vscode.commands.executeCommand('kanban2code.newContext');
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
          } else {
            await vscode.commands.executeCommand('kanban2code.newAgent');
          }
          break;
        }

        case 'CreateTemplate': {
          const templatePayload = payload as {
            name?: string;
            description?: string;
            icon?: string;
            defaultStage?: Stage;
            defaultTags?: string[];
            content?: string;
          };
          if (templatePayload.name) {
            const root = WorkspaceState.kanbanRoot;
            if (root) {
              try {
                await createTaskTemplate(root, {
                  name: templatePayload.name,
                  description: templatePayload.description || '',
                  icon: templatePayload.icon,
                  defaultStage: templatePayload.defaultStage,
                  defaultTags: templatePayload.defaultTags,
                  content: templatePayload.content || '',
                });
                await this._sendInitialState();
              } catch (error) {
                vscode.window.showErrorMessage(`Failed to create template: ${error instanceof Error ? error.message : 'Unknown error'}`);
              }
            }
          } else {
            await vscode.commands.executeCommand('kanban2code.newTemplate');
          }
          break;
        }

        case 'UpdateTemplate': {
          const updatePayload = payload as {
            templateId: string;
            name?: string;
            description?: string;
            icon?: string;
            defaultStage?: Stage;
            defaultTags?: string[];
            content?: string;
          };
          if (updatePayload.templateId) {
            const root = WorkspaceState.kanbanRoot;
            if (root) {
              try {
                await updateTaskTemplate(root, updatePayload.templateId, {
                  name: updatePayload.name,
                  description: updatePayload.description,
                  icon: updatePayload.icon,
                  defaultStage: updatePayload.defaultStage,
                  defaultTags: updatePayload.defaultTags,
                  content: updatePayload.content,
                });
                await this._sendInitialState();
              } catch (error) {
                vscode.window.showErrorMessage(`Failed to update template: ${error instanceof Error ? error.message : 'Unknown error'}`);
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

        case 'MoveTask': {
          const { taskId, toStage, newStage } = payload as { taskId: string; toStage?: Stage; newStage?: Stage };
          const stage = toStage ?? newStage;
          if (stage) {
            await changeStageAndReload(taskId, stage);
          }
          await this._sendInitialState();
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
            KanbanPanel.currentPanel?.updateTasks(tasks);
          }
          break;
        }

        case 'MoveTaskToLocation': {
          const { taskId, location } = payload as { taskId: string; location: TaskLocation };
          try {
            await moveTaskToLocation(taskId, location);
            await this._sendInitialState();
          } catch (error) {
            vscode.window.showErrorMessage(`Failed to move task: ${error instanceof Error ? error.message : 'Unknown error'}`);
          }
          break;
        }

        case 'ALERT': {
          const text = (payload as { text?: string })?.text ?? 'Alert from Kanban2Code';
          vscode.window.showInformationMessage(text);
          break;
        }

        case 'RequestState': {
          // Webview is ready and requesting initial state
          await this._sendInitialState();
          break;
        }
      }
    } catch (error) {
      console.error('Error handling webview message:', error);
    }
  }

  private async _sendInitialState() {
    const kanbanRoot = WorkspaceState.kanbanRoot;
    const hasKanban = !!kanbanRoot;
    let projects: string[] = [];
    let phasesByProject: Record<string, string[]> = {};

    if (hasKanban && kanbanRoot) {
      try {
        const [tasks, templates, contexts, agents, listing] = await Promise.all([
          loadAllTasks(kanbanRoot),
          loadTaskTemplates(kanbanRoot),
          listAvailableContexts(kanbanRoot),
          listAvailableAgents(kanbanRoot),
          listProjectsAndPhases(kanbanRoot),
        ]);
        this._tasks = tasks;
        this._templates = templates;
        this._contexts = contexts;
        this._agents = agents;
        projects = listing.projects;
        phasesByProject = listing.phasesByProject;
      } catch (error) {
        console.error('Error loading tasks:', error);
        this._tasks = [];
        this._templates = [];
        this._contexts = [];
        this._agents = [];
        projects = [];
        phasesByProject = {};
      }
    } else {
      this._tasks = [];
      this._templates = [];
      this._contexts = [];
      this._agents = [];
      projects = [];
      phasesByProject = {};
    }

    this._postMessage(createEnvelope('InitState', {
      context: 'sidebar',
      hasKanban,
      tasks: this._tasks,
      templates: this._templates,
      contexts: this._contexts,
      agents: this._agents,
      projects,
      phasesByProject,
      workspaceRoot: kanbanRoot,
      filterState: this._filterState ?? (WorkspaceState.filterState as FilterState | null) ?? undefined,
    }));
  }

  public async refresh() {
    await this._sendInitialState();
  }

  public updateTasks(tasks: Task[]) {
    this._tasks = tasks;
    this._postMessage(createEnvelope('TaskUpdated', { tasks }));
  }

  public showKeyboardShortcuts() {
    this._postMessage(createEnvelope('ShowKeyboardShortcuts', {}));
  }

  private _getWebviewContent(webview: vscode.Webview) {
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
    <link rel="stylesheet" href="${styleUri}">
    <title>Kanban2Code</title>
</head>
<body>
    <div id="root">
        <!-- This text will be replaced by React when it mounts -->
        <div style="padding: 20px; color: #ccc;">
            <p>Loading webview...</p>
            <p style="font-size: 10px; opacity: 0.6;">If you see this for more than 2 seconds, check the console for errors.</p>
        </div>
    </div>
    <script nonce="${nonce}">window.__KANBAN2CODE_DIST_URI__ = "${distUri}";</script>
    <script nonce="${nonce}" src="${scriptUri}"></script>
</body>
</html>`;
  }

  private _postMessage(message: MessageEnvelope) {
    this._view?.webview.postMessage(message);
  }

  private async _refreshStateAndView() {
    const kanbanRoot = await this._detectKanbanRoot();
    WorkspaceState.setKanbanRoot(kanbanRoot);
    await vscode.commands.executeCommand('setContext', 'kanban2code:isActive', !!kanbanRoot);
    await this._sendInitialState();
  }

  private async _detectKanbanRoot(): Promise<string | null> {
    const workspaceFolders = vscode.workspace.workspaceFolders || [];
    for (const folder of workspaceFolders) {
      const root = await findKanbanRoot(folder.uri.fsPath);
      if (root) return root;
    }
    return null;
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
