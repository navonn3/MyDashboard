import type { VercelRequest, VercelResponse } from '@vercel/node';
import { v4 as uuidv4 } from 'uuid';
import { db } from '../db';

export default function handler(req: VercelRequest, res: VercelResponse) {
  db.init();

  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, PUT, OPTIONS');
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
      const note = db.notes.find(n => n.app_id === appId);
      return res.json({
        success: true,
        data: note || { id: '', app_id: appId, content: '', updated_at: new Date().toISOString() }
      });
    }

    if (req.method === 'PUT') {
      const { content } = req.body;
      const now = new Date().toISOString();

      let note = db.notes.find(n => n.app_id === appId);
      if (note) {
        note.content = content;
        note.updated_at = now;
      } else {
        note = { id: uuidv4(), app_id: appId as string, content, updated_at: now };
        db.notes.push(note);
      }

      return res.json({ success: true, data: note });
    }

    return res.status(405).json({ success: false, error: 'Method not allowed' });
  } catch (error) {
    console.error('API Error:', error);
    return res.status(500).json({ success: false, error: 'Internal server error' });
  }
}
