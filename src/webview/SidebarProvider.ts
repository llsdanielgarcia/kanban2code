import * as vscode from 'vscode';
import { WorkspaceState } from '../workspace/state';
import { findKanbanRoot } from '../workspace/validation';

export class SidebarProvider implements vscode.WebviewViewProvider {
  public static readonly viewType = 'kanban2code.sidebar';
  private _view?: vscode.WebviewView;

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
      localResourceRoots: [this._extensionUri],
    };

    webviewView.webview.html = this._getHtmlForWebview(webviewView.webview);

    webviewView.webview.onDidReceiveMessage(async (data) => {
      switch (data.command) {
        case 'scaffold': {
          await vscode.commands.executeCommand('kanban2code.scaffoldWorkspace');
          await this.refreshStateAndView();
          break;
        }
      }
    });
  }

  private _getHtmlForWebview(webview: vscode.Webview) {
    // Check if we have an active Kanban root
    const isActive = !!WorkspaceState.kanbanRoot;
    const cspSource = webview.cspSource;

    if (!isActive) {
      return `<!DOCTYPE html>
      <html lang="en">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <meta http-equiv="Content-Security-Policy" content="default-src 'none'; style-src ${cspSource}; script-src 'unsafe-inline';">
        <title>Kanban2Code</title>
        <style>
          body { font-family: var(--vscode-font-family); padding: 10px; }
          button { 
            background: var(--vscode-button-background); 
            color: var(--vscode-button-foreground); 
            border: none; padding: 8px 12px; cursor: pointer; width: 100%;
          }
          button:hover { background: var(--vscode-button-hoverBackground); }
        </style>
      </head>
      <body>
        <p>No Kanban board found.</p>
        <button onclick="create()">Create Kanban</button>
        <script>
          const vscode = acquireVsCodeApi();
          function create() {
            vscode.postMessage({ command: 'scaffold' });
          }
        </script>
      </body>
      </html>`;
    }

    return `<!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <meta http-equiv="Content-Security-Policy" content="default-src 'none'; style-src ${cspSource}; script-src 'unsafe-inline';">
      <title>Kanban2Code</title>
    </head>
    <body>
      <h3>Kanban Sidebar</h3>
      <p>Loaded.</p>
    </body>
    </html>`;
  }

  private async refreshStateAndView() {
    const kanbanRoot = await this.detectKanbanRoot();
    WorkspaceState.setKanbanRoot(kanbanRoot);
    await vscode.commands.executeCommand('setContext', 'kanban2code:isActive', !!kanbanRoot);

    if (this._view) {
      this._view.webview.html = this._getHtmlForWebview(this._view.webview);
    }
  }

  private async detectKanbanRoot(): Promise<string | null> {
    const workspaceFolders = vscode.workspace.workspaceFolders || [];
    for (const folder of workspaceFolders) {
      const root = await findKanbanRoot(folder.uri.fsPath);
      if (root) return root;
    }
    return null;
  }
}
