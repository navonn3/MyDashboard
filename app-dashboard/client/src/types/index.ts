/**
 * Type Definitions for the Application Dashboard Client
 */

// Platform types
export type DatabasePlatform = 'supabase' | 'firebase' | 'planetscale' | 'custom' | null;
export type FrontendPlatform = 'vercel' | 'netlify' | 'custom' | null;
export type BuildPlatform = 'vibe_coding' | 'vercel' | 'netlify' | 'railway' | 'render' | 'custom';
export type AppStatus = 'active' | 'archived' | 'maintenance';
export type IdeaPriority = 'low' | 'medium' | 'high';
export type IdeaStatus = 'pending' | 'in_progress' | 'completed' | 'cancelled';
export type GlobalIdeaStatus = 'idea' | 'planning' | 'started' | 'converted';
export type GlobalIdeaComplexity = 'simple' | 'medium' | 'complex';
export type PlatformStatus = 'online' | 'offline' | 'building' | 'error' | 'unknown';

// Application entity
export interface Application {
  id: string;
  name: string;
  description?: string;
  github_url?: string;
  codespace_url?: string;
  database_url?: string;
  database_platform?: DatabasePlatform;
  frontend_url?: string;
  frontend_platform?: FrontendPlatform;
  live_url?: string;
  vercel_project_url?: string;
  build_platform: BuildPlatform;
  platform_config?: string;
  status: AppStatus;
  hidden?: boolean;
  created_at: string;
  updated_at: string;
}

// Application note
export interface AppNote {
  id: string;
  app_id: string;
  content: string;
  updated_at: string;
}

// Application idea
export interface AppIdea {
  id: string;
  app_id: string;
  title: string;
  description?: string;
  priority: IdeaPriority;
  status: IdeaStatus;
  created_at: string;
  completed_at?: string;
}

// Global idea for new applications
export interface GlobalIdea {
  id: string;
  title: string;
  description?: string;
  target_platform?: string;
  complexity: GlobalIdeaComplexity;
  status: GlobalIdeaStatus;
  converted_app_id?: string;
  created_at: string;
}

// Settings entry
export interface Setting {
  id: string;
  key: string;
  value?: string;
  hasValue: boolean;
  encrypted: boolean;
  updated_at: string;
}

// Generated prompt
export interface GeneratedPrompt {
  id: string;
  app_id: string;
  ideas_snapshot: AppIdea[];
  generated_prompt: string;
  created_at: string;
}

// Status check result
export interface StatusResult {
  status: PlatformStatus;
  message?: string;
  lastChecked: string;
  details?: Record<string, unknown>;
}

export interface ApplicationStatusCheck {
  live: StatusResult;
  github?: StatusResult;
  database?: StatusResult;
  frontend?: StatusResult;
}

// API response wrapper
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
}

// Form data types for creating/updating entities
export interface CreateApplicationData {
  name: string;
  description?: string;
  github_url?: string;
  database_url?: string;
  database_platform?: DatabasePlatform;
  frontend_url?: string;
  frontend_platform?: FrontendPlatform;
  live_url?: string;
  build_platform: BuildPlatform;
  platform_config?: Record<string, unknown>;
}

export interface CreateIdeaData {
  title: string;
  description?: string;
  priority?: IdeaPriority;
}

export interface CreateGlobalIdeaData {
  title: string;
  description?: string;
  target_platform?: string;
  complexity?: GlobalIdeaComplexity;
}

// Wizard step data
export interface WizardStep1Data {
  name: string;
  description: string;
  build_platform: BuildPlatform;
}

export interface WizardStep2Data {
  github_url: string;
  database_url: string;
  database_platform: DatabasePlatform;
  frontend_url: string;
  frontend_platform: FrontendPlatform;
  live_url: string;
}

export interface WizardStep3Data {
  platform_config: Record<string, string>;
}

export type WizardData = WizardStep1Data & WizardStep2Data & WizardStep3Data;

// Sort and filter options
export interface SortOption {
  column: string;
  order: 'asc' | 'desc';
}

export interface FilterOptions {
  status?: AppStatus | 'all';
  search?: string;
}

// Export data structure
export interface ExportData {
  exportedAt: string;
  applications: Application[];
  notes: AppNote[];
  ideas: AppIdea[];
  globalIdeas: GlobalIdea[];
  generatedPrompts: GeneratedPrompt[];
}

// Keyboard shortcut handler
export interface KeyboardShortcut {
  key: string;
  ctrl?: boolean;
  alt?: boolean;
  shift?: boolean;
  handler: () => void;
  description: string;
}
