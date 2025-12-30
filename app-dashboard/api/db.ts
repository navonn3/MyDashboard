/**
 * Vercel KV Database for persistent storage
 * Data persists across serverless function invocations
 */

import { kv } from '@vercel/kv';
import { v4 as uuidv4 } from 'uuid';

// Types
export interface Application {
  id: string;
  name: string;
  description?: string;
  github_url?: string;
  codespace_url?: string;
  database_url?: string;
  database_platform?: string;
  frontend_url?: string;
  frontend_platform?: string;
  live_url?: string;
  vercel_project_url?: string;
  build_platform: string;
  platform_config?: string;
  status: string;
  hidden?: boolean;
  created_at: string;
  updated_at: string;
}

export interface AppNote {
  id: string;
  app_id: string;
  content: string;
  updated_at: string;
}

export interface AppIdea {
  id: string;
  app_id: string;
  title: string;
  description?: string;
  priority: string;
  status: string;
  created_at: string;
  completed_at?: string;
}

export interface GlobalIdea {
  id: string;
  title: string;
  description?: string;
  target_platform?: string;
  complexity: string;
  status: string;
  converted_app_id?: string;
  created_at: string;
}

export interface Setting {
  id: string;
  key: string;
  value: string;
  encrypted: number;
  updated_at: string;
}

export interface GeneratedPrompt {
  id: string;
  app_id: string;
  prompt: string;
  ideas_count: number;
  idea_ids: string[];
  created_at: string;
}

// KV Keys
const KEYS = {
  applications: 'dashboard:applications',
  notes: 'dashboard:notes',
  ideas: 'dashboard:ideas',
  globalIdeas: 'dashboard:globalIdeas',
  settings: 'dashboard:settings',
  generatedPrompts: 'dashboard:generatedPrompts',
  initialized: 'dashboard:initialized'
};

