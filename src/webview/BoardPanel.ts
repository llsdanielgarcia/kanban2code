import path from 'path';
import vscode from 'vscode';
import { scaffoldWorkspace } from '../workspace/scaffolder';
import { findKanbanRoot } from '../workspace/validation';
import { loadAllTasks, loadTask } from '../services/taskService';
import { moveTaskToStage } from '../services/taskMoveService';
import { archiveTask } from '../services/archiveService';
import { copyTaskContextCommand } from '../commands/copyTaskContext';
import { loadTaskTemplate } from '../services/templateService';
import { stringifyTask } from '../services/frontmatter';
import {
  HostMessageBridge,
  createTasksLoadedMessage,
  createWorkspaceStatusMessage,
  createTaskCreatedMessage,
  createTaskDeletedMessage,
  createErrorMessage,
  createFiltersSyncMessage,
} from './messaging/protocol';
import type { Task, Stage } from '../types/task';

// Shared filter state for syncing between sidebar and board
let sharedFilters: {
  search?: string;
  project?: string | null;
  tags?: string[];
  stages?: Stage[];
} = {};

// Registry for broadcasting to multiple webviews
const webviewBridges: Map<string, HostMessageBridge> = new Map();

export function broadcastFiltersSync(
  filters: typeof sharedFilters,
  excludeId?: string,
) {
  sharedFilters = { ...sharedFilters, ...filters };
  for (const [id, bridge] of webviewBridges) {
    if (id !== excludeId) {
      bridge.send(createFiltersSyncMessage(sharedFilters));
    }
  }
}

export function registerWebviewBridge(id: string, bridge: HostMessageBridge) {
  webviewBridges.set(id, bridge);
}

export function unregisterWebviewBridge(id: string) {
  webviewBridges.delete(id);
}

export class BoardPanel {
  private static currentPanel: BoardPanel | null = null;
  private readonly panel: vscode.WebviewPanel;
  private readonly extensionUri: vscode.Uri;
  private readonly context: vscode.ExtensionContext;
  private workspaceRoot: string | null;
  private messageBridge?: HostMessageBridge;
  private fileWatcher?: vscode.FileSystemWatcher;
  private readonly bridgeId = 'board';

  private constructor(
    panel: vscode.WebviewPanel,
    context: vscode.ExtensionContext,
    workspaceRoot: string | null,
  ) {
    this.panel = panel;
    this.extensionUri = context.extensionUri;
    this.context = context;
    this.workspaceRoot = workspaceRoot;

    // Set up message bridge
    this.messageBridge = new HostMessageBridge(panel.webview);
    registerWebviewBridge(this.bridgeId, this.messageBridge);
    this.setupMessageHandlers();
    this.context.subscriptions.push(this.messageBridge.subscribe());

    // Set up file watcher
    this.setupFileWatcher();

    this.panel.onDidDispose(() => {
      unregisterWebviewBridge(this.bridgeId);
      this.fileWatcher?.dispose();
      BoardPanel.currentPanel = null;
    });

    this.update();
  }

  public static async createOrShow(
    context: vscode.ExtensionContext,
    workspaceRoot?: string | null,
  ) {
    const column = vscode.window.activeTextEditor?.viewColumn;
    const root = workspaceRoot ?? (await findKanbanRoot());

    if (BoardPanel.currentPanel) {
      BoardPanel.currentPanel.workspaceRoot = root ?? null;
      BoardPanel.currentPanel.update();
      BoardPanel.currentPanel.panel.reveal(column);
      return;
    }

    const panel = vscode.window.createWebviewPanel(
      'kanban2code.board',
      'Kanban2Code Board',
      column ?? vscode.ViewColumn.One,
      {
        enableScripts: true,
        localResourceRoots: [vscode.Uri.joinPath(context.extensionUri, 'dist')],
        retainContextWhenHidden: true,
      },
    );

    BoardPanel.currentPanel = new BoardPanel(panel, context, root ?? null);
  }

