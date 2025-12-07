import path from 'path';
import vscode from 'vscode';
import { scaffoldWorkspace } from '../workspace/scaffolder';
import { findKanbanRoot } from '../workspace/validation';

export class BoardPanel {
  private static currentPanel: BoardPanel | null = null;
  private readonly panel: vscode.WebviewPanel;
  private readonly extensionUri: vscode.Uri;
  private workspaceRoot: string | null;

  private constructor(panel: vscode.WebviewPanel, extensionUri: vscode.Uri, workspaceRoot: string | null) {
    this.panel = panel;
    this.extensionUri = extensionUri;
    this.workspaceRoot = workspaceRoot;

    this.panel.onDidDispose(() => {
      BoardPanel.currentPanel = null;
    });

    this.panel.webview.onDidReceiveMessage(async (message) => {
      if (message?.type === 'refresh-root') {
        this.refreshRoot();
      }
      if (message?.type === 'scaffold') {
        const root = await scaffoldWorkspace();
        this.workspaceRoot = root;
        this.update();
        vscode.window.showInformationMessage(`Scaffolded Kanban2Code workspace at ${root}`);
      }
    });

    this.update();
  }

  public static async createOrShow(context: vscode.ExtensionContext, workspaceRoot?: string | null) {
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
      },
    );

    BoardPanel.currentPanel = new BoardPanel(panel, context.extensionUri, root ?? null);
  }

  private async refreshRoot() {
    this.workspaceRoot = await findKanbanRoot();
    this.update();
  }

  private update() {
    this.panel.webview.html = this.getHtmlForWebview(this.panel.webview, this.workspaceRoot);
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
  <meta http-equiv="Content-Security-Policy" content="default-src 'none'; img-src ${cspSource} https: data:; script-src 'nonce-${nonce}'; style-src ${cspSource} 'unsafe-inline';" />
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
