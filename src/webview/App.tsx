import React from 'react';

interface AppProps {
  kanbanRoot: string | null;
  vscode: { postMessage: (message: unknown) => void };
}

const columns = [
  { key: 'inbox', title: 'Inbox', description: 'Capture everything fast.', color: '#38bdf8' },
  { key: 'plan', title: 'Plan', description: 'Shape the work and scope.', color: '#a78bfa' },
  { key: 'code', title: 'Code', description: 'Ship changes with focus.', color: '#fbbf24' },
  { key: 'audit', title: 'Audit', description: 'Verify, test, review.', color: '#34d399' },
  { key: 'completed', title: 'Done', description: 'Archive once shipped.', color: '#60a5fa' },
];

export function App({ kanbanRoot, vscode }: AppProps) {
  return (
    <div className="app">
      <style>{styles}</style>
      <header className="hero">
        <div>
          <p className="eyebrow">Kanban2Code</p>
          <h1>Control tower for your tasks</h1>
          <p className="lede">
            {kanbanRoot
              ? `Workspace detected at ${kanbanRoot}.`
              : 'No .kanban2code workspace detected. Scaffold one to get started.'}
          </p>
          <div className="actions">
            <button className="btn primary" onClick={() => vscode.postMessage({ type: 'refresh-root' })}>
              Refresh workspace
            </button>
            <button className="btn ghost" onClick={() => vscode.postMessage({ type: 'scaffold' })}>
              Scaffold workspace
            </button>
          </div>
        </div>
      </header>

      <section className="board">
        {columns.map((column) => (
          <div key={column.key} className="column" style={{ borderColor: column.color }}>
            <div className="dot" style={{ background: column.color }} />
            <h3>{column.title}</h3>
            <p>{column.description}</p>
          </div>
        ))}
      </section>
    </div>
  );
}

const styles = `
:root {
  color-scheme: dark;
}
* { box-sizing: border-box; }
body { margin: 0; font-family: 'Inter', ui-sans-serif, system-ui, -apple-system, sans-serif; background: radial-gradient(circle at 20% 20%, rgba(124,58,237,0.15), transparent 25%), radial-gradient(circle at 80% 0%, rgba(56,189,248,0.12), transparent 22%), #0b1220; color: #e5e7eb; }
.app { padding: 24px; }
.hero { margin-bottom: 18px; }
.eyebrow { text-transform: uppercase; letter-spacing: 0.08em; color: #a5b4fc; font-weight: 700; font-size: 11px; margin: 0 0 4px; }
h1 { margin: 0 0 8px; font-size: 24px; }
.lede { margin: 0 0 10px; color: #cbd5f5; }
.actions { display: flex; gap: 8px; flex-wrap: wrap; }
.btn { border: 1px solid rgba(255,255,255,0.1); border-radius: 8px; padding: 10px 14px; font-weight: 600; cursor: pointer; color: #e5e7eb; background: rgba(255,255,255,0.04); }
.btn.primary { background: linear-gradient(120deg, #7c3aed, #2563eb); border: none; }
.btn.ghost { background: transparent; }
.btn:hover { filter: brightness(1.05); }
.board { display: grid; grid-template-columns: repeat(auto-fit, minmax(180px, 1fr)); gap: 12px; }
.column { border: 1px solid #1f2937; border-radius: 12px; padding: 14px; background: rgba(255,255,255,0.03); box-shadow: 0 10px 30px rgba(0,0,0,0.2); }
.column h3 { margin: 6px 0; }
.column p { margin: 0; color: #94a3b8; font-size: 13px; }
.dot { width: 8px; height: 8px; border-radius: 50%; }
`;
