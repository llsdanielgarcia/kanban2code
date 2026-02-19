import React, { useState, useRef, useEffect, useCallback } from 'react';
import { createMessage, type MessageEnvelope } from '../../messaging';
import { vscode } from '../vscodeApi';

function postMessage(type: string, payload: unknown) {
  if (vscode) {
    vscode.postMessage(createMessage(type as never, payload));
  }
}

interface SearchResult {
  path: string;
}

interface MentionsTextareaProps {
  id?: string;
  className?: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  rows?: number;
}

export const MentionsTextarea: React.FC<MentionsTextareaProps> = ({
  id,
  className = '',
  value,
  onChange,
  placeholder,
  rows = 4,
}) => {
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const [showDropdown, setShowDropdown] = useState(false);
  const [dropdownPosition, setDropdownPosition] = useState({ top: 0, left: 0 });
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [mentionStartIndex, setMentionStartIndex] = useState<number | null>(null);
  const searchRequestIdRef = useRef<string | null>(null);
  const searchTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const closeDropdown = useCallback(() => {
    setShowDropdown(false);
    setMentionStartIndex(null);
    setSearchQuery('');
    setSearchResults([]);
    setSelectedIndex(0);
    searchRequestIdRef.current = null;
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
      searchTimeoutRef.current = null;
    }
  }, []);

  const findMentionTrigger = useCallback(
    (text: string, cursorPos: number): { start: number; query: string } | null => {
      const beforeCursor = text.substring(0, cursorPos);
      const atIndex = beforeCursor.lastIndexOf('@');
      if (atIndex === -1) return null;
      const afterAt = beforeCursor.substring(atIndex + 1);
      if (afterAt.includes(' ') || afterAt.includes('\n')) return null;
      const charBeforeAt = atIndex > 0 ? beforeCursor[atIndex - 1] : ' ';
      const wordCharRegex = /[a-zA-Z0-9_/\\]/;
      if (wordCharRegex.test(charBeforeAt)) return null;
      return { start: atIndex, query: afterAt };
    },
    [],
  );

  const updateDropdownPosition = useCallback(() => {
    if (!textareaRef.current) return;
    const textarea = textareaRef.current;
    const rect = textarea.getBoundingClientRect();
    const lineHeight = parseInt(getComputedStyle(textarea).lineHeight) || 20;
    const lines = textarea.value.substring(0, textarea.selectionStart).split('\n');
    const currentLine = lines.length;
    const top = Math.min(currentLine * lineHeight, textarea.scrollHeight);
    setDropdownPosition({
      top: rect.top + top - textarea.scrollTop + lineHeight,
      left: rect.left + 10,
    });
  }, []);

  const handleSearchResponse = useCallback((event: MessageEvent<MessageEnvelope>) => {
    const message = event.data;
    if (message?.type !== 'FilesSearched') return;
    const payload = message.payload as { requestId?: string; files?: string[] };
    if (!payload.requestId || payload.requestId !== searchRequestIdRef.current) return;
    searchRequestIdRef.current = null;
    setSearchResults((payload.files || []).map((path) => ({ path })));
    setSelectedIndex(0);
  }, []);

  useEffect(() => {
    window.addEventListener('message', handleSearchResponse);
    return () => window.removeEventListener('message', handleSearchResponse);
  }, [handleSearchResponse]);

  useEffect(() => {
    if (showDropdown) {
      updateDropdownPosition();
    }
  }, [showDropdown, updateDropdownPosition]);

  const debouncedSearch = useCallback((query: string) => {
    searchRequestIdRef.current = null;
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }
    searchTimeoutRef.current = setTimeout(() => {
      const requestId = `${Date.now()}-${Math.random().toString(16).slice(2)}`;
      searchRequestIdRef.current = requestId;
      postMessage('SearchFiles', { query, requestId });
    }, 150);
  }, []);

  useEffect(() => {
    return () => {
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current);
      }
    };
  }, []);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (showDropdown && searchResults.length > 0) {
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setSelectedIndex((prev) => (prev + 1) % searchResults.length);
        return;
      }
      if (e.key === 'ArrowUp') {
        e.preventDefault();
        setSelectedIndex((prev) => (prev - 1 + searchResults.length) % searchResults.length);
        return;
      }
      if (e.key === 'Enter' || e.key === 'Tab') {
        e.preventDefault();
        selectFile(searchResults[selectedIndex].path);
        return;
      }
      if (e.key === 'Escape') {
        e.preventDefault();
        closeDropdown();
        return;
      }
    }
  };

  const selectFile = (filePath: string) => {
    if (mentionStartIndex === null || !textareaRef.current) return;
    const startIndex = mentionStartIndex;
    const cursorPos = textareaRef.current.selectionStart;
    const before = value.substring(0, startIndex);
    const after = value.substring(cursorPos);
    const newValue = before + filePath + after;
    onChange(newValue);
    closeDropdown();
    setTimeout(() => {
      const newPos = startIndex + filePath.length;
      textareaRef.current?.setSelectionRange(newPos, newPos);
      textareaRef.current?.focus();
    }, 0);
  };

  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newValue = e.target.value;
    const cursorPos = e.target.selectionStart;
    onChange(newValue);
    const trigger = findMentionTrigger(newValue, cursorPos);
    if (trigger) {
      setMentionStartIndex(trigger.start);
      setSearchQuery(trigger.query);
      setShowDropdown(true);
      setSelectedIndex(0);
      debouncedSearch(trigger.query);
    } else {
      closeDropdown();
    }
  };

  const handleBlur = () => {
    setTimeout(() => {
      closeDropdown();
    }, 200);
  };

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (!target.closest('.mentions-dropdown') && !target.closest('.mentions-textarea-wrapper')) {
        closeDropdown();
      }
    };
    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, [closeDropdown]);

  return (
    <div className="mentions-textarea-wrapper">
      <textarea
        ref={textareaRef}
        id={id}
        className={`form-textarea ${className}`}
        value={value}
        onChange={handleChange}
        onKeyDown={handleKeyDown}
        onBlur={handleBlur}
        placeholder={placeholder}
        rows={rows}
      />
      {showDropdown && searchResults.length > 0 && (
        <div
          className="mentions-dropdown"
          style={{
            position: 'fixed',
            top: dropdownPosition.top,
            left: dropdownPosition.left,
            zIndex: 2000,
          }}
        >
          {searchResults.map((result, index) => (
            <div
              key={result.path}
              className={`mentions-dropdown-item ${index === selectedIndex ? 'selected' : ''}`}
              onMouseEnter={() => setSelectedIndex(index)}
              onClick={() => selectFile(result.path)}
            >
              <span className="mentions-file-icon">
                <svg viewBox="0 0 16 16" width="14" height="14" aria-hidden="true">
                  <path
                    fill="currentColor"
                    d="M2 1.75C2 .784 2.784 0 3.75 0h5.586c.464 0 .909.184 1.237.513l2.914 2.914c.329.328.513.773.513 1.237v8.586A1.75 1.75 0 0112.25 15h-8.5A1.75 1.75 0 012 13.25V1.75zm1.75-.25a.25.25 0 00-.25.25v11.5c0 .138.112.25.25.25h8.5a.25.25 0 00.25-.25V4.664a.25.25 0 00-.073-.177l-2.914-2.914a.25.25 0 00-.177-.073H3.75z"
                  />
                </svg>
              </span>
              <span className="mentions-file-path">{result.path}</span>
            </div>
          ))}
        </div>
      )}
      {showDropdown && searchQuery.length > 0 && searchResults.length === 0 && (
        <div
          className="mentions-dropdown mentions-dropdown-empty"
          style={{
            position: 'fixed',
            top: dropdownPosition.top,
            left: dropdownPosition.left,
            zIndex: 2000,
          }}
        >
          <div className="mentions-dropdown-item">No files found</div>
        </div>
      )}
    </div>
  );
};
