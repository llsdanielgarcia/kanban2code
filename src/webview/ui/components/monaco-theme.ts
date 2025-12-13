import type * as Monaco from 'monaco-editor';

export const NAVY_NIGHT_MONACO_THEME = 'k2c-navy-night';

export function defineNavyNightTheme(monaco: typeof Monaco): void {
  monaco.editor.defineTheme(NAVY_NIGHT_MONACO_THEME, {
    base: 'vs-dark',
    inherit: true,
    rules: [
      { token: 'comment', foreground: '5d6b85' },
      { token: 'string', foreground: '60a5fa' },
      { token: 'keyword', foreground: '3b82f6' },
      { token: 'number', foreground: 'facc15' },
      { token: 'delimiter', foreground: '9aa4b2' },
      { token: 'type', foreground: '22c55e' },
    ],
    colors: {
      'editor.background': '#0d111c',
      'editor.foreground': '#f8fafc',
      'editorLineNumber.foreground': '#5d6b85',
      'editorLineNumber.activeForeground': '#f8fafc',
      'editorCursor.foreground': '#3b82f6',
      'editor.selectionBackground': '#3b82f655',
      'editor.inactiveSelectionBackground': '#3b82f633',
      'editor.lineHighlightBackground': '#161b2b66',
      'editorIndentGuide.background': '#2a314733',
      'editorIndentGuide.activeBackground': '#2a314766',
      'editorWidget.background': '#161b2b',
      'editorWidget.border': '#2a3147',
      'editorSuggestWidget.background': '#161b2b',
      'editorSuggestWidget.border': '#2a3147',
      'editorSuggestWidget.foreground': '#f8fafc',
      'editorSuggestWidget.selectedBackground': '#2a3147',
      'editorHoverWidget.background': '#161b2b',
      'editorHoverWidget.border': '#2a3147',
    },
  });
}
