import type { VercelRequest, VercelResponse } from '@vercel/node';
import { db } from '../../db';

export default function handler(req: VercelRequest, res: VercelResponse) {
  db.init();

  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  const { appId, limit } = req.query;

  try {
    // Check if app exists
    const app = db.applications.find(a => a.id === appId);
    if (!app) {
      return res.status(404).json({ success: false, error: 'Application not found' });
    }

    if (req.method === 'GET') {
      let prompts = db.generatedPrompts
        .filter(p => p.app_id === appId)
        .sort((a, b) => b.created_at.localeCompare(a.created_at));

      if (limit && typeof limit === 'string') {
        const limitNum = parseInt(limit, 10);
        if (!isNaN(limitNum) && limitNum > 0) {
          prompts = prompts.slice(0, limitNum);
        }
      }

      return res.json({ success: true, data: prompts });
    }

    return res.status(405).json({ success: false, error: 'Method not allowed' });
  } catch (error) {
    console.error('API Error:', error);
    return res.status(500).json({ success: false, error: 'Internal server error' });
  }
}
