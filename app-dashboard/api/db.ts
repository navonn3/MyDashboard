/**
 * In-memory database for Vercel Serverless
 * Data persists within the same function instance but resets on cold starts
 */

import { v4 as uuidv4 } from 'uuid';

// Types
export interface Application {
  id: string;
  name: string;
  description?: string;
  github_url?: string;
  database_url?: string;
  database_platform?: string;
  frontend_url?: string;
  frontend_platform?: string;
  live_url?: string;
  build_platform: string;
  platform_config?: string;
  status: string;
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

// In-memory data store
class Database {
  applications: Application[] = [];
  notes: AppNote[] = [];
  ideas: AppIdea[] = [];
  globalIdeas: GlobalIdea[] = [];
  settings: Setting[] = [];
  initialized = false;

  init() {
    if (this.initialized) return;
    this.seed();
    this.initialized = true;
  }

  seed() {
    const now = new Date().toISOString();

    // Seed applications
    this.applications = [
      {
        id: uuidv4(),
        name: 'תיק עבודות - שדרן ספורט',
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
        id: uuidv4(),
        name: 'Blue-Basket',
        description: 'Basketball game data management with PDF generation',
        github_url: 'https://github.com/navonn3/BlueBasket_Supabase',
        database_url: 'https://supabase.com/dashboard/project/tykzjhywnrhtkqppgdyn',
        database_platform: 'supabase',
        frontend_url: 'https://vercel.com/matans-projects-827d0407/blue-basket',
        frontend_platform: 'vercel',
        live_url: 'https://blue-basket-supabase.vercel.app/',
        build_platform: 'vercel',
        status: 'active',
        created_at: now,
        updated_at: now
      },
      {
        id: uuidv4(),
        name: 'Recap-Writer',
        description: 'AI Basketball Narrator - Generates game recaps using AI',
        github_url: 'https://github.com/navonn3/recap-writer',
        frontend_url: 'https://vercel.com/matans-projects-827d0407/recap-writer',
        frontend_platform: 'vercel',
        live_url: 'https://recap-writer.vercel.app/',
        build_platform: 'vercel',
        status: 'active',
        created_at: now,
        updated_at: now
      },
      {
        id: uuidv4(),
        name: 'Auto-Pod (SportFlash AI)',
        description: 'מבזק הספורט האישי - Personal sports flash news generator',
        github_url: 'https://github.com/navonn3/auto-pod',
        database_url: 'https://supabase.com/dashboard/project/owsjezhdlmxsnmozopvo',
        database_platform: 'supabase',
        frontend_url: 'https://vercel.com/matans-projects-827d0407/auto-pod',
        frontend_platform: 'vercel',
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
        id: uuidv4(),
        name: 'איפה כולם?',
        description: 'BASE44 Application - Location/presence tracking app',
        live_url: 'https://efokulam.base44.app/',
        build_platform: 'custom',
        platform_config: JSON.stringify({ platform: 'BASE44' }),
        status: 'active',
        created_at: now,
        updated_at: now
      },
      {
        id: uuidv4(),
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
        id: uuidv4(),
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

    // Seed some ideas
    const blueBasketId = this.applications[1].id;
    const recapWriterId = this.applications[2].id;
    const autoPodId = this.applications[3].id;

    this.ideas = [
      { id: uuidv4(), app_id: blueBasketId, title: 'Add more PDF templates', description: 'Create additional PDF layouts', priority: 'medium', status: 'pending', created_at: now },
      { id: uuidv4(), app_id: blueBasketId, title: 'Improve scraper performance', description: 'Optimize mega-scraper', priority: 'high', status: 'pending', created_at: now },
      { id: uuidv4(), app_id: recapWriterId, title: 'Multi-language support', description: 'Add Hebrew language output', priority: 'high', status: 'pending', created_at: now },
      { id: uuidv4(), app_id: autoPodId, title: 'Add podcast audio generation', description: 'Generate audio podcasts', priority: 'high', status: 'pending', created_at: now }
    ];

    // Seed global ideas
    this.globalIdeas = [
      { id: uuidv4(), title: 'Basketball Stats Dashboard', description: 'Unified dashboard showing stats from all apps', target_platform: 'vercel', complexity: 'complex', status: 'idea', created_at: now },
      { id: uuidv4(), title: 'Sports Calendar Integration', description: 'Sync all game schedules to one calendar', target_platform: 'vercel', complexity: 'medium', status: 'planning', created_at: now }
    ];
  }
}

// Singleton instance
export const db = new Database();
