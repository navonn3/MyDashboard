import type { VercelRequest, VercelResponse } from '@vercel/node';
import { v4 as uuidv4 } from 'uuid';
import { db } from '../../db';

export default function handler(req: VercelRequest, res: VercelResponse) {
  db.init();

  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  const { appId } = req.query;

  try {
    // Check if app exists
    const app = db.applications.find(a => a.id === appId);
    if (!app) {
      return res.status(404).json({ success: false, error: 'Application not found' });
    }

    if (req.method === 'GET') {
      const { status, priority, sortBy = 'created_at', sortOrder = 'desc' } = req.query;

      let ideas = db.ideas.filter(i => i.app_id === appId);

      if (status && status !== 'all') {
        ideas = ideas.filter(i => i.status === status);
      }
      if (priority && priority !== 'all') {
        ideas = ideas.filter(i => i.priority === priority);
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
        app_id: appId as string,
        title: body.title,
        description: body.description || undefined,
        priority: body.priority || 'medium',
        status: 'pending',
        created_at: now
      };

      db.ideas.push(newIdea);
      return res.status(201).json({ success: true, data: newIdea });
    }

    return res.status(405).json({ success: false, error: 'Method not allowed' });
  } catch (error) {
    console.error('API Error:', error);
    return res.status(500).json({ success: false, error: 'Internal server error' });
  }
}
