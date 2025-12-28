/**
 * Global State Management with Zustand
 * Manages application state, UI state, and settings
 */

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type {
  Application,
  AppIdea,
  GlobalIdea,
  GeneratedPrompt,
  FilterOptions,
  SortOption,
} from '../types';

interface UIState {
  // Theme
  theme: 'light' | 'dark';
  toggleTheme: () => void;

  // RTL
  isRTL: boolean;
  toggleRTL: () => void;

  // Modals
  isAddAppWizardOpen: boolean;
  isSettingsOpen: boolean;
  isAppDetailsOpen: boolean;
  isPromptModalOpen: boolean;
  isConfirmDeleteOpen: boolean;

  // Modal handlers
  openAddAppWizard: (prefill?: Partial<Application>) => void;
  closeAddAppWizard: () => void;
  openSettings: () => void;
  closeSettings: () => void;
  openAppDetails: (appId: string) => void;
  closeAppDetails: () => void;
  openPromptModal: (prompt: string) => void;
  closePromptModal: () => void;
  openConfirmDelete: (id: string, type: 'app' | 'idea' | 'globalIdea') => void;
  closeConfirmDelete: () => void;

  // Selected state
  selectedAppId: string | null;
  selectedPrompt: string | null;
  deleteTarget: { id: string; type: 'app' | 'idea' | 'globalIdea' } | null;
  wizardPrefill: Partial<Application> | null;
  convertingGlobalIdeaId: string | null;

  // Filter and sort
  filterOptions: FilterOptions;
  sortOption: SortOption;
  setFilterOptions: (options: FilterOptions) => void;
  setSortOption: (option: SortOption) => void;

  // Loading states
  isLoading: boolean;
  setIsLoading: (loading: boolean) => void;
}

interface DataState {
  // Applications
  applications: Application[];
  setApplications: (apps: Application[]) => void;
  addApplication: (app: Application) => void;
  updateApplicationInStore: (app: Application) => void;
  removeApplication: (id: string) => void;

  // App Ideas (keyed by app ID)
  appIdeas: Record<string, AppIdea[]>;
  setAppIdeas: (appId: string, ideas: AppIdea[]) => void;
  addAppIdea: (appId: string, idea: AppIdea) => void;
  updateAppIdea: (appId: string, idea: AppIdea) => void;
  removeAppIdea: (appId: string, ideaId: string) => void;

  // Global Ideas
  globalIdeas: GlobalIdea[];
  setGlobalIdeas: (ideas: GlobalIdea[]) => void;
  addGlobalIdea: (idea: GlobalIdea) => void;
  updateGlobalIdeaInStore: (idea: GlobalIdea) => void;
  removeGlobalIdea: (id: string) => void;

  // Prompt History (keyed by app ID)
  promptHistory: Record<string, GeneratedPrompt[]>;
  setPromptHistory: (appId: string, prompts: GeneratedPrompt[]) => void;
  addPromptToHistory: (appId: string, prompt: GeneratedPrompt) => void;
}

// UI Store - persists theme and RTL preferences
export const useUIStore = create<UIState>()(
  persist(
    (set) => ({
      // Theme - defaults to dark
      theme: 'dark',
      toggleTheme: () =>
        set((state) => {
          const newTheme = state.theme === 'dark' ? 'light' : 'dark';
          // Update document class
          if (newTheme === 'dark') {
            document.documentElement.classList.add('dark');
          } else {
            document.documentElement.classList.remove('dark');
          }
          return { theme: newTheme };
        }),

      // RTL
      isRTL: false,
      toggleRTL: () =>
        set((state) => {
          const newRTL = !state.isRTL;
          document.documentElement.dir = newRTL ? 'rtl' : 'ltr';
          return { isRTL: newRTL };
        }),

      // Modals
      isAddAppWizardOpen: false,
      isSettingsOpen: false,
      isAppDetailsOpen: false,
      isPromptModalOpen: false,
      isConfirmDeleteOpen: false,

      // Selected state
      selectedAppId: null,
      selectedPrompt: null,
      deleteTarget: null,
      wizardPrefill: null,
      convertingGlobalIdeaId: null,

      // Modal handlers
      openAddAppWizard: (prefill) =>
        set({
          isAddAppWizardOpen: true,
          wizardPrefill: prefill || null,
        }),
      closeAddAppWizard: () =>
        set({
          isAddAppWizardOpen: false,
          wizardPrefill: null,
          convertingGlobalIdeaId: null,
        }),
      openSettings: () => set({ isSettingsOpen: true }),
      closeSettings: () => set({ isSettingsOpen: false }),
      openAppDetails: (appId) =>
        set({ isAppDetailsOpen: true, selectedAppId: appId }),
      closeAppDetails: () =>
        set({ isAppDetailsOpen: false, selectedAppId: null }),
      openPromptModal: (prompt) =>
        set({ isPromptModalOpen: true, selectedPrompt: prompt }),
      closePromptModal: () =>
        set({ isPromptModalOpen: false, selectedPrompt: null }),
      openConfirmDelete: (id, type) =>
        set({ isConfirmDeleteOpen: true, deleteTarget: { id, type } }),
      closeConfirmDelete: () =>
        set({ isConfirmDeleteOpen: false, deleteTarget: null }),

      // Filter and sort
      filterOptions: { status: 'all', search: '' },
      sortOption: { column: 'updated_at', order: 'desc' },
      setFilterOptions: (options) =>
        set((state) => ({
          filterOptions: { ...state.filterOptions, ...options },
        })),
      setSortOption: (option) => set({ sortOption: option }),

      // Loading
      isLoading: false,
      setIsLoading: (loading) => set({ isLoading: loading }),
    }),
    {
      name: 'app-dashboard-ui',
      partialize: (state) => ({
        theme: state.theme,
        isRTL: state.isRTL,
      }),
    }
  )
);

