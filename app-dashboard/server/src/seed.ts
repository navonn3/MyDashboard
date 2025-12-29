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

  const insertApp = db.prepare(`
    INSERT INTO applications (id, name, description, github_url, database_url, database_platform,
      frontend_url, frontend_platform, live_url, build_platform, platform_config, status)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  const insertNote = db.prepare(`
    INSERT INTO app_notes (id, app_id, content)
    VALUES (?, ?, ?)
  `);

  const insertIdea = db.prepare(`
    INSERT INTO app_ideas (id, app_id, title, description, priority, status)
    VALUES (?, ?, ?, ?, ?, ?)
  `);

  // ============== Application 1: Sports Portfolio ==============
  const portfolioId = uuidv4();
  insertApp.run(
    portfolioId,
    'תיק עבודות - שדרן ספורט',
    'Sports Broadcaster Portfolio - Personal portfolio website showcasing sports broadcasting work',
    null,
    null,
    null,
    'https://app.netlify.com/projects/navon-portfolio/overview',
    'netlify',
    'https://navon-portfolio.netlify.app/',
    'netlify',
    null,
    'active'
  );

  // ============== Application 2: Blue-Basket ==============
  const blueBasketId = uuidv4();
  insertApp.run(
    blueBasketId,
    'Blue-Basket',
    'Basketball game data management system with PDF generation for game day reports',
    'https://github.com/navonn3/BlueBasket_Supabase',
    'https://supabase.com/dashboard/project/tykzjhywnrhtkqppgdyn',
    'supabase',
    'https://vercel.com/matans-projects-827d0407/blue-basket',
    'vercel',
    'https://blue-basket-supabase.vercel.app/',
    'vercel',
    JSON.stringify({
      scraperRepo: 'https://github.com/navonn3/mega-scraper',
      pdfExample: 'https://blue-basket-supabase.vercel.app/gamedaypdf?id=1_741621&type=basic'
    }),
    'active'
  );

  insertIdea.run(uuidv4(), blueBasketId, 'Add more PDF templates', 'Create additional PDF layouts for different game types', 'medium', 'pending');
  insertIdea.run(uuidv4(), blueBasketId, 'Improve scraper performance', 'Optimize mega-scraper for faster data collection', 'high', 'pending');

  // ============== Application 3: Recap-Writer ==============
  const recapWriterId = uuidv4();
  insertApp.run(
    recapWriterId,
    'Recap-Writer',
    'AI Basketball Narrator - Generates game recaps and narratives using AI',
    'https://github.com/navonn3/recap-writer',
    null,
    null,
    'https://vercel.com/matans-projects-827d0407/recap-writer',
    'vercel',
    'https://recap-writer.vercel.app/',
    'vercel',
    null,
    'active'
  );

  insertIdea.run(uuidv4(), recapWriterId, 'Multi-language support', 'Add Hebrew language output for game recaps', 'high', 'pending');
  insertIdea.run(uuidv4(), recapWriterId, 'Euroleague integration', 'Parse play-by-play data from Euroleague website', 'medium', 'pending');

  // ============== Application 4: Auto-Pod (SportFlash AI) ==============
  const autoPodId = uuidv4();
  insertApp.run(
    autoPodId,
    'Auto-Pod (SportFlash AI)',
    'מבזק הספורט האישי - Personal sports flash news generator with AI',
    'https://github.com/navonn3/auto-pod',
    'https://supabase.com/dashboard/project/owsjezhdlmxsnmozopvo',
    'supabase',
    'https://vercel.com/matans-projects-827d0407/auto-pod',
    'vercel',
    'https://auto-pod-xi.vercel.app/',
    'railway',
    JSON.stringify({
      railwayProject: 'https://railway.com/project/86abd298-a219-48fd-a4e5-a69f5e7a98fc',
      gnewsApi: 'https://docs.gnews.io/endpoints/search-endpoint'
    }),
    'active'
  );

  insertIdea.run(uuidv4(), autoPodId, 'Add podcast audio generation', 'Generate audio podcasts from sports news', 'high', 'pending');
  insertIdea.run(uuidv4(), autoPodId, 'Personalized news feed', 'Allow users to customize sports topics', 'medium', 'pending');

  // ============== Application 5: איפה כולם? (BASE44) ==============
  const efokulamId = uuidv4();
  insertApp.run(
    efokulamId,
    'איפה כולם?',
    'BASE44 Application - Location/presence tracking app',
    null,
    null,
    null,
    null,
    null,
    'https://efokulam.base44.app/',
    'custom',
    JSON.stringify({ platform: 'BASE44' }),
    'active'
  );

  // ============== Application 6: Avigdor (BASE44) ==============
  const avigdorId = uuidv4();
  insertApp.run(
    avigdorId,
    'Avigdor',
    'BASE44 Application - Avigdor app',
    null,
    null,
    null,
    null,
    null,
    'https://avigdor.base44.app/',
    'custom',
    JSON.stringify({ platform: 'BASE44' }),
    'active'
  );

  // ============== Application 7: SportFlash AI (BASE44 version) ==============
  const sportFlashId = uuidv4();
  insertApp.run(
    sportFlashId,
    'SportFlash AI (Base44)',
    'BASE44 version of SportFlash AI sports news app',
    null,
    null,
    null,
    null,
    null,
    'https://sport-flash-ai-da67a094.base44.app/',
    'custom',
    JSON.stringify({ platform: 'BASE44' }),
    'active'
  );

  // Create sample global ideas
  const insertGlobalIdea = db.prepare(`
    INSERT INTO global_ideas (id, title, description, target_platform, complexity, status)
    VALUES (?, ?, ?, ?, ?, ?)
  `);

  const globalIdeas = [
    {
      id: uuidv4(),
      title: 'Basketball Stats Dashboard',
      description: 'Unified dashboard showing stats from all basketball-related apps',
      target_platform: 'vercel',
      complexity: 'complex',
      status: 'idea'
    },
    {
      id: uuidv4(),
      title: 'Sports Calendar Integration',
      description: 'Sync all game schedules across apps to a single calendar',
      target_platform: 'vercel',
      complexity: 'medium',
      status: 'planning'
    }
  ];

  for (const idea of globalIdeas) {
    insertGlobalIdea.run(idea.id, idea.title, idea.description, idea.target_platform, idea.complexity, idea.status);
  }

  console.log('Database seeded successfully!');
  console.log('Created 7 applications:');
  console.log('  - תיק עבודות (Portfolio) - Netlify');
  console.log('  - Blue-Basket - Vercel + Supabase');
  console.log('  - Recap-Writer - Vercel');
  console.log('  - Auto-Pod (SportFlash AI) - Vercel + Railway + Supabase');
  console.log('  - איפה כולם? - BASE44');
  console.log('  - Avigdor - BASE44');
  console.log('  - SportFlash AI - BASE44');
  console.log(`Created ${globalIdeas.length} global ideas`);
}

// Run the seed
seedDatabase();