  private setupMessageHandlers() {
    if (!this.messageBridge) return;

    // Handle scaffold request
    this.messageBridge.on('scaffold', async () => {
      const root = await scaffoldWorkspace();
      if (root) {
        this.workspaceRoot = root;
        vscode.window.showInformationMessage(`Scaffolded Kanban2Code workspace at ${root}`);
        await this.sendWorkspaceStatus();
        await this.loadAndSendTasks();
      }
    });

    // Handle refresh request
    this.messageBridge.on('refresh', async () => {
      this.workspaceRoot = await findKanbanRoot();
      await this.sendWorkspaceStatus();
      await this.loadAndSendTasks();
    });

    // Handle filters:changed - broadcast to other webviews
    this.messageBridge.on('filters:changed', (message) => {
      const filters = message.payload as typeof sharedFilters;
      broadcastFiltersSync(filters, this.bridgeId);
    });

    // Handle task:open request
    this.messageBridge.on('task:open', async (message) => {
      const { filePath } = message.payload as { filePath: string };
      const uri = vscode.Uri.file(filePath);
      await vscode.commands.executeCommand('vscode.open', uri);
    });

    // Handle task:move request
    this.messageBridge.on('task:move', async (message) => {
      const { filePath, newStage } = message.payload as { id: string; filePath: string; newStage: Stage };

      if (!this.workspaceRoot) {
        await this.messageBridge?.send(createErrorMessage('No workspace found'));
        return;
      }

      try {
        const task = await loadTask(filePath, this.workspaceRoot);
        await moveTaskToStage(task, newStage);

        // Reload and send all tasks
        await this.loadAndSendTasks();
      } catch (error) {
        await this.messageBridge?.send(
          createErrorMessage(error instanceof Error ? error.message : 'Failed to move task'),
        );
      }
    });

    // Handle task:create request
    this.messageBridge.on('task:create', async (message) => {
      const { title, project, phase, stage, content, tags, agent, template, parent } = message.payload as {
        title: string;
        project?: string;
        phase?: string;
        stage?: Stage;
        content?: string;
        tags?: string[];
        agent?: string;
        template?: string;
        parent?: string;
      };

      if (!this.workspaceRoot) {
        await this.messageBridge?.send(createErrorMessage('No workspace found'));
        return;
      }

      try {
        const task = await this.createTaskFile({
          title,
          project,
          phase,
          stage: stage || 'inbox',
          content,
          tags,
          agent,
          template,
          parent,
        });

        if (task) {
          await this.messageBridge?.send(createTaskCreatedMessage(task));

          // Open the file in editor
          await vscode.commands.executeCommand('vscode.open', vscode.Uri.file(task.filePath));
        }
      } catch (error) {
        await this.messageBridge?.send(
          createErrorMessage(error instanceof Error ? error.message : 'Failed to create task'),
        );
      }
    });

    // Handle task:archive request
    this.messageBridge.on('task:archive', async (message) => {
      const { id, filePath } = message.payload as { id: string; filePath: string };

      if (!this.workspaceRoot) {
        await this.messageBridge?.send(createErrorMessage('No workspace found'));
        return;
      }

      try {
        const task = await loadTask(filePath, this.workspaceRoot);

        await archiveTask(task, this.workspaceRoot);
        await this.messageBridge?.send(createTaskDeletedMessage(id, filePath));
        await this.loadAndSendTasks();
        vscode.window.showInformationMessage(`Archived: ${task.title}`);
      } catch (error) {
        await this.messageBridge?.send(
          createErrorMessage(error instanceof Error ? error.message : 'Failed to archive task'),
        );
      }
    });

    // Handle task:delete request
    this.messageBridge.on('task:delete', async (message) => {
      const { id, filePath } = message.payload as { id: string; filePath: string };

      try {
        await vscode.workspace.fs.delete(vscode.Uri.file(filePath));
        await this.messageBridge?.send(createTaskDeletedMessage(id, filePath));
        await this.loadAndSendTasks();
        vscode.window.showInformationMessage('Task deleted');
      } catch (error) {
        await this.messageBridge?.send(
          createErrorMessage(error instanceof Error ? error.message : 'Failed to delete task'),
        );
      }
    });

    // Handle context:copy request
    this.messageBridge.on('context:copy', async (message) => {
      const { filePath } = message.payload as { filePath: string };

      try {
        await copyTaskContextCommand({ taskFilePath: filePath, mode: 'full_xml' });
      } catch (error) {
        await this.messageBridge?.send(
          createErrorMessage(error instanceof Error ? error.message : 'Failed to copy context'),
        );
      }
    });
  }

  private setupFileWatcher() {
    if (!this.workspaceRoot) return;

    const watchPattern = new vscode.RelativePattern(this.workspaceRoot, '**/*.md');
    this.fileWatcher = vscode.workspace.createFileSystemWatcher(watchPattern);

    let debounceTimer: ReturnType<typeof setTimeout> | null = null;
    const debounceRefresh = () => {
      if (debounceTimer) {
        clearTimeout(debounceTimer);
      }
      debounceTimer = setTimeout(() => {
        this.loadAndSendTasks();
      }, 300);
    };

    this.fileWatcher.onDidCreate(debounceRefresh);
    this.fileWatcher.onDidChange(debounceRefresh);
    this.fileWatcher.onDidDelete(debounceRefresh);

    this.context.subscriptions.push(this.fileWatcher);
  }

