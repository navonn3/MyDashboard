/**
 * Database Seeding Script
 * Populates the database with sample data for development
 */

import { v4 as uuidv4 } from 'uuid';
import db, { initializeDatabase } from './database';

function seedDatabase(): void {
  // Initialize tables first
  initializeDatabase();

  // Check if data already exists
  const existingApps = db.prepare('SELECT COUNT(*) as count FROM applications').get() as { count: number };

  if (existingApps.count > 0) {
    console.log('Database already contains data. Skipping seed.');
    return;
  }

  console.log('Seeding database with sample data...');

  // Create sample application
  const appId = uuidv4();
  const insertApp = db.prepare(`
    INSERT INTO applications (id, name, description, github_url, database_url, database_platform,
      frontend_url, frontend_platform, live_url, build_platform, platform_config, status)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  insertApp.run(
    appId,
    'Basketball Broadcast Manager',
    'Web application for syncing Google Sheets schedule data with Israel Basketball API',
    'https://github.com/example/basketball-broadcast-manager',
    'https://supabase.com/dashboard/project/xxxxx',
    'supabase',
    'https://vercel.com/project/basketball-broadcast',
    'vercel',
    'https://basketball-broadcast.vercel.app',
    'vibe_coding',
    JSON.stringify({ vercelProjectId: 'prj_xxxxx' }),
    'active'
  );

  // Create sample notes for the application
  const noteId = uuidv4();
  const insertNote = db.prepare(`
    INSERT INTO app_notes (id, app_id, content)
    VALUES (?, ?, ?)
  `);

  insertNote.run(
    noteId,
    appId,
    '<h2>Project Overview</h2><p>This application manages basketball broadcast schedules and syncs data between Google Sheets and the Israel Basketball API.</p><h3>Key Features</h3><ul><li>Real-time schedule sync</li><li>Automatic broadcast notifications</li><li>Team statistics dashboard</li></ul>'
  );

  // Create sample ideas for the application
  const insertIdea = db.prepare(`
    INSERT INTO app_ideas (id, app_id, title, description, priority, status)
    VALUES (?, ?, ?, ?, ?, ?)
  `);

  const ideas = [
    {
      id: uuidv4(),
      title: 'Add team logo caching',
      description: 'Cache team logos locally to reduce API calls and improve loading performance',
      priority: 'medium',
      status: 'pending'
    },
    {
      id: uuidv4(),
      title: 'Implement real-time score updates',
      description: 'WebSocket connection for live score updates during games. Consider using Supabase Realtime or Socket.io',
      priority: 'high',
      status: 'pending'
    },
    {
      id: uuidv4(),
      title: 'Dark mode support',
      description: 'Add dark mode theme option for better viewing during evening broadcasts',
      priority: 'low',
      status: 'completed'
    }
  ];

  for (const idea of ideas) {
    insertIdea.run(idea.id, appId, idea.title, idea.description, idea.priority, idea.status);
  }

  // Create sample global ideas
  const insertGlobalIdea = db.prepare(`
    INSERT INTO global_ideas (id, title, description, target_platform, complexity, status)
    VALUES (?, ?, ?, ?, ?, ?)
  `);

  const globalIdeas = [
    {
      id: uuidv4(),
      title: 'Personal Finance Tracker',
      description: 'A simple app to track expenses, income, and budgets with visual charts',
      target_platform: 'vercel',
      complexity: 'medium',
      status: 'idea'
    },
    {
      id: uuidv4(),
      title: 'Recipe Collection App',
      description: 'Store and organize family recipes with ingredient scaling and shopping list generation',
      target_platform: 'netlify',
      complexity: 'simple',
      status: 'planning'
    }
  ];

  for (const idea of globalIdeas) {
    insertGlobalIdea.run(idea.id, idea.title, idea.description, idea.target_platform, idea.complexity, idea.status);
  }

  console.log('Database seeded successfully!');
  console.log(`- Created 1 application: ${appId}`);
  console.log(`- Created ${ideas.length} application ideas`);
  console.log(`- Created ${globalIdeas.length} global ideas`);
}

// Run the seed
seedDatabase();
