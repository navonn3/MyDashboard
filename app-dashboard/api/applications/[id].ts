import type { VercelRequest, VercelResponse } from '@vercel/node';
import { db } from '../db';

export default function handler(req: VercelRequest, res: VercelResponse) {
  db.init();

  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  const { id } = req.query;

  try {
    const appIndex = db.applications.findIndex(a => a.id === id);

    if (appIndex === -1) {
      return res.status(404).json({ success: false, error: 'Application not found' });
    }

    if (req.method === 'GET') {
      return res.json({ success: true, data: db.applications[appIndex] });
    }

    if (req.method === 'PUT') {
      const body = req.body;
      const now = new Date().toISOString();

      db.applications[appIndex] = {
        ...db.applications[appIndex],
        ...body,
        platform_config: body.platform_config ? JSON.stringify(body.platform_config) : db.applications[appIndex].platform_config,
        updated_at: now
      };

      return res.json({ success: true, data: db.applications[appIndex] });
    }

    if (req.method === 'DELETE') {
      const deleted = db.applications.splice(appIndex, 1)[0];
      // Also delete related notes and ideas
      db.notes = db.notes.filter(n => n.app_id !== id);
      db.ideas = db.ideas.filter(i => i.app_id !== id);
      return res.json({ success: true, data: deleted });
    }

    return res.status(405).json({ success: false, error: 'Method not allowed' });
  } catch (error) {
    console.error('API Error:', error);
    return res.status(500).json({ success: false, error: 'Internal server error' });
  }
}
