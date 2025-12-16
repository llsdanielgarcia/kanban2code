import React, { useEffect, useState } from 'react';
import './styles/main.css';
import { Sidebar } from './components/Sidebar';
import { Board } from './components/Board';
import { createMessage, type MessageEnvelope } from '../messaging';
import { vscode } from './vscodeApi';

interface InitStatePayload {
  hasKanban: boolean;
  tasks?: unknown[];
  workspaceRoot?: string;
  context?: 'sidebar' | 'board';
}

export const App: React.FC = () => {
  const [hasKanban, setHasKanban] = useState<boolean | null>(null);
  const [context, setContext] = useState<'sidebar' | 'board'>('sidebar');
  const [showKeyboardShortcutsNonce, setShowKeyboardShortcutsNonce] = useState(0);
  const [toggleLayoutNonce, setToggleLayoutNonce] = useState(0);
  const [openTaskModalNonce, setOpenTaskModalNonce] = useState(0);

  useEffect(() => {
    const handler = (event: MessageEvent<MessageEnvelope>) => {
      const message = event.data;
      if (!message?.type) return;

      if (message.type === 'InitState') {
        const payload = message.payload as InitStatePayload;
        setHasKanban(payload.hasKanban ?? false);
        setContext(payload.context ?? 'sidebar');
      }

      if (message.type === 'ShowKeyboardShortcuts') {
        setShowKeyboardShortcutsNonce((n) => n + 1);
      }

      if (message.type === 'ToggleLayout') {
        setToggleLayoutNonce((n) => n + 1);
      }

      if (message.type === 'OpenTaskModal') {
        setOpenTaskModalNonce((n) => n + 1);
      }
    };

    window.addEventListener('message', handler);

    // Request initial state from host now that we're ready
    if (vscode) {
      vscode.postMessage(createMessage('RequestState', {}));
    }

    return () => window.removeEventListener('message', handler);
  }, []);

  // Initial loading state before we know if kanban exists
  if (hasKanban === null) {
    return (
      <div className="sidebar glass-panel">
        <div className="sidebar-toolbar">
          <span className="sidebar-title">Kanban2Code</span>
        </div>
        <div className="sidebar-loading">
          <div className="loading-spinner" />
          <span>Initializing...</span>
        </div>
      </div>
    );
  }

  return context === 'board'
    ? (
      <Board
        hasKanban={hasKanban}
        showKeyboardShortcutsNonce={showKeyboardShortcutsNonce}
        toggleLayoutNonce={toggleLayoutNonce}
      />
    )
    : (
      <Sidebar
        hasKanban={hasKanban}
        showKeyboardShortcutsNonce={showKeyboardShortcutsNonce}
        openTaskModalNonce={openTaskModalNonce}
      />
    );
};
