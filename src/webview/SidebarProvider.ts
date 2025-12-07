import vscode from 'vscode';
import { openBoardCommand } from '../commands/openBoard';
import { scaffoldWorkspace } from '../workspace/scaffolder';
import { findKanbanRoot } from '../workspace/validation';

export class SidebarProvider implements vscode.WebviewViewProvider {
  public static readonly viewType = 'kanban2code.sidebar';
  private view?: vscode.WebviewView;

  constructor(private readonly context: vscode.ExtensionContext) {}

  async resolveWebviewView(webviewView: vscode.WebviewView): Promise<void> {
    this.view = webviewView;
    webviewView.webview.options = {
      enableScripts: true,
    };

    webviewView.webview.onDidReceiveMessage(async (message) => {
      if (message?.type === 'scaffold') {
        const root = await scaffoldWorkspace();
        vscode.window.showInformationMessage(`Scaffolded Kanban2Code workspace at ${root}`);
        await this.render();
      }
      if (message?.type === 'openBoard') {
        await openBoardCommand(this.context);
      }
    });

    await this.render();
  }

  private async render() {
    if (!this.view) return;
    const root = await findKanbanRoot();
    this.view.webview.html = this.getHtml(this.view.webview, root);
  }

  private getHtml(webview: vscode.Webview, root: string | null): string {
    const cspSource = webview.cspSource;
    const nonce = getNonce();

    const status = root
      ? `<div class="status status--ok">Workspace detected at <code>${root}</code></div>`
      : '<div class="status status--warn">No .kanban2code workspace found.</div>';

    const primaryAction = root
      ? '<button id="openBoard" class="btn">Open Board</button>'
      : '<button id="scaffold" class="btn">Scaffold Workspace</button>';

    return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta http-equiv="Content-Security-Policy" content="default-src 'none'; img-src ${cspSource} https:; script-src 'nonce-${nonce}'; style-src ${cspSource} 'unsafe-inline';" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <style nonce="${nonce}">
    body { font-family: ui-sans-serif, system-ui, -apple-system, sans-serif; padding: 12px; color: #e5e7eb; background: linear-gradient(135deg, #0f172a, #111827); }
    h2 { margin: 0 0 8px; font-size: 14px; letter-spacing: 0.02em; text-transform: uppercase; color: #a5b4fc; }
    .card { border: 1px solid #1f2937; border-radius: 8px; padding: 12px; background: rgba(255,255,255,0.03); box-shadow: 0 10px 30px rgba(0,0,0,0.35); }
    .status { margin-bottom: 8px; padding: 8px 10px; border-radius: 6px; font-size: 12px; }
    .status--ok { background: rgba(16, 185, 129, 0.1); color: #6ee7b7; border: 1px solid rgba(16,185,129,0.2); }
    .status--warn { background: rgba(248, 113, 113, 0.1); color: #fca5a5; border: 1px solid rgba(248,113,113,0.2); }
    .btn { width: 100%; margin-top: 8px; padding: 10px; border: none; border-radius: 6px; background: linear-gradient(120deg, #7c3aed, #2563eb); color: white; font-weight: 600; cursor: pointer; }
    .btn:hover { filter: brightness(1.05); }
    .hint { margin-top: 10px; font-size: 12px; color: #9ca3af; }
    code { color: #d1d5db; }
  </style>
</head>
<body>
  <div class="card">
    <h2>Kanban2Code</h2>
    ${status}
    ${primaryAction}
    <div class="hint">Use the command palette to run Kanban2Code commands anytime.</div>
  </div>
  <script nonce="${nonce}">
    const vscode = acquireVsCodeApi();
    const btn = document.getElementById('${root ? 'openBoard' : 'scaffold'}');
    if (btn) {
      btn.addEventListener('click', () => {
        vscode.postMessage({ type: '${root ? 'openBoard' : 'scaffold'}' });
      });
    }
  </script>
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
