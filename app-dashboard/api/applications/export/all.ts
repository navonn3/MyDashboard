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

  try {
    if (req.method === 'GET') {
      const exportData = {
        applications: db.applications,
        notes: db.notes,
        ideas: db.ideas,
        globalIdeas: db.globalIdeas,
        settings: db.settings.map(s => ({
          ...s,
          value: s.encrypted ? '[ENCRYPTED]' : s.value
        })),
        exportedAt: new Date().toISOString(),
        version: '1.0.0'
      };

      return res.json({ success: true, data: exportData });
    }

    return res.status(405).json({ success: false, error: 'Method not allowed' });
  } catch (error) {
    console.error('API Error:', error);
    return res.status(500).json({ success: false, error: 'Internal server error' });
  }
}