// Seed data
function getSeedData() {
  const now = new Date().toISOString();

  const APP_IDS = {
    portfolio: 'app-001-portfolio-sports',
    blueBasket: 'app-002-blue-basket',
    recapWriter: 'app-003-recap-writer',
    autoPod: 'app-004-auto-pod',
    efoKulam: 'app-005-efo-kulam',
    avigdor: 'app-006-avigdor',
    sportFlash: 'app-007-sportflash-base44',
    myDashboard: 'app-008-my-dashboard'
  };

  const applications: Application[] = [
    {
      id: APP_IDS.myDashboard,
      name: 'MyDashboard',
      description: 'Application management dashboard - this app!',
      github_url: 'https://github.com/navonn3/MyDashboard',
      frontend_url: 'https://vercel.com/matans-projects-827d0407/my-dashboard',
      frontend_platform: 'vercel',
      live_url: 'https://my-dashboard-liart.vercel.app/',
      vercel_project_url: 'https://vercel.com/matans-projects-827d0407/my-dashboard',
      build_platform: 'vercel',
      status: 'active',
      created_at: now,
      updated_at: now
    },
    {
      id: APP_IDS.portfolio,
      name: 'Portfolio Sports Broadcaster',
      description: 'Sports Broadcaster Portfolio - Personal portfolio website',
      frontend_url: 'https://app.netlify.com/projects/navon-portfolio/overview',
      frontend_platform: 'netlify',
      live_url: 'https://navon-portfolio.netlify.app/',
      build_platform: 'netlify',
      status: 'active',
      created_at: now,
      updated_at: now
    },
    {
      id: APP_IDS.blueBasket,
      name: 'Blue-Basket',
      description: 'Basketball game data management with PDF generation',
      github_url: 'https://github.com/navonn3/BlueBasket_Supabase',
      database_url: 'https://supabase.com/dashboard/project/tykzjhywnrhtkqppgdyn',
      database_platform: 'supabase',
      frontend_url: 'https://vercel.com/matans-projects-827d0407/blue-basket',
      frontend_platform: 'vercel',
      vercel_project_url: 'https://vercel.com/matans-projects-827d0407/blue-basket',
      live_url: 'https://blue-basket-supabase.vercel.app/',
      build_platform: 'vercel',
      status: 'active',
      created_at: now,
      updated_at: now
    },
    {
      id: APP_IDS.recapWriter,
      name: 'Recap-Writer',
      description: 'AI Basketball Narrator - Generates game recaps using AI',
      github_url: 'https://github.com/navonn3/recap-writer',
      frontend_url: 'https://vercel.com/matans-projects-827d0407/recap-writer',
      frontend_platform: 'vercel',
      vercel_project_url: 'https://vercel.com/matans-projects-827d0407/recap-writer',
      live_url: 'https://recap-writer.vercel.app/',
      build_platform: 'vercel',
      status: 'active',
      created_at: now,
      updated_at: now
    },
    {
      id: APP_IDS.autoPod,
      name: 'Auto-Pod (SportFlash AI)',
      description: 'Personal sports flash news generator',
      github_url: 'https://github.com/navonn3/auto-pod',
      database_url: 'https://supabase.com/dashboard/project/owsjezhdlmxsnmozopvo',
      database_platform: 'supabase',
      frontend_url: 'https://vercel.com/matans-projects-827d0407/auto-pod',
      frontend_platform: 'vercel',
      vercel_project_url: 'https://vercel.com/matans-projects-827d0407/auto-pod',
      live_url: 'https://auto-pod-xi.vercel.app/',
      build_platform: 'railway',
      platform_config: JSON.stringify({
        railwayProject: 'https://railway.com/project/86abd298-a219-48fd-a4e5-a69f5e7a98fc'
      }),
      status: 'active',
      created_at: now,
      updated_at: now
    },
    {
      id: APP_IDS.efoKulam,
      name: 'Efo Kulam',
      description: 'BASE44 Application - Location/presence tracking app',
      live_url: 'https://efokulam.base44.app/',
      build_platform: 'custom',
      platform_config: JSON.stringify({ platform: 'BASE44' }),
      status: 'active',
      created_at: now,
      updated_at: now
    },
    {
      id: APP_IDS.avigdor,
      name: 'Avigdor',
      description: 'BASE44 Application',
      live_url: 'https://avigdor.base44.app/',
      build_platform: 'custom',
      platform_config: JSON.stringify({ platform: 'BASE44' }),
      status: 'active',
      created_at: now,
      updated_at: now
    },
    {
      id: APP_IDS.sportFlash,
      name: 'SportFlash AI (Base44)',
      description: 'BASE44 version of SportFlash AI',
      live_url: 'https://sport-flash-ai-da67a094.base44.app/',
      build_platform: 'custom',
      platform_config: JSON.stringify({ platform: 'BASE44' }),
      status: 'active',
      created_at: now,
      updated_at: now
    }
  ];

  const ideas: AppIdea[] = [
    { id: 'idea-001', app_id: APP_IDS.blueBasket, title: 'Add more PDF templates', description: 'Create additional PDF layouts', priority: 'medium', status: 'pending', created_at: now },
    { id: 'idea-002', app_id: APP_IDS.blueBasket, title: 'Improve scraper performance', description: 'Optimize mega-scraper', priority: 'high', status: 'pending', created_at: now },
    { id: 'idea-003', app_id: APP_IDS.recapWriter, title: 'Multi-language support', description: 'Add Hebrew language output', priority: 'high', status: 'pending', created_at: now },
    { id: 'idea-004', app_id: APP_IDS.autoPod, title: 'Add podcast audio generation', description: 'Generate audio podcasts', priority: 'high', status: 'pending', created_at: now }
  ];

  const globalIdeas: GlobalIdea[] = [
    { id: 'global-idea-001', title: 'Basketball Stats Dashboard', description: 'Unified dashboard showing stats from all apps', target_platform: 'vercel', complexity: 'complex', status: 'idea', created_at: now },
    { id: 'global-idea-002', title: 'Sports Calendar Integration', description: 'Sync all game schedules to one calendar', target_platform: 'vercel', complexity: 'medium', status: 'planning', created_at: now }
  ];

  return { applications, ideas, globalIdeas, notes: [] as AppNote[], settings: [] as Setting[], generatedPrompts: [] as GeneratedPrompt[] };
}

// Database class with KV persistence
class Database {
  private cache: {
    applications?: Application[];
    notes?: AppNote[];
    ideas?: AppIdea[];
    globalIdeas?: GlobalIdea[];
    settings?: Setting[];
    generatedPrompts?: GeneratedPrompt[];
  } = {};

  async init(): Promise<void> {
    try {
      const initialized = await kv.get<boolean>(KEYS.initialized);

      if (!initialized) {
        // First time - seed the database
        const seed = getSeedData();
        await Promise.all([
          kv.set(KEYS.applications, seed.applications),
          kv.set(KEYS.notes, seed.notes),
          kv.set(KEYS.ideas, seed.ideas),
          kv.set(KEYS.globalIdeas, seed.globalIdeas),
          kv.set(KEYS.settings, seed.settings),
          kv.set(KEYS.generatedPrompts, seed.generatedPrompts),
          kv.set(KEYS.initialized, true)
        ]);
        console.log('Database seeded successfully');
      }
    } catch (error) {
      console.error('KV init error:', error);
      // Fallback to in-memory if KV not configured
    }
  }

