/**
 * Ideas List Component
 * Simple raw textbox for ideas with prompt generation for Claude Code
 */

import { useState, useEffect } from 'react';
import { Check, Wand2 } from 'lucide-react';
import { useUIStore } from '../hooks/useStore';
import { updateNotes, getNotes } from '../services/api';
import toast from 'react-hot-toast';

interface IdeasListProps {
  appId: string;
  appName?: string;
}

// Quick prompt templates for Claude Code
const quickPrompts = [
  {
    id: 'code-review',
    emoji: '🔍',
    labelEn: 'Code Review',
    labelHe: 'סקירת קוד',
    prompt: `Please perform a comprehensive code review of this codebase:
1. Identify any bugs, security vulnerabilities, or potential issues
2. Check for code quality, readability, and maintainability
3. Suggest improvements and best practices
4. Look for performance optimization opportunities
5. Verify error handling and edge cases

Focus on actionable feedback and prioritize critical issues.`,
  },
  {
    id: 'tests',
    emoji: '🧪',
    labelEn: 'Write Tests',
    labelHe: 'כתוב טסטים',
    prompt: `Please write comprehensive tests for this codebase:
1. Unit tests for all major functions and components
2. Integration tests for API endpoints
3. Edge case coverage
4. Mock external dependencies appropriately
5. Ensure high code coverage

Use the existing testing framework if present, or suggest the best one for this project.`,
  },
  {
    id: 'qa',
    emoji: '✅',
    labelEn: 'QA Check',
    labelHe: 'בדיקת QA',
    prompt: `Please perform a thorough QA check:
1. Test all user flows and interactions
2. Check for UI/UX issues and inconsistencies
3. Verify responsive design works correctly
4. Test error states and loading states
5. Check accessibility (a11y) compliance
6. Verify all links and buttons work
7. Test form validation and submissions

Report any issues found with severity levels.`,
  },
  {
    id: 'security',
    emoji: '🔒',
    labelEn: 'Security Audit',
    labelHe: 'בדיקת אבטחה',
    prompt: `Please perform a security audit:
1. Check for common vulnerabilities (OWASP Top 10)
2. Review authentication and authorization
3. Check for sensitive data exposure
4. Verify input validation and sanitization
5. Review API security
6. Check for dependency vulnerabilities
7. Verify secure headers and CORS configuration

Prioritize findings by severity and provide remediation steps.`,
  },
  {
    id: 'optimize',
    emoji: '⚡',
    labelEn: 'Optimize',
    labelHe: 'אופטימיזציה',
    prompt: `Please optimize this codebase for performance:
1. Identify performance bottlenecks
2. Optimize database queries if applicable
3. Improve frontend bundle size
4. Add caching where appropriate
5. Optimize images and assets
6. Improve loading times
7. Check for memory leaks

Implement the optimizations and explain the improvements.`,
  },
  {
    id: 'refactor',
    emoji: '🔧',
    labelEn: 'Refactor',
    labelHe: 'שיפור קוד',
    prompt: `Please refactor this codebase to improve quality:
1. Apply clean code principles
2. Reduce code duplication (DRY)
3. Improve naming and documentation
4. Split large files/functions
5. Apply appropriate design patterns
6. Improve type safety
7. Organize folder structure

Make incremental, safe changes with clear explanations.`,
  },
  {
    id: 'fix-bugs',
    emoji: '🐛',
    labelEn: 'Fix Bugs',
    labelHe: 'תיקון באגים',
    prompt: `Please find and fix bugs in this codebase:
1. Run the application and test all features
2. Check console for errors and warnings
3. Fix any runtime errors
4. Fix TypeScript/ESLint errors
5. Test edge cases
6. Verify fixes don't break other functionality

Run comprehensive tests after fixing.`,
  },
  {
    id: 'deploy-check',
    emoji: '🚀',
    labelEn: 'Deploy Ready',
    labelHe: 'בדיקה לפני Deploy',
    prompt: `Please verify this codebase is ready for production deployment:
1. Check all environment variables are configured
2. Verify build succeeds without errors
3. Run all tests
4. Check for console.logs and debug code
5. Verify error handling and logging
6. Check API endpoints are working
7. Verify database migrations
8. Check for hardcoded values

Fix any issues and confirm deployment readiness.`,
  },
];

