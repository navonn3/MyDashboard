/**
 * Prompt History Component
 * Displays history of generated prompts for an application
 */

import { useState } from 'react';
import { Eye, Trash2, Copy, ChevronDown, ChevronUp } from 'lucide-react';
import { useUIStore, useDataStore } from '../hooks/useStore';
import { deleteGeneratedPrompt } from '../services/api';
import type { GeneratedPrompt } from '../types';
import { formatDate, copyToClipboard } from '../utils/helpers';
import toast from 'react-hot-toast';

interface PromptHistoryProps {
  appId: string;
  history: GeneratedPrompt[];
}

export default function PromptHistory({ appId, history }: PromptHistoryProps) {
  const { isRTL, openPromptModal } = useUIStore();
  const { setPromptHistory } = useDataStore();
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const handleDelete = async (id: string) => {
    const confirmed = window.confirm(
      isRTL ? 'האם למחוק את הפרומפט הזה מההיסטוריה?' : 'Delete this prompt from history?'
    );
    if (!confirmed) return;

    const response = await deleteGeneratedPrompt(id);
    if (response.success) {
      setPromptHistory(appId, history.filter((p) => p.id !== id));
      toast.success(isRTL ? 'נמחק' : 'Deleted');
    } else {
      toast.error(response.error || 'Failed to delete');
    }
  };

  const handleCopy = async (prompt: string) => {
    const success = await copyToClipboard(prompt);
    if (success) {
      toast.success(isRTL ? 'הועתק ללוח' : 'Copied to clipboard');
    } else {
      toast.error(isRTL ? 'נכשל בהעתקה' : 'Failed to copy');
    }
  };

  if (history.length === 0) {
    return (
      <div className="text-center py-8 text-gray-500">
        <p>{isRTL ? 'אין היסטוריית פרומפטים' : 'No prompt history'}</p>
        <p className="text-sm mt-1">
          {isRTL
            ? 'פרומפטים שתייצר יישמרו כאן'
            : 'Prompts you generate will be saved here'}
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <h3 className="font-semibold text-gray-900 dark:text-white">
        {isRTL ? 'היסטוריית פרומפטים' : 'Prompt History'}
      </h3>

      <div className="space-y-3">
        {history.map((prompt) => (
          <div key={prompt.id} className="card p-4">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <span className="text-sm text-gray-500">
                  {formatDate(prompt.created_at)}
                </span>
                <span className="text-xs bg-gray-100 dark:bg-gray-700 px-2 py-0.5 rounded">
                  {prompt.ideas_snapshot?.length || 0} {isRTL ? 'רעיונות' : 'ideas'}
                </span>
              </div>
              <div className="flex items-center gap-1">
                <button
                  onClick={() => handleCopy(prompt.generated_prompt)}
                  className="btn-icon"
                  title={isRTL ? 'העתק' : 'Copy'}
                >
                  <Copy className="w-4 h-4" />
                </button>
                <button
                  onClick={() => openPromptModal(prompt.generated_prompt)}
                  className="btn-icon"
                  title={isRTL ? 'צפה' : 'View'}
                >
                  <Eye className="w-4 h-4" />
                </button>
                <button
                  onClick={() => handleDelete(prompt.id)}
                  className="btn-icon text-red-500"
                  title={isRTL ? 'מחק' : 'Delete'}
                >
                  <Trash2 className="w-4 h-4" />
                </button>
                <button
                  onClick={() => setExpandedId(expandedId === prompt.id ? null : prompt.id)}
                  className="btn-icon"
                >
                  {expandedId === prompt.id ? (
                    <ChevronUp className="w-4 h-4" />
                  ) : (
                    <ChevronDown className="w-4 h-4" />
                  )}
                </button>
              </div>
            </div>

            {/* Ideas snapshot */}
            {expandedId === prompt.id && prompt.ideas_snapshot && (
              <div className="mt-3 pt-3 border-t border-gray-200 dark:border-gray-700">
                <p className="text-xs text-gray-500 mb-2">
                  {isRTL ? 'רעיונות שנכללו:' : 'Included ideas:'}
                </p>
                <ul className="space-y-1">
                  {prompt.ideas_snapshot.map((idea, index) => (
                    <li
                      key={index}
                      className="text-sm text-gray-600 dark:text-gray-400 flex items-center gap-2"
                    >
                      <span className="w-1.5 h-1.5 rounded-full bg-gray-400" />
                      {idea.title}
                    </li>
                  ))}
                </ul>

                {/* Preview of prompt */}
                <div className="mt-4">
                  <p className="text-xs text-gray-500 mb-2">
                    {isRTL ? 'תצוגה מקדימה:' : 'Preview:'}
                  </p>
                  <div className="code-block max-h-40 overflow-hidden relative">
                    <pre className="text-xs">
                      {prompt.generated_prompt.substring(0, 500)}...
                    </pre>
                    <div className="absolute bottom-0 left-0 right-0 h-8 bg-gradient-to-t from-gray-900 to-transparent" />
                  </div>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
