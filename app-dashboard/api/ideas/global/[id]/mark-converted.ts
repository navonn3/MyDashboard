import type { VercelRequest, VercelResponse } from '@vercel/node';
import { db } from '../../../db';

export default function handler(req: VercelRequest, res: VercelResponse) {
  db.init();

  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  const { id } = req.query;

  try {
    const ideaIndex = db.globalIdeas.findIndex(i => i.id === id);

    if (ideaIndex === -1) {
      return res.status(404).json({ success: false, error: 'Global idea not found' });
    }

    if (req.method === 'POST') {
      const { appId } = req.body;

      if (!appId) {
        return res.status(400).json({ success: false, error: 'appId is required' });
      }

      // Verify the app exists
      const app = db.applications.find(a => a.id === appId);
      if (!app) {
        return res.status(404).json({ success: false, error: 'Application not found' });
      }

      // Update the global idea
      db.globalIdeas[ideaIndex] = {
        ...db.globalIdeas[ideaIndex],
        status: 'converted',
        converted_app_id: appId
      };

      return res.json({ success: true, data: db.globalIdeas[ideaIndex] });
    }

    return res.status(405).json({ success: false, error: 'Method not allowed' });
  } catch (error) {
    console.error('API Error:', error);
    return res.status(500).json({ success: false, error: 'Internal server error' });
  }
}
