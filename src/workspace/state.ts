export class WorkspaceState {
  private static _kanbanRoot: string | null = null;

  static get kanbanRoot(): string | null {
    return this._kanbanRoot;
  }

  static setKanbanRoot(path: string | null) {
    this._kanbanRoot = path;
  }
}
