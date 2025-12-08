export const workspace = {
  workspaceFolders: [],
  createFileSystemWatcher: () => ({
    onDidCreate: () => ({ dispose() {} }),
    onDidChange: () => ({ dispose() {} }),
    onDidDelete: () => ({ dispose() {} }),
    dispose() {},
  }),
  onDidRenameFiles: () => ({ dispose() {} }),
};

export class RelativePattern {
  constructor(public base: string, public pattern: string) {}
}

export const Uri = {
  file: (fsPath: string) => ({ fsPath }),
};

export default { workspace, RelativePattern, Uri };
