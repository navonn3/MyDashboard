/**
 * Type Definitions for the Application Dashboard
 */

// Application entity
export interface Application {
  id: string;
  name: string;
  description?: string;
  github_url?: string;
  database_url?: string;
  database_platform?: 'supabase' | 'firebase' | 'planetscale' | 'custom' | null;
  frontend_url?: string;
  frontend_platform?: 'vercel' | 'netlify' | 'custom' | null;
  live_url?: string;
  build_platform: 'vibe_coding' | 'vercel' | 'netlify' | 'railway' | 'render' | 'custom';
  platform_config?: string; // JSON string of platform-specific config
  status: 'active' | 'archived' | 'maintenance';
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
  priority: 'low' | 'medium' | 'high';
  status: 'pending' | 'in_progress' | 'completed' | 'cancelled';
  created_at: string;
  completed_at?: string;
}

// Global idea for new applications
export interface GlobalIdea {
  id: string;
  title: string;
  description?: string;
  target_platform?: string;
  complexity: 'simple' | 'medium' | 'complex';
  status: 'idea' | 'planning' | 'started' | 'converted';
  converted_app_id?: string;
  created_at: string;
}

// Settings entry
export interface Setting {
  id: string;
  key: string;
  value: string;
  encrypted: boolean;
  updated_at: string;
}

// Generated prompt history
export interface GeneratedPrompt {
  id: string;
  app_id: string;
  ideas_snapshot: string; // JSON string
  generated_prompt: string;
  created_at: string;
}

// API Request/Response types
export interface CreateApplicationRequest {
  name: string;
  description?: string;
  github_url?: string;
  database_url?: string;
  database_platform?: string;
  frontend_url?: string;
  frontend_platform?: string;
  live_url?: string;
  build_platform: string;
  platform_config?: Record<string, unknown>;
}

export interface UpdateApplicationRequest extends Partial<CreateApplicationRequest> {
  status?: 'active' | 'archived' | 'maintenance';
}

export interface CreateIdeaRequest {
  title: string;
  description?: string;
  priority?: 'low' | 'medium' | 'high';
}

export interface UpdateIdeaRequest extends Partial<CreateIdeaRequest> {
  status?: 'pending' | 'in_progress' | 'completed' | 'cancelled';
}

export interface CreateGlobalIdeaRequest {
  title: string;
  description?: string;
  target_platform?: string;
  complexity?: 'simple' | 'medium' | 'complex';
}

export interface UpdateGlobalIdeaRequest extends Partial<CreateGlobalIdeaRequest> {
  status?: 'idea' | 'planning' | 'started' | 'converted';
}

export interface GeneratePromptRequest {
  appId: string;
  ideaIds?: string[]; // Optional: specific ideas to include, defaults to all pending/in_progress
}

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
}
