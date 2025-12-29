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

  const { key } = req.query;

  try {
    if (req.method === 'GET') {
      const setting = db.settings.find(s => s.key === key);
      if (!setting) {
        return res.status(404).json({ success: false, error: 'Setting not found' });
      }
      return res.json({
        success: true,
        data: { ...setting, value: setting.encrypted ? '********' : setting.value }
      });
    }

    if (req.method === 'PUT') {
      const { value, encrypted = false } = req.body;
      const now = new Date().toISOString();

      let setting = db.settings.find(s => s.key === key);
      if (setting) {
        setting.value = value;
        setting.encrypted = encrypted ? 1 : 0;
        setting.updated_at = now;
      } else {
        setting = {
          id: uuidv4(),
          key: key as string,
          value,
          encrypted: encrypted ? 1 : 0,
          updated_at: now
        };
        db.settings.push(setting);
      }

      return res.json({
        success: true,
        data: { ...setting, value: setting.encrypted ? '********' : setting.value }
      });
    }

    return res.status(405).json({ success: false, error: 'Method not allowed' });
  } catch (error) {
    console.error('API Error:', error);
    return res.status(500).json({ success: false, error: 'Internal server error' });
  }
}