export default function IdeasList({ appId, appName }: IdeasListProps) {
  const { isRTL, openPromptModal } = useUIStore();
  const [rawIdeas, setRawIdeas] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [copied, setCopied] = useState<string | null>(null);

  // Load saved ideas (from notes API for simplicity)
  useEffect(() => {
    const loadIdeas = async () => {
      const response = await getNotes(appId);
      if (response.success && response.data) {
        // Extract ideas section from notes if it exists
        const content = response.data.content || '';
        const ideasMatch = content.match(/\[IDEAS\]([\s\S]*?)\[\/IDEAS\]/);
        if (ideasMatch) {
          setRawIdeas(ideasMatch[1].trim());
        }
      }
    };
    loadIdeas();
  }, [appId]);

  // Save ideas with debounce
  const saveIdeas = async (ideas: string) => {
    setIsSaving(true);
    try {
      const response = await getNotes(appId);
      let content = response.data?.content || '';

      // Update or add ideas section
      if (content.includes('[IDEAS]')) {
        content = content.replace(/\[IDEAS\][\s\S]*?\[\/IDEAS\]/, `[IDEAS]\n${ideas}\n[/IDEAS]`);
      } else {
        content = `[IDEAS]\n${ideas}\n[/IDEAS]\n\n${content}`;
      }

      await updateNotes(appId, content);
    } catch {
      toast.error(isRTL ? 'שגיאה בשמירה' : 'Failed to save');
    } finally {
      setIsSaving(false);
    }
  };

  // Generate professional prompt from raw ideas
  const generatePromptFromIdeas = () => {
    if (!rawIdeas.trim()) {
      toast.error(isRTL ? 'נא להזין רעיונות קודם' : 'Please enter ideas first');
      return;
    }

    const prompt = `You are Claude Code, working on the "${appName || 'application'}" codebase.

The user has the following requests/ideas to implement:

${rawIdeas}

Instructions:
1. Read and understand each request carefully
2. Implement the changes one by one
3. Run comprehensive tests after each major change
4. Ensure all changes work together correctly
5. Do NOT explain the codebase context - you already have it
6. Focus only on implementing the specific requests above
7. After completing all changes, run the build and fix any errors

Please proceed with the implementation.`;

    openPromptModal(prompt);
  };

  const copyPrompt = (promptId: string, promptText: string) => {
    const fullPrompt = `You are Claude Code, working on the "${appName || 'application'}" codebase.

${promptText}

Remember:
- You already have full context of the codebase
- Make changes incrementally and test as you go
- Run the build and tests after making changes
- Fix any issues that arise`;

    navigator.clipboard.writeText(fullPrompt);
    setCopied(promptId);
    toast.success(isRTL ? 'הפרומפט הועתק!' : 'Prompt copied!');
    setTimeout(() => setCopied(null), 2000);
  };

  return (
    <div className="space-y-6">
      {/* Raw Ideas Textbox */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <label className="label mb-0">
            {isRTL ? 'רעיונות ובקשות (גולמי)' : 'Ideas & Requests (Raw)'}
          </label>
          <span className="text-xs text-gray-400">
            {isSaving ? (isRTL ? 'שומר...' : 'Saving...') : ''}
          </span>
        </div>
        <textarea
          value={rawIdeas}
          onChange={(e) => {
            setRawIdeas(e.target.value);
            saveIdeas(e.target.value);
          }}
          className="input min-h-[150px] font-mono text-sm"
          placeholder={isRTL
            ? 'כתוב כאן רעיונות, שינויים, באגים לתקן...\nלדוגמה:\n- להוסיף כפתור התנתקות\n- לתקן באג בטופס\n- לשפר את הביצועים של הדף הראשי'
            : 'Write your ideas, changes, bugs to fix here...\nExample:\n- Add logout button\n- Fix form validation bug\n- Improve main page performance'
          }
          dir="auto"
        />
        <p className="text-xs text-gray-400 mt-1">
          {isRTL
            ? 'טיפ: לא צריך להסביר את הקונטקסט - Claude Code כבר מכיר את הקוד'
            : 'Tip: No need to explain context - Claude Code already knows the codebase'}
        </p>
      </div>

      {/* Generate Prompt Button */}
      <button
        onClick={generatePromptFromIdeas}
        disabled={!rawIdeas.trim()}
        className="btn-primary w-full flex items-center justify-center gap-2"
      >
        <Wand2 className="w-4 h-4" />
        {isRTL ? 'צור פרומפט מהרעיונות' : 'Generate Prompt from Ideas'}
      </button>

      {/* Quick Prompts Section */}
      <div>
        <h3 className="font-medium text-gray-900 dark:text-white mb-3">
          {isRTL ? 'פרומפטים מהירים ל-Claude Code' : 'Quick Prompts for Claude Code'}
        </h3>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
          {quickPrompts.map((qp) => (
            <button
              key={qp.id}
              onClick={() => copyPrompt(qp.id, qp.prompt)}
              className={`card p-3 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors text-center ${
                copied === qp.id ? 'ring-2 ring-green-500' : ''
              }`}
            >
              <span className="text-2xl mb-1 block">{qp.emoji}</span>
              <span className="text-xs font-medium">
                {isRTL ? qp.labelHe : qp.labelEn}
              </span>
              {copied === qp.id && (
                <Check className="w-3 h-3 text-green-500 mx-auto mt-1" />
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Explanation */}
      <div className="text-xs text-gray-500 dark:text-gray-400 space-y-1 border-t border-gray-200 dark:border-gray-700 pt-4">
        <p className="font-medium">{isRTL ? 'איך זה עובד:' : 'How it works:'}</p>
        <ul className="list-disc list-inside space-y-0.5">
          <li>{isRTL ? 'כתוב את הרעיונות שלך בתיבה למעלה' : 'Write your ideas in the textbox above'}</li>
          <li>{isRTL ? 'לחץ על "צור פרומפט" כדי להפוך אותם לפרומפט מקצועי' : 'Click "Generate Prompt" to convert them to a professional prompt'}</li>
          <li>{isRTL ? 'או השתמש בפרומפטים המהירים לפעולות נפוצות' : 'Or use quick prompts for common operations'}</li>
          <li>{isRTL ? 'הדבק את הפרומפט ב-Codespace עם Claude Code' : 'Paste the prompt in Codespace with Claude Code'}</li>
        </ul>
      </div>
    </div>
  );
}