  private async sendWorkspaceStatus() {
    if (!this.messageBridge) return;

    if (this.workspaceRoot) {
      await this.messageBridge.send(
        createWorkspaceStatusMessage('valid', this.workspaceRoot, `Workspace at ${this.workspaceRoot}`),
      );
    } else {
      await this.messageBridge.send(
        createWorkspaceStatusMessage('missing', null, 'No workspace detected'),
      );
    }
  }

  private async loadAndSendTasks() {
    if (!this.messageBridge || !this.workspaceRoot) return;

    try {
      const tasks = await loadAllTasks(this.workspaceRoot);
      await this.messageBridge.send(createTasksLoadedMessage(tasks));
    } catch (error) {
      await this.messageBridge.send(
        createErrorMessage(error instanceof Error ? error.message : 'Failed to load tasks'),
      );
    }
  }

  private async createTaskFile(options: {
    title: string;
    project?: string | null;
    phase?: string | null;
    stage: Stage;
    content?: string;
    tags?: string[];
    agent?: string;
    template?: string;
    parent?: string;
  }): Promise<Task | null> {
    if (!this.workspaceRoot) return null;

    const { title, project, phase, stage, content, tags, agent, template, parent } = options;

    // Generate filename
    const timestamp = Date.now();
    const slug = title
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '')
      .slice(0, 50);
    const filename = `${timestamp}-${slug}.md`;

    // Determine folder path
    let folderPath: string;
    if (project) {
      if (phase) {
        folderPath = path.join(this.workspaceRoot, 'projects', project, phase);
      } else {
        folderPath = path.join(this.workspaceRoot, 'projects', project);
      }
    } else {
      folderPath = path.join(this.workspaceRoot, 'inbox');
    }

    // Ensure folder exists
    await vscode.workspace.fs.createDirectory(vscode.Uri.file(folderPath));

    const filePath = path.join(folderPath, filename);

    // Resolve body content (template > provided content > default)
    let body = content || `\n# ${title}\n\nTask description here...\n`;
    if (template) {
      const templateContent = await loadTaskTemplate(this.workspaceRoot, template);
      if (templateContent) {
        body = templateContent;
      }
    }

    const task: Task = {
      id: path.basename(filePath, '.md'),
      filePath,
      title,
      stage,
      project: project ?? undefined,
      phase: phase ?? undefined,
      content: body,
      created: new Date().toISOString(),
      ...(agent ? { agent } : {}),
      ...(tags && tags.length ? { tags } : {}),
      ...(parent ? { parent } : {}),
    };

    const fileContent = stringifyTask(task);
    await vscode.workspace.fs.writeFile(vscode.Uri.file(filePath), Buffer.from(fileContent, 'utf8'));

    // Load it back through the parser for normalized shape
    return loadTask(filePath, this.workspaceRoot);
  }

  private async update() {
    this.panel.webview.html = this.getHtmlForWebview(this.panel.webview, this.workspaceRoot);

    // Send initial data after HTML is set
    await this.sendWorkspaceStatus();
    if (this.workspaceRoot) {
      await this.loadAndSendTasks();
    }

    // Send current filter state if any
    if (Object.keys(sharedFilters).length > 0) {
      await this.messageBridge?.send(createFiltersSyncMessage(sharedFilters));
    }
  }

  private getHtmlForWebview(webview: vscode.Webview, workspaceRoot: string | null): string {
    const scriptPathOnDisk = vscode.Uri.file(
      path.join(this.extensionUri.fsPath, 'dist', 'webview.js'),
    );
    const scriptUri = webview.asWebviewUri(scriptPathOnDisk);
    const cspSource = webview.cspSource;

    const nonce = getNonce();
    const rootAttr = workspaceRoot ? `data-kanban-root="${workspaceRoot}"` : '';

    return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta http-equiv="Content-Security-Policy" content="default-src 'none'; img-src ${cspSource} https: data:; script-src 'nonce-${nonce}' 'unsafe-eval' blob:; style-src ${cspSource} 'unsafe-inline'; worker-src blob:;" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Kanban2Code</title>
</head>
<body style="padding:0;margin:0;">
  <div id="root" ${rootAttr}></div>
  <script nonce="${nonce}" src="${scriptUri}"></script>
</body>
</html>`;
  }
}

function getNonce() {
  const possible = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  return Array.from({ length: 16 })
    .map(() => possible.charAt(Math.floor(Math.random() * possible.length)))
    .join('');
}
