import path from 'path';
import vscode from 'vscode';
import { openBoardCommand } from '../commands/openBoard';
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
} from './messaging/protocol';
import { broadcastFiltersSync, registerWebviewBridge, unregisterWebviewBridge } from './BoardPanel';
import type { Task, Stage } from '../types/task';

export class SidebarProvider implements vscode.WebviewViewProvider {
  public static readonly viewType = 'kanban2code.sidebar';
  private view?: vscode.WebviewView;
  private workspaceRoot: string | null = null;
  private messageBridge?: HostMessageBridge;
  private fileWatcher?: vscode.FileSystemWatcher;
  private readonly bridgeId = 'sidebar';

  constructor(private readonly context: vscode.ExtensionContext) {}

  async resolveWebviewView(webviewView: vscode.WebviewView): Promise<void> {
    this.view = webviewView;
    this.workspaceRoot = await findKanbanRoot();

    webviewView.webview.options = {
      enableScripts: true,
      localResourceRoots: [vscode.Uri.joinPath(this.context.extensionUri, 'dist')],
    };

    // Set up message bridge
    this.messageBridge = new HostMessageBridge(webviewView.webview);
    registerWebviewBridge(this.bridgeId, this.messageBridge);
    this.setupMessageHandlers();
    this.context.subscriptions.push(this.messageBridge.subscribe());

    // Set up file watcher for auto-refresh
    this.setupFileWatcher();

    // Render the webview
    webviewView.webview.html = this.getHtmlForWebview(webviewView.webview);

    // Send initial data
    await this.sendInitialData();

    // Clean up on dispose
    webviewView.onDidDispose(() => {
      unregisterWebviewBridge(this.bridgeId);
      this.fileWatcher?.dispose();
    });
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

    // Handle open board request
    this.messageBridge.on('openBoard', async () => {
      await openBoardCommand(this.context);
    });

    // Handle refresh request
    this.messageBridge.on('refresh', async () => {
      this.workspaceRoot = await findKanbanRoot();
      await this.sendWorkspaceStatus();
      await this.loadAndSendTasks();
    });

    // Filters changed - broadcast to other webviews
    this.messageBridge.on('filters:changed', (message) => {
      const filters = message.payload as {
        search?: string;
        project?: string | null;
        tags?: string[];
        stages?: Stage[];
      };
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

    // Handle task:moveLocation request (repath task)
    this.messageBridge.on('task:moveLocation', async (message) => {
      const { filePath } = message.payload as { filePath: string };
      if (!this.workspaceRoot) {
        await this.messageBridge?.send(createErrorMessage('No workspace found'));
        return;
      }

      try {
        const projectsRoot = path.join(this.workspaceRoot, 'projects');
        const projectEntries = await vscode.workspace.fs
          .readDirectory(vscode.Uri.file(projectsRoot))
          .catch(() => []) as [string, vscode.FileType][];
        const projects = projectEntries
          .filter(([, type]) => type === vscode.FileType.Directory)
          .map(([name]) => name)
          .sort();

        const projectPick = await vscode.window.showQuickPick(
          [
            { label: 'Inbox', description: 'Move to inbox', value: '__inbox__' },
            ...projects.map((p) => ({ label: p, value: p })),
            { label: 'New project…', value: '__new__' },
          ],
          { placeHolder: 'Select destination project' },
        );
        if (!projectPick) return;

        let targetProject: string | null = null;
        if (projectPick.value === '__inbox__') {
          targetProject = null;
        } else if (projectPick.value === '__new__') {
          const name = await vscode.window.showInputBox({
            prompt: 'Enter new project folder name',
            validateInput: (val) => (val.trim() ? undefined : 'Project name is required'),
          });
          if (!name) return;
          targetProject = name.trim();
        } else {
          targetProject = projectPick.value;
        }

        let targetPhase: string | null = null;
        if (targetProject) {
          const phasesRoot = path.join(this.workspaceRoot, 'projects', targetProject);
          const phaseEntries = await vscode.workspace.fs
            .readDirectory(vscode.Uri.file(phasesRoot))
            .catch(() => []) as [string, vscode.FileType][];
          const phases = phaseEntries
            .filter(([, type]) => type === vscode.FileType.Directory)
            .map(([name]) => name)
            .sort();
          const phasePick = await vscode.window.showQuickPick(
            [
              { label: 'No phase', value: '' },
              ...phases.map((p) => ({ label: p, value: p })),
              { label: 'New phase…', value: '__new__' },
            ],
            { placeHolder: 'Select phase (optional)' },
          );
          if (!phasePick) return;
          if (phasePick.value === '__new__') {
            const phaseName = await vscode.window.showInputBox({
              prompt: 'Enter new phase folder name',
            });
            if (!phaseName) return;
            targetPhase = phaseName.trim();
          } else if (phasePick.value) {
            targetPhase = phasePick.value;
          }
        }

        const targetDir = targetProject
          ? path.join(this.workspaceRoot, 'projects', targetProject, ...(targetPhase ? [targetPhase] : []))
          : path.join(this.workspaceRoot, 'inbox');

        const targetPath = path.join(targetDir, path.basename(filePath));
        if (targetPath === filePath) {
          vscode.window.showInformationMessage('Task is already in the selected location.');
          return;
        }

        await vscode.workspace.fs.createDirectory(vscode.Uri.file(targetDir));
        await vscode.workspace.fs.rename(vscode.Uri.file(filePath), vscode.Uri.file(targetPath), {
          overwrite: false,
        });

        await this.loadAndSendTasks();
        vscode.window.showInformationMessage('Task moved.');
      } catch (error) {
        await this.messageBridge?.send(
          createErrorMessage(error instanceof Error ? error.message : 'Failed to move task'),
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

  private async sendInitialData() {
    await this.sendWorkspaceStatus();
    if (this.workspaceRoot) {
      await this.loadAndSendTasks();
    }
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

  private getHtmlForWebview(webview: vscode.Webview): string {
    const scriptPathOnDisk = vscode.Uri.file(
      path.join(this.context.extensionUri.fsPath, 'dist', 'sidebar.js'),
    );
    const scriptUri = webview.asWebviewUri(scriptPathOnDisk);
    const cspSource = webview.cspSource;

    const nonce = getNonce();
    const rootAttr = this.workspaceRoot ? `data-kanban-root="${this.workspaceRoot}"` : '';

    return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta http-equiv="Content-Security-Policy" content="default-src 'none'; img-src ${cspSource} https: data:; script-src 'nonce-${nonce}' 'unsafe-eval' blob:; style-src ${cspSource} 'unsafe-inline'; font-src ${cspSource};" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Kanban2Code Sidebar</title>
  <style>
    body {
      margin: 0;
      padding: 0;
      background: transparent;
      overflow: hidden;
    }
    #root {
      height: 100vh;
    }
  </style>
</head>
<body>
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
