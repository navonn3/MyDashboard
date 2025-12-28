/**
 * Settings Modal Component
 * Manages API keys and application preferences
 */

import { useState, useEffect } from 'react';
import { X, Key, Save, Eye, EyeOff, Check, AlertCircle } from 'lucide-react';
import { useUIStore } from '../hooks/useStore';
import { getSetting, updateSetting, deleteSetting } from '../services/api';
import toast from 'react-hot-toast';

export default function SettingsModal() {
  const { closeSettings, isRTL } = useUIStore();

  const [anthropicKey, setAnthropicKey] = useState('');
  const [hasExistingKey, setHasExistingKey] = useState(false);
  const [showKey, setShowKey] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // Fetch existing settings
  useEffect(() => {
    async function fetchSettings() {
      setIsLoading(true);
      try {
        const response = await getSetting('anthropic_api_key');
        if (response.success && response.data) {
          setHasExistingKey(response.data.hasValue);
          if (response.data.value) {
            setAnthropicKey(response.data.value);
          }
        }
      } catch (error) {
        console.error('Failed to fetch settings:', error);
      } finally {
        setIsLoading(false);
      }
    }

    fetchSettings();
  }, []);

  const handleSaveApiKey = async () => {
    if (!anthropicKey.trim()) {
      toast.error(isRTL ? 'נא להזין מפתח API' : 'Please enter an API key');
      return;
    }

    // Validate key format
    if (!anthropicKey.startsWith('sk-ant-')) {
      toast.error(
        isRTL
          ? 'פורמט מפתח לא תקין. המפתח צריך להתחיל ב-"sk-ant-"'
          : 'Invalid key format. Key should start with "sk-ant-"'
      );
      return;
    }

    setIsSaving(true);
    try {
      const response = await updateSetting('anthropic_api_key', anthropicKey);
      if (response.success) {
        setHasExistingKey(true);
        toast.success(isRTL ? 'מפתח ה-API נשמר' : 'API key saved successfully');
      } else {
        toast.error(response.error || 'Failed to save');
      }
    } catch {
      toast.error('Failed to save API key');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteApiKey = async () => {
    const confirmed = window.confirm(
      isRTL ? 'האם למחוק את מפתח ה-API?' : 'Delete the API key?'
    );
    if (!confirmed) return;

    try {
      const response = await deleteSetting('anthropic_api_key');
      if (response.success) {
        setAnthropicKey('');
        setHasExistingKey(false);
        toast.success(isRTL ? 'מפתח ה-API נמחק' : 'API key deleted');
      }
    } catch {
      toast.error('Failed to delete API key');
    }
  };

  return (
    <div className="modal-overlay" onClick={closeSettings}>
      <div
        className="modal-content w-full max-w-lg"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
            {isRTL ? 'הגדרות' : 'Settings'}
          </h2>
          <button onClick={closeSettings} className="btn-icon">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Anthropic API Key Section */}
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <Key className="w-5 h-5 text-gray-400" />
              <h3 className="font-semibold text-gray-900 dark:text-white">
                Anthropic API Key
              </h3>
            </div>

            <p className="text-sm text-gray-500">
              {isRTL
                ? 'נדרש מפתח API של Anthropic כדי לייצר פרומפטים עם Claude AI.'
                : 'Required for generating prompts with Claude AI.'}
            </p>

            {isLoading ? (
              <div className="h-10 skeleton rounded" />
            ) : (
              <div className="space-y-3">
                <div className="relative">
                  <input
                    type={showKey ? 'text' : 'password'}
                    value={anthropicKey}
                    onChange={(e) => setAnthropicKey(e.target.value)}
                    className="input pr-10"
                    placeholder="sk-ant-..."
                  />
                  <button
                    type="button"
                    onClick={() => setShowKey(!showKey)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  >
                    {showKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>

                {hasExistingKey && (
                  <div className="flex items-center gap-2 text-sm text-green-600">
                    <Check className="w-4 h-4" />
                    {isRTL ? 'מפתח API מוגדר' : 'API key configured'}
                  </div>
                )}

                <div className="flex gap-2">
                  <button
                    onClick={handleSaveApiKey}
                    disabled={isSaving}
                    className="btn-primary flex items-center gap-2"
                  >
                    <Save className="w-4 h-4" />
                    {isSaving
                      ? isRTL
                        ? 'שומר...'
                        : 'Saving...'
                      : hasExistingKey
                      ? isRTL
                        ? 'עדכן מפתח'
                        : 'Update Key'
                      : isRTL
                      ? 'שמור מפתח'
                      : 'Save Key'}
                  </button>

                  {hasExistingKey && (
                    <button
                      onClick={handleDeleteApiKey}
                      className="btn-danger"
                    >
                      {isRTL ? 'מחק' : 'Delete'}
                    </button>
                  )}
                </div>
              </div>
            )}

            {/* Help text */}
            <div className="p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
              <div className="flex gap-2">
                <AlertCircle className="w-4 h-4 text-blue-500 mt-0.5 shrink-0" />
                <div className="text-sm text-blue-700 dark:text-blue-300">
                  <p className="font-medium mb-1">
                    {isRTL ? 'איך להשיג מפתח API?' : 'How to get an API key?'}
                  </p>
                  <ol className="list-decimal list-inside space-y-1 text-xs">
                    <li>
                      {isRTL
                        ? 'היכנס ל-console.anthropic.com'
                        : 'Go to console.anthropic.com'}
                    </li>
                    <li>
                      {isRTL
                        ? 'צור חשבון או התחבר'
                        : 'Create an account or sign in'}
                    </li>
                    <li>
                      {isRTL
                        ? 'עבור ל-API Keys ולחץ "Create Key"'
                        : 'Navigate to API Keys and click "Create Key"'}
                    </li>
                    <li>
                      {isRTL
                        ? 'העתק את המפתח והדבק אותו כאן'
                        : 'Copy the key and paste it here'}
                    </li>
                  </ol>
                </div>
              </div>
            </div>
          </div>

          {/* Divider */}
          <hr className="border-gray-200 dark:border-gray-700" />

          {/* App Info */}
          <div className="text-center text-sm text-gray-400">
            <p>App Dashboard v1.0.0</p>
            <p className="mt-1">
              {isRTL
                ? 'נבנה עם React, TypeScript, ו-Tailwind CSS'
                : 'Built with React, TypeScript, and Tailwind CSS'}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
