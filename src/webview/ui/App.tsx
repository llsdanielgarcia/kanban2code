import React, { useEffect, useState } from 'react';
import './styles/main.css';
import { Sidebar } from './components/Sidebar';
import { createMessage, type MessageEnvelope } from '../messaging';
import { vscode } from './vscodeApi';

interface InitStatePayload {
  hasKanban: boolean;
  tasks?: unknown[];
  workspaceRoot?: string;
}

export const App: React.FC = () => {
  const [hasKanban, setHasKanban] = useState<boolean | null>(null);

  useEffect(() => {
    const handler = (event: MessageEvent<MessageEnvelope>) => {
      const message = event.data;
      if (!message?.type) return;

      if (message.type === 'InitState') {
        const payload = message.payload as InitStatePayload;
        setHasKanban(payload.hasKanban ?? false);
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

  return <Sidebar hasKanban={hasKanban} />;
};
