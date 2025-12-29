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
    const idea = db.globalIdeas.find(i => i.id === id);

    if (!idea) {
      return res.status(404).json({ success: false, error: 'Global idea not found' });
    }

    if (req.method === 'POST') {
      // Return prefill data for creating a new application from this idea
      const prefill = {
        name: idea.title,
        description: idea.description,
        build_platform: idea.target_platform || 'custom'
      };

      return res.json({
        success: true,
        data: {
          prefill,
          globalIdeaId: idea.id
        }
      });
    }

    return res.status(405).json({ success: false, error: 'Method not allowed' });
  } catch (error) {
    console.error('API Error:', error);
    return res.status(500).json({ success: false, error: 'Internal server error' });
  }
}
