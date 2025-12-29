import type { VercelRequest, VercelResponse } from '@vercel/node';
import { db } from '../db';

export default function handler(req: VercelRequest, res: VercelResponse) {
  db.init();

  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  try {
    if (req.method === 'POST') {
      const { apiKey } = req.body;

      if (!apiKey) {
        return res.status(400).json({ success: false, error: 'apiKey is required' });
      }

      // Basic validation - check if it looks like an API key
      // In production, you would verify against the actual service
      const isValidFormat = typeof apiKey === 'string' && apiKey.length > 10;

      return res.json({
        success: true,
        data: { valid: isValidFormat }
      });
    }

    return res.status(405).json({ success: false, error: 'Method not allowed' });
  } catch (error) {
    console.error('API Error:', error);
    return res.status(500).json({ success: false, error: 'Internal server error' });
  }
}
