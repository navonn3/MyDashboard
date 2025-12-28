/**
 * Prompt Modal Component
 * Displays generated AI prompts with copy functionality
 */

import { useState } from 'react';
import { X, Copy, Check, Download } from 'lucide-react';
import { useUIStore } from '../hooks/useStore';
import { copyToClipboard } from '../utils/helpers';
import toast from 'react-hot-toast';

export default function PromptModal() {
  const { closePromptModal, selectedPrompt, isRTL } = useUIStore();
  const [copied, setCopied] = useState(false);

  if (!selectedPrompt) return null;

  const handleCopy = async () => {
    const success = await copyToClipboard(selectedPrompt);
    if (success) {
      setCopied(true);
      toast.success(isRTL ? 'הועתק ללוח!' : 'Copied to clipboard!');
      setTimeout(() => setCopied(false), 2000);
    } else {
      toast.error(isRTL ? 'נכשל בהעתקה' : 'Failed to copy');
    }
  };

  const handleDownload = () => {
    const blob = new Blob([selectedPrompt], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `prompt-${new Date().toISOString().split('T')[0]}.txt`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    toast.success(isRTL ? 'הפרומפט הורד' : 'Prompt downloaded');
  };

  return (
    <div className="modal-overlay" onClick={closePromptModal}>
      <div
        className="modal-content w-full max-w-4xl h-[85vh] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 dark:border-gray-700 shrink-0">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
            {isRTL ? 'פרומפט שנוצר' : 'Generated Prompt'}
          </h2>
          <div className="flex items-center gap-2">
            <button
              onClick={handleDownload}
              className="btn-secondary flex items-center gap-2"
            >
              <Download className="w-4 h-4" />
              {isRTL ? 'הורד' : 'Download'}
            </button>
            <button
              onClick={handleCopy}
              className={`btn-primary flex items-center gap-2 ${
                copied ? 'bg-green-600 hover:bg-green-700' : ''
              }`}
            >
              {copied ? (
                <>
                  <Check className="w-4 h-4" />
                  {isRTL ? 'הועתק!' : 'Copied!'}
                </>
              ) : (
                <>
                  <Copy className="w-4 h-4" />
                  {isRTL ? 'העתק ללוח' : 'Copy to Clipboard'}
                </>
              )}
            </button>
            <button onClick={closePromptModal} className="btn-icon">
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          <div className="code-block h-full overflow-auto">
            <pre className="whitespace-pre-wrap break-words text-sm leading-relaxed">
              {selectedPrompt}
            </pre>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-gray-200 dark:border-gray-700 shrink-0">
          <p className="text-sm text-gray-500 text-center">
            {isRTL
              ? 'העתק את הפרומפט הזה ל-Claude Code או כל כלי AI אחר'
              : 'Copy this prompt to Claude Code or any other AI tool'}
          </p>
        </div>
      </div>
    </div>
  );
}
