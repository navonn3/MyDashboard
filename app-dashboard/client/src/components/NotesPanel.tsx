/**
 * Notes Panel Component
 * Rich text notes area for each application
 */

import { useState, useCallback } from 'react';
import { Save, Bold, Italic, List, ListOrdered, Heading2 } from 'lucide-react';
import { updateNotes } from '../services/api';
import { useUIStore } from '../hooks/useStore';
import { debounce } from '../utils/helpers';
import toast from 'react-hot-toast';

interface NotesPanelProps {
  appId: string;
  initialContent: string;
}

export default function NotesPanel({ appId, initialContent }: NotesPanelProps) {
  const { isRTL } = useUIStore();
  const [content, setContent] = useState(initialContent);
  const [isSaving, setIsSaving] = useState(false);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);

  // Auto-save with debounce
  const saveNotes = useCallback(
    debounce(async (newContent: string) => {
      setIsSaving(true);
      try {
        const response = await updateNotes(appId, newContent);
        if (response.success) {
          setLastSaved(new Date());
        }
      } catch {
        console.error('Failed to auto-save notes');
      } finally {
        setIsSaving(false);
      }
    }, 1000),
    [appId]
  );

  const handleContentChange = (newContent: string) => {
    setContent(newContent);
    saveNotes(newContent);
  };

  const handleManualSave = async () => {
    setIsSaving(true);
    try {
      const response = await updateNotes(appId, content);
      if (response.success) {
        setLastSaved(new Date());
        toast.success(isRTL ? 'ההערות נשמרו' : 'Notes saved');
      } else {
        toast.error(response.error || 'Failed to save');
      }
    } catch {
      toast.error('Failed to save notes');
    } finally {
      setIsSaving(false);
    }
  };

  // Simple formatting helpers
  const applyFormatting = (tag: string) => {
    const textarea = document.getElementById('notes-editor') as HTMLTextAreaElement;
    if (!textarea) return;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const selectedText = content.substring(start, end);

    let newText = '';
    let cursorOffset = 0;

    switch (tag) {
      case 'bold':
        newText = `**${selectedText}**`;
        cursorOffset = 2;
        break;
      case 'italic':
        newText = `*${selectedText}*`;
        cursorOffset = 1;
        break;
      case 'heading':
        newText = `## ${selectedText}`;
        cursorOffset = 3;
        break;
      case 'ul':
        newText = selectedText
          .split('\n')
          .map((line) => `- ${line}`)
          .join('\n');
        cursorOffset = 2;
        break;
      case 'ol':
        newText = selectedText
          .split('\n')
          .map((line, i) => `${i + 1}. ${line}`)
          .join('\n');
        cursorOffset = 3;
        break;
      default:
        return;
    }

    const newContent = content.substring(0, start) + newText + content.substring(end);
    handleContentChange(newContent);

    // Restore cursor position
    setTimeout(() => {
      textarea.focus();
      textarea.setSelectionRange(start + cursorOffset, start + cursorOffset + selectedText.length);
    }, 0);
  };

  return (
    <div className="space-y-4">
      {/* Toolbar */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1">
          <button
            onClick={() => applyFormatting('bold')}
            className="btn-icon"
            title="Bold (Ctrl+B)"
          >
            <Bold className="w-4 h-4" />
          </button>
          <button
            onClick={() => applyFormatting('italic')}
            className="btn-icon"
            title="Italic (Ctrl+I)"
          >
            <Italic className="w-4 h-4" />
          </button>
          <button
            onClick={() => applyFormatting('heading')}
            className="btn-icon"
            title="Heading"
          >
            <Heading2 className="w-4 h-4" />
          </button>
          <div className="w-px h-5 bg-gray-300 dark:bg-gray-600 mx-1" />
          <button
            onClick={() => applyFormatting('ul')}
            className="btn-icon"
            title="Bullet List"
          >
            <List className="w-4 h-4" />
          </button>
          <button
            onClick={() => applyFormatting('ol')}
            className="btn-icon"
            title="Numbered List"
          >
            <ListOrdered className="w-4 h-4" />
          </button>
        </div>

        <div className="flex items-center gap-3">
          {lastSaved && (
            <span className="text-xs text-gray-400">
              {isRTL ? 'נשמר לאחרונה:' : 'Last saved:'}{' '}
              {lastSaved.toLocaleTimeString()}
            </span>
          )}
          <button
            onClick={handleManualSave}
            disabled={isSaving}
            className="btn-primary flex items-center gap-2 text-sm"
          >
            <Save className="w-4 h-4" />
            {isSaving ? (isRTL ? 'שומר...' : 'Saving...') : isRTL ? 'שמור' : 'Save'}
          </button>
        </div>
      </div>

      {/* Editor */}
      <div className="rich-text-editor">
        <textarea
          id="notes-editor"
          value={content}
          onChange={(e) => handleContentChange(e.target.value)}
          className="w-full min-h-[400px] bg-transparent border-none outline-none resize-none font-mono text-sm"
          placeholder={
            isRTL
              ? 'כתוב את ההערות שלך כאן...\n\nתומך בפורמט Markdown:\n- **טקסט מודגש**\n- *טקסט נטוי*\n- ## כותרות\n- רשימות'
              : 'Write your notes here...\n\nSupports Markdown format:\n- **bold text**\n- *italic text*\n- ## headings\n- lists'
          }
        />
      </div>

      {/* Help text */}
      <p className="text-xs text-gray-400">
        {isRTL
          ? 'תומך בתחביר Markdown. השינויים נשמרים אוטומטית.'
          : 'Supports Markdown syntax. Changes are auto-saved.'}
      </p>
    </div>
  );
}
