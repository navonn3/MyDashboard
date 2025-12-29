import type { VercelRequest, VercelResponse } from '@vercel/node';
import { v4 as uuidv4 } from 'uuid';
import { db } from './db';

export default function handler(req: VercelRequest, res: VercelResponse) {
  // Initialize database on first request
  db.init();

  // Enable CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  try {
    if (req.method === 'GET') {
      const { sortBy = 'updated_at', sortOrder = 'desc', status, search } = req.query;

      let apps = [...db.applications];

      // Filter by status
      if (status && status !== 'all') {
        apps = apps.filter(app => app.status === status);
      }

      // Search
      if (search && typeof search === 'string') {
        const searchLower = search.toLowerCase();
        apps = apps.filter(app =>
          app.name.toLowerCase().includes(searchLower) ||
          (app.description?.toLowerCase().includes(searchLower))
        );
      }

      // Sort
      apps.sort((a, b) => {
        const aVal = (a as Record<string, unknown>)[sortBy as string] as string || '';
        const bVal = (b as Record<string, unknown>)[sortBy as string] as string || '';
        return sortOrder === 'desc' ? bVal.localeCompare(aVal) : aVal.localeCompare(bVal);
      });

      return res.json({ success: true, data: apps });
    }

    if (req.method === 'POST') {
      const body = req.body;
      const now = new Date().toISOString();

      const newApp = {
        id: uuidv4(),
        name: body.name,
        description: body.description || undefined,
        github_url: body.github_url || undefined,
        database_url: body.database_url || undefined,
        database_platform: body.database_platform || undefined,
        frontend_url: body.frontend_url || undefined,
        frontend_platform: body.frontend_platform || undefined,
        live_url: body.live_url || undefined,
        build_platform: body.build_platform || 'custom',
        platform_config: body.platform_config ? JSON.stringify(body.platform_config) : undefined,
        status: 'active',
        created_at: now,
        updated_at: now
      };

      db.applications.push(newApp);
      return res.status(201).json({ success: true, data: newApp });
    }

    return res.status(405).json({ success: false, error: 'Method not allowed' });
  } catch (error) {
    console.error('API Error:', error);
    return res.status(500).json({ success: false, error: 'Internal server error' });
  }
}
