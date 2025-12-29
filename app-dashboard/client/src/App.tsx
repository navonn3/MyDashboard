/**
 * Application Dashboard - Main App Component
 * A full-stack dashboard for managing applications, ideas, and AI-powered prompt generation
 */

import { useEffect, useState } from 'react';
import { Toaster } from 'react-hot-toast';
import { useUIStore, useDataStore } from './hooks/useStore';
import { useKeyboardShortcuts } from './hooks/useKeyboardShortcuts';
import { getApplications, getGlobalIdeas } from './services/api';

// Components
import Header from './components/Header';
import Dashboard from './components/Dashboard';
import GlobalIdeasBox from './components/GlobalIdeasBox';
import DeploymentStatusPanel from './components/DeploymentStatusPanel';
import AddAppWizard from './components/AddAppWizard';
import SettingsModal from './components/SettingsModal';
import AppDetailsModal from './components/AppDetailsModal';
import PromptModal from './components/PromptModal';
import ConfirmDialog from './components/ConfirmDialog';
import LoadingSpinner from './components/LoadingSpinner';

function App() {
  const [isInitialLoading, setIsInitialLoading] = useState(true);
  const { theme, isRTL } = useUIStore();
  const { setApplications, setGlobalIdeas } = useDataStore();
  const {
    isAddAppWizardOpen,
    isSettingsOpen,
    isAppDetailsOpen,
    isPromptModalOpen,
    isConfirmDeleteOpen,
  } = useUIStore();

  // Initialize keyboard shortcuts
  useKeyboardShortcuts();

  // Fetch initial data
  useEffect(() => {
    async function loadInitialData() {
      try {
        const [appsResponse, ideasResponse] = await Promise.all([
          getApplications(),
          getGlobalIdeas(),
        ]);

        if (appsResponse.success && appsResponse.data) {
          setApplications(appsResponse.data);
        }

        if (ideasResponse.success && ideasResponse.data) {
          setGlobalIdeas(ideasResponse.data);
        }
      } catch (error) {
        console.error('Failed to load initial data:', error);
      } finally {
        setIsInitialLoading(false);
      }
    }

    loadInitialData();
  }, [setApplications, setGlobalIdeas]);

  // Apply theme class to document
  useEffect(() => {
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [theme]);

  // Apply RTL direction
  useEffect(() => {
    document.documentElement.dir = isRTL ? 'rtl' : 'ltr';
  }, [isRTL]);

  if (isInitialLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
        <LoadingSpinner size="lg" text="Loading Dashboard..." />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Toast notifications */}
      <Toaster
        position="top-right"
        toastOptions={{
          duration: 4000,
          style: {
            background: theme === 'dark' ? '#1f2937' : '#ffffff',
            color: theme === 'dark' ? '#f3f4f6' : '#1f2937',
            border: theme === 'dark' ? '1px solid #374151' : '1px solid #e5e7eb',
          },
          success: {
            iconTheme: {
              primary: '#22c55e',
              secondary: theme === 'dark' ? '#1f2937' : '#ffffff',
            },
          },
          error: {
            iconTheme: {
              primary: '#ef4444',
              secondary: theme === 'dark' ? '#1f2937' : '#ffffff',
            },
          },
        }}
      />

      {/* Header */}
      <Header />

      {/* Main Content */}
      <main className="mx-auto py-6 space-y-6" style={{ width: '90%', maxWidth: '1600px' }}>
        {/* Applications Dashboard */}
        <Dashboard />

        {/* Deployment Status */}
        <DeploymentStatusPanel />

        {/* Global Ideas Section */}
        <GlobalIdeasBox />
      </main>

      {/* Modals */}
      {isAddAppWizardOpen && <AddAppWizard />}
      {isSettingsOpen && <SettingsModal />}
      {isAppDetailsOpen && <AppDetailsModal />}
      {isPromptModalOpen && <PromptModal />}
      {isConfirmDeleteOpen && <ConfirmDialog />}
    </div>
  );
}

export default App;
