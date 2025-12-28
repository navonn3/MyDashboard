/**
 * Header Component
 * Application header with theme toggle, RTL toggle, and navigation
 */

import { Sun, Moon, Settings, Plus, Download, Languages, Keyboard } from 'lucide-react';
import { useUIStore, useDataStore } from '../hooks/useStore';
import { exportAllData } from '../services/api';
import { downloadAsJson } from '../utils/helpers';
import { KEYBOARD_SHORTCUTS } from '../hooks/useKeyboardShortcuts';
import toast from 'react-hot-toast';
import { useState } from 'react';

export default function Header() {
  const { theme, toggleTheme, isRTL, toggleRTL, openAddAppWizard, openSettings } = useUIStore();
  const { applications } = useDataStore();
  const [showShortcuts, setShowShortcuts] = useState(false);

  const handleExport = async () => {
    const response = await exportAllData();
    if (response.success && response.data) {
      const filename = `app-dashboard-backup-${new Date().toISOString().split('T')[0]}.json`;
      downloadAsJson(response.data, filename);
      toast.success('Data exported successfully');
    } else {
      toast.error('Failed to export data');
    }
  };

  return (
    <header className="sticky top-0 z-30 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 shadow-sm">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          {/* Logo and Title */}
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-primary-600 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-lg">AD</span>
            </div>
            <div>
              <h1 className="text-xl font-bold text-gray-900 dark:text-white">
                {isRTL ? 'לוח בקרה לאפליקציות' : 'App Dashboard'}
              </h1>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                {applications.length} {isRTL ? 'אפליקציות' : 'applications'}
              </p>
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center gap-2">
            {/* New Application Button */}
            <button
              onClick={() => openAddAppWizard()}
              className="btn-primary flex items-center gap-2"
              title="Ctrl+N"
            >
              <Plus className="w-4 h-4" />
              <span className="hidden sm:inline">
                {isRTL ? 'אפליקציה חדשה' : 'New App'}
              </span>
            </button>

            {/* Export Button */}
            <button
              onClick={handleExport}
              className="btn-icon"
              title={isRTL ? 'ייצא נתונים' : 'Export Data'}
            >
              <Download className="w-5 h-5" />
            </button>

            {/* Keyboard Shortcuts */}
            <div className="relative">
              <button
                onClick={() => setShowShortcuts(!showShortcuts)}
                className="btn-icon"
                title={isRTL ? 'קיצורי מקלדת' : 'Keyboard Shortcuts'}
              >
                <Keyboard className="w-5 h-5" />
              </button>

              {showShortcuts && (
                <>
                  <div
                    className="fixed inset-0 z-40"
                    onClick={() => setShowShortcuts(false)}
                  />
                  <div className="absolute top-full right-0 mt-2 w-64 card p-4 z-50 animate-fade-in">
                    <h3 className="font-semibold mb-3 text-gray-900 dark:text-white">
                      {isRTL ? 'קיצורי מקלדת' : 'Keyboard Shortcuts'}
                    </h3>
                    <ul className="space-y-2">
                      {KEYBOARD_SHORTCUTS.map((shortcut) => (
                        <li
                          key={shortcut.keys}
                          className="flex justify-between items-center text-sm"
                        >
                          <span className="text-gray-600 dark:text-gray-400">
                            {isRTL ? shortcut.descriptionHe : shortcut.description}
                          </span>
                          <kbd className="px-2 py-1 bg-gray-100 dark:bg-gray-700 rounded text-xs font-mono">
                            {shortcut.keys}
                          </kbd>
                        </li>
                      ))}
                    </ul>
                  </div>
                </>
              )}
            </div>

            {/* RTL Toggle */}
            <button
              onClick={toggleRTL}
              className="btn-icon"
              title={isRTL ? 'Switch to LTR' : 'Switch to RTL'}
            >
              <Languages className="w-5 h-5" />
            </button>

            {/* Theme Toggle */}
            <button
              onClick={toggleTheme}
              className="btn-icon"
              title={theme === 'dark' ? 'Light Mode' : 'Dark Mode'}
            >
              {theme === 'dark' ? (
                <Sun className="w-5 h-5" />
              ) : (
                <Moon className="w-5 h-5" />
              )}
            </button>

            {/* Settings Button */}
            <button
              onClick={openSettings}
              className="btn-icon"
              title="Ctrl+,"
            >
              <Settings className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>
    </header>
  );
}