  // Applications
  async getApplications(): Promise<Application[]> {
    if (this.cache.applications) return this.cache.applications;
    try {
      const apps = await kv.get<Application[]>(KEYS.applications);
      this.cache.applications = apps || getSeedData().applications;
      return this.cache.applications;
    } catch {
      return getSeedData().applications;
    }
  }

  async setApplications(apps: Application[]): Promise<void> {
    this.cache.applications = apps;
    try {
      await kv.set(KEYS.applications, apps);
    } catch (error) {
      console.error('Failed to save applications:', error);
    }
  }

  // Notes
  async getNotes(): Promise<AppNote[]> {
    if (this.cache.notes) return this.cache.notes;
    try {
      const notes = await kv.get<AppNote[]>(KEYS.notes);
      this.cache.notes = notes || [];
      return this.cache.notes;
    } catch {
      return [];
    }
  }

  async setNotes(notes: AppNote[]): Promise<void> {
    this.cache.notes = notes;
    try {
      await kv.set(KEYS.notes, notes);
    } catch (error) {
      console.error('Failed to save notes:', error);
    }
  }

  // Ideas
  async getIdeas(): Promise<AppIdea[]> {
    if (this.cache.ideas) return this.cache.ideas;
    try {
      const ideas = await kv.get<AppIdea[]>(KEYS.ideas);
      this.cache.ideas = ideas || getSeedData().ideas;
      return this.cache.ideas;
    } catch {
      return getSeedData().ideas;
    }
  }

  async setIdeas(ideas: AppIdea[]): Promise<void> {
    this.cache.ideas = ideas;
    try {
      await kv.set(KEYS.ideas, ideas);
    } catch (error) {
      console.error('Failed to save ideas:', error);
    }
  }

  // Global Ideas
  async getGlobalIdeas(): Promise<GlobalIdea[]> {
    if (this.cache.globalIdeas) return this.cache.globalIdeas;
    try {
      const ideas = await kv.get<GlobalIdea[]>(KEYS.globalIdeas);
      this.cache.globalIdeas = ideas || getSeedData().globalIdeas;
      return this.cache.globalIdeas;
    } catch {
      return getSeedData().globalIdeas;
    }
  }

  async setGlobalIdeas(ideas: GlobalIdea[]): Promise<void> {
    this.cache.globalIdeas = ideas;
    try {
      await kv.set(KEYS.globalIdeas, ideas);
    } catch (error) {
      console.error('Failed to save global ideas:', error);
    }
  }

  // Settings
  async getSettings(): Promise<Setting[]> {
    if (this.cache.settings) return this.cache.settings;
    try {
      const settings = await kv.get<Setting[]>(KEYS.settings);
      this.cache.settings = settings || [];
      return this.cache.settings;
    } catch {
      return [];
    }
  }

  async setSettings(settings: Setting[]): Promise<void> {
    this.cache.settings = settings;
    try {
      await kv.set(KEYS.settings, settings);
    } catch (error) {
      console.error('Failed to save settings:', error);
    }
  }

  // Generated Prompts
  async getGeneratedPrompts(): Promise<GeneratedPrompt[]> {
    if (this.cache.generatedPrompts) return this.cache.generatedPrompts;
    try {
      const prompts = await kv.get<GeneratedPrompt[]>(KEYS.generatedPrompts);
      this.cache.generatedPrompts = prompts || [];
      return this.cache.generatedPrompts;
    } catch {
      return [];
    }
  }

  async setGeneratedPrompts(prompts: GeneratedPrompt[]): Promise<void> {
    this.cache.generatedPrompts = prompts;
    try {
      await kv.set(KEYS.generatedPrompts, prompts);
    } catch (error) {
      console.error('Failed to save generated prompts:', error);
    }
  }

  // Reset database (for testing/admin)
  async reset(): Promise<void> {
    const seed = getSeedData();
    this.cache = {};
    await Promise.all([
      kv.set(KEYS.applications, seed.applications),
      kv.set(KEYS.notes, seed.notes),
      kv.set(KEYS.ideas, seed.ideas),
      kv.set(KEYS.globalIdeas, seed.globalIdeas),
      kv.set(KEYS.settings, seed.settings),
      kv.set(KEYS.generatedPrompts, seed.generatedPrompts),
      kv.set(KEYS.initialized, true)
    ]);
  }
}

// Singleton instance
export const db = new Database();
