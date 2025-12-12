import * as vscode from 'vscode';
import { WorkspaceState } from '../workspace/state';
import { findKanbanRoot } from '../workspace/validation';
import { loadAllTasks, findTaskById } from '../services/scanner';
import { createEnvelope, validateEnvelope, type MessageEnvelope } from './messaging';
import type { Task } from '../types/task';
import type { Stage } from '../types/task';
import type { FilterState } from '../types/filters';
import { changeStageAndReload, moveTaskToLocation, type TaskLocation } from '../services/stage-manager';
import { archiveTask } from '../services/archive';
import { loadTaskTemplates, type TaskTemplate } from '../services/template';
import { KanbanPanel } from './KanbanPanel';
import { listProjectsAndPhases } from '../services/projects';

export class SidebarProvider implements vscode.WebviewViewProvider {
  public static readonly viewType = 'kanban2code.sidebar';
  private _view?: vscode.WebviewView;
  private _tasks: Task[] = [];
  private _templates: TaskTemplate[] = [];
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

        case 'CopyContext': {
          const { taskId, mode } = payload as { taskId: string; mode: string };
          await vscode.commands.executeCommand('kanban2code.copyTaskContext', taskId, mode);
          break;
        }

        case 'CreateProject':
          await vscode.commands.executeCommand('kanban2code.newProject');
          break;

        case 'CreateContext':
          await vscode.commands.executeCommand('kanban2code.newContext');
          break;

        case 'CreateAgent':
          await vscode.commands.executeCommand('kanban2code.newAgent');
          break;

        case 'CreateTemplate':
          await vscode.commands.executeCommand('kanban2code.newTemplate');
          break;

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
          const { taskId } = payload as { taskId: string };
          const root = WorkspaceState.kanbanRoot;
          if (root && taskId) {
            const task = await findTaskById(root, taskId);
            if (task) {
              await vscode.workspace.fs.delete(vscode.Uri.file(task.filePath));
              await this._sendInitialState();
            }
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
        const [tasks, templates, listing] = await Promise.all([
          loadAllTasks(kanbanRoot),
          loadTaskTemplates(kanbanRoot),
          listProjectsAndPhases(kanbanRoot),
        ]);
        this._tasks = tasks;
        this._templates = templates;
        projects = listing.projects;
        phasesByProject = listing.phasesByProject;
      } catch (error) {
        console.error('Error loading tasks:', error);
        this._tasks = [];
        this._templates = [];
        projects = [];
        phasesByProject = {};
      }
    } else {
      this._tasks = [];
      this._templates = [];
      projects = [];
      phasesByProject = {};
    }

    this._postMessage(createEnvelope('InitState', {
      context: 'sidebar',
      hasKanban,
      tasks: this._tasks,
      templates: this._templates,
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

    const nonce = getNonce();

    return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta http-equiv="Content-Security-Policy" content="default-src 'none'; style-src ${webview.cspSource} 'unsafe-inline'; script-src ${webview.cspSource} 'nonce-${nonce}';">
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
