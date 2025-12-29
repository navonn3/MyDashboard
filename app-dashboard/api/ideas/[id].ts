import type { VercelRequest, VercelResponse } from '@vercel/node';
import { db } from '../db';

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
    const ideaIndex = db.ideas.findIndex(i => i.id === id);

    if (ideaIndex === -1) {
      return res.status(404).json({ success: false, error: 'Idea not found' });
    }

    if (req.method === 'GET') {
      return res.json({ success: true, data: db.ideas[ideaIndex] });
    }

    if (req.method === 'PUT') {
      const body = req.body;
      const now = new Date().toISOString();

      // Handle status change to completed
      let completedAt = db.ideas[ideaIndex].completed_at;
      if (body.status === 'completed' && db.ideas[ideaIndex].status !== 'completed') {
        completedAt = now;
      } else if (body.status && body.status !== 'completed') {
        completedAt = undefined;
      }

      db.ideas[ideaIndex] = {
        ...db.ideas[ideaIndex],
        title: body.title || db.ideas[ideaIndex].title,
        description: body.description !== undefined ? body.description : db.ideas[ideaIndex].description,
        priority: body.priority || db.ideas[ideaIndex].priority,
        status: body.status || db.ideas[ideaIndex].status,
        completed_at: completedAt
      };

      return res.json({ success: true, data: db.ideas[ideaIndex] });
    }

    if (req.method === 'DELETE') {
      const deleted = db.ideas.splice(ideaIndex, 1)[0];
      return res.json({ success: true, data: { deleted: deleted.id } });
    }

    return res.status(405).json({ success: false, error: 'Method not allowed' });
  } catch (error) {
    console.error('API Error:', error);
    return res.status(500).json({ success: false, error: 'Internal server error' });
  }
}
