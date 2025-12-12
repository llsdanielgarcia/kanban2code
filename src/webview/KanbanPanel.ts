import * as vscode from 'vscode';
import { createEnvelope, validateEnvelope, type MessageEnvelope } from './messaging';
import { WorkspaceState } from '../workspace/state';
import { findTaskById, loadAllTasks } from '../services/scanner';
import { changeStageAndReload } from '../services/stage-manager';
import { archiveTask } from '../services/archive';
import { loadTaskTemplates } from '../services/template';
import { listProjectsAndPhases } from '../services/projects';
import type { Task, Stage } from '../types/task';
import type { FilterState } from '../types/filters';

export class KanbanPanel {
  public static currentPanel: KanbanPanel | undefined;
  private readonly _panel: vscode.WebviewPanel;
  private readonly _extensionUri: vscode.Uri;
  private _disposables: vscode.Disposable[] = [];
  private _tasks: Task[] = [];
  private _templates: unknown[] = [];
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

    const nonce = getNonce();

    return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta http-equiv="Content-Security-Policy" content="default-src 'none'; style-src ${webview.cspSource}; script-src ${webview.cspSource} 'nonce-${nonce}';">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <link href="${styleUri}" rel="stylesheet">
    <title>Kanban Board</title>
</head>
<body>
    <div id="root"></div>
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

        case 'OpenTask': {
          const { filePath } = payload as { filePath: string };
          if (filePath) {
            const doc = await vscode.workspace.openTextDocument(vscode.Uri.file(filePath));
            await vscode.window.showTextDocument(doc);
          }
          break;
        }

        case 'ALERT': {
          const text = (payload as { text?: string })?.text ?? 'Alert from Kanban2Code';
          vscode.window.showInformationMessage(text);
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
        console.error('Error loading tasks for board:', error);
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
      context: 'board',
      hasKanban,
      tasks: this._tasks,
      templates: this._templates,
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
