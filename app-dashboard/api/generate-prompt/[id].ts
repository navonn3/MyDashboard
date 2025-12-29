import type { VercelRequest, VercelResponse } from '@vercel/node';
import { db } from '../db';

export default function handler(req: VercelRequest, res: VercelResponse) {
  db.init();

  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  const { id } = req.query;

  try {
    const promptIndex = db.generatedPrompts.findIndex(p => p.id === id);

    if (promptIndex === -1) {
      return res.status(404).json({ success: false, error: 'Generated prompt not found' });
    }

    if (req.method === 'GET') {
      return res.json({ success: true, data: db.generatedPrompts[promptIndex] });
    }

    if (req.method === 'DELETE') {
      const deleted = db.generatedPrompts.splice(promptIndex, 1)[0];
      return res.json({ success: true, data: { deleted: deleted.id } });
    }

    return res.status(405).json({ success: false, error: 'Method not allowed' });
  } catch (error) {
    console.error('API Error:', error);
    return res.status(500).json({ success: false, error: 'Internal server error' });
  }
}
