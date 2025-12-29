import type { VercelRequest, VercelResponse } from '@vercel/node';
import { v4 as uuidv4 } from 'uuid';
import { db } from '../db';

export default function handler(req: VercelRequest, res: VercelResponse) {
  db.init();

  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  try {
    if (req.method === 'GET') {
      const { status, complexity, sortBy = 'created_at', sortOrder = 'desc' } = req.query;

      let ideas = [...db.globalIdeas];

      if (status && status !== 'all') {
        ideas = ideas.filter(i => i.status === status);
      }
      if (complexity && complexity !== 'all') {
        ideas = ideas.filter(i => i.complexity === complexity);
      }

      ideas.sort((a, b) => {
        const aVal = (a as Record<string, unknown>)[sortBy as string] as string || '';
        const bVal = (b as Record<string, unknown>)[sortBy as string] as string || '';
        return sortOrder === 'desc' ? bVal.localeCompare(aVal) : aVal.localeCompare(bVal);
      });

      return res.json({ success: true, data: ideas });
    }

    if (req.method === 'POST') {
      const body = req.body;
      const now = new Date().toISOString();

      const newIdea = {
        id: uuidv4(),
        title: body.title,
        description: body.description || undefined,
        target_platform: body.target_platform || undefined,
        complexity: body.complexity || 'medium',
        status: 'idea',
        created_at: now
      };

      db.globalIdeas.push(newIdea);
      return res.status(201).json({ success: true, data: newIdea });
    }

    return res.status(405).json({ success: false, error: 'Method not allowed' });
  } catch (error) {
    console.error('API Error:', error);
    return res.status(500).json({ success: false, error: 'Internal server error' });
  }
}
