import type { VercelRequest, VercelResponse } from '@vercel/node';
import { db } from '../../db';

export default function handler(req: VercelRequest, res: VercelResponse) {
  db.init();

  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, PUT, DELETE, OPTIONS');
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

    if (req.method === 'GET') {
      return res.json({ success: true, data: db.globalIdeas[ideaIndex] });
    }

    if (req.method === 'PUT') {
      const body = req.body;

      db.globalIdeas[ideaIndex] = {
        ...db.globalIdeas[ideaIndex],
        title: body.title || db.globalIdeas[ideaIndex].title,
        description: body.description !== undefined ? body.description : db.globalIdeas[ideaIndex].description,
        target_platform: body.target_platform || db.globalIdeas[ideaIndex].target_platform,
        complexity: body.complexity || db.globalIdeas[ideaIndex].complexity,
        status: body.status || db.globalIdeas[ideaIndex].status
      };

      return res.json({ success: true, data: db.globalIdeas[ideaIndex] });
    }

    if (req.method === 'DELETE') {
      const deleted = db.globalIdeas.splice(ideaIndex, 1)[0];
      return res.json({ success: true, data: { deleted: deleted.id } });
    }

    return res.status(405).json({ success: false, error: 'Method not allowed' });
  } catch (error) {
    console.error('API Error:', error);
    return res.status(500).json({ success: false, error: 'Internal server error' });
  }
}
