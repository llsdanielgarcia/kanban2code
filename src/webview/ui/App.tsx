import React, { useEffect, useState } from 'react';
import './styles/main.css';
import { WebviewMessage, createMessage } from '../messaging';

declare const acquireVsCodeApi: (() => { postMessage: (message: unknown) => void }) | undefined;

const vscode = (typeof acquireVsCodeApi === 'function' ? acquireVsCodeApi() : undefined);

export const App: React.FC = () => {
  const [status, setStatus] = useState('Waiting for host...');

  useEffect(() => {
    const handler = (event: MessageEvent<WebviewMessage>) => {
      const message = event.data;
      if (!message?.type) return;
      if (message.type === 'INIT') {
        setStatus('Connected to extension host');
      } else if (message.type === 'UPDATE_STATE') {
        setStatus(`State updated: ${JSON.stringify(message.payload)}`);
      }
    };

    window.addEventListener('message', handler);
    return () => window.removeEventListener('message', handler);
  }, []);

  const sendAlert = () => {
    const msg = createMessage('ALERT', { text: 'Hello from Kanban2Code webview' });
    vscode?.postMessage(msg);
  };

  return (
    <div className="container">
      <div className="sidebar">
        <h2>Sidebar</h2>
        <div className="card">Inbox</div>
        <div className="card">Projects</div>
        <div className="card">
          <p className="status-label">Status: {status}</p>
          <button className="ghost-button" onClick={sendAlert}>
            Ping Extension
          </button>
        </div>
      </div>
      <div className="board">
        <h1>Kanban Board</h1>
        <div className="card">
          <h3>Welcome to Kanban2Code</h3>
          <p>This is a placeholder for the board view.</p>
        </div>
      </div>
    </div>
  );
};
