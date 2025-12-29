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

  const { id } = req.query;

  try {
    const app = db.applications.find(a => a.id === id);

    if (!app) {
      return res.status(404).json({ success: false, error: 'Application not found' });
    }

    if (req.method === 'GET') {
      // In serverless mode, we can't make external HTTP requests reliably
      // Return a simulated status based on app data
      const statusCheck = {
        app_id: app.id,
        live_url_status: app.live_url ? 'unknown' : null,
        github_status: app.github_url ? 'unknown' : null,
        last_checked: new Date().toISOString(),
        message: 'Status checks not available in serverless mode'
      };

      return res.json({ success: true, data: statusCheck });
    }

    return res.status(405).json({ success: false, error: 'Method not allowed' });
  } catch (error) {
    console.error('API Error:', error);
    return res.status(500).json({ success: false, error: 'Internal server error' });
  }
}