// Data Store - not persisted (fetched from API)
export const useDataStore = create<DataState>()((set) => ({
  // Applications
  applications: [],
  setApplications: (apps) => set({ applications: apps }),
  addApplication: (app) =>
    set((state) => ({ applications: [app, ...state.applications] })),
  updateApplicationInStore: (app) =>
    set((state) => ({
      applications: state.applications.map((a) =>
        a.id === app.id ? app : a
      ),
    })),
  removeApplication: (id) =>
    set((state) => ({
      applications: state.applications.filter((a) => a.id !== id),
    })),

  // App Ideas
  appIdeas: {},
  setAppIdeas: (appId, ideas) =>
    set((state) => ({
      appIdeas: { ...state.appIdeas, [appId]: ideas },
    })),
  addAppIdea: (appId, idea) =>
    set((state) => ({
      appIdeas: {
        ...state.appIdeas,
        [appId]: [idea, ...(state.appIdeas[appId] || [])],
      },
    })),
  updateAppIdea: (appId, idea) =>
    set((state) => ({
      appIdeas: {
        ...state.appIdeas,
        [appId]: (state.appIdeas[appId] || []).map((i) =>
          i.id === idea.id ? idea : i
        ),
      },
    })),
  removeAppIdea: (appId, ideaId) =>
    set((state) => ({
      appIdeas: {
        ...state.appIdeas,
        [appId]: (state.appIdeas[appId] || []).filter((i) => i.id !== ideaId),
      },
    })),

  // Global Ideas
  globalIdeas: [],
  setGlobalIdeas: (ideas) => set({ globalIdeas: ideas }),
  addGlobalIdea: (idea) =>
    set((state) => ({ globalIdeas: [idea, ...state.globalIdeas] })),
  updateGlobalIdeaInStore: (idea) =>
    set((state) => ({
      globalIdeas: state.globalIdeas.map((i) =>
        i.id === idea.id ? idea : i
      ),
    })),
  removeGlobalIdea: (id) =>
    set((state) => ({
      globalIdeas: state.globalIdeas.filter((i) => i.id !== id),
    })),

  // Prompt History
  promptHistory: {},
  setPromptHistory: (appId, prompts) =>
    set((state) => ({
      promptHistory: { ...state.promptHistory, [appId]: prompts },
    })),
  addPromptToHistory: (appId, prompt) =>
    set((state) => ({
      promptHistory: {
        ...state.promptHistory,
        [appId]: [prompt, ...(state.promptHistory[appId] || [])],
      },
    })),
}));

// Initialize theme on load
if (typeof window !== 'undefined') {
  const stored = localStorage.getItem('app-dashboard-ui');
  if (stored) {
    try {
      const parsed = JSON.parse(stored);
      if (parsed.state?.theme === 'dark') {
        document.documentElement.classList.add('dark');
      } else {
        document.documentElement.classList.remove('dark');
      }
      if (parsed.state?.isRTL) {
        document.documentElement.dir = 'rtl';
      }
    } catch {
      // Default to dark mode
      document.documentElement.classList.add('dark');
    }
  } else {
    // Default to dark mode
    document.documentElement.classList.add('dark');
  }
}
