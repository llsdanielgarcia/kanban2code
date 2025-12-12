// Shared VS Code API instance - must only be acquired once per webview
declare const acquireVsCodeApi: (() => { postMessage: (message: unknown) => void }) | undefined;

export const vscode = typeof acquireVsCodeApi === 'function' ? acquireVsCodeApi() : undefined;
