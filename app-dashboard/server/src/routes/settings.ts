/**
 * Settings API Routes
 * Handles user settings and API key management
 */

import { Router, Request, Response } from 'express';
import { v4 as uuidv4 } from 'uuid';
import db from '../database';
import { Setting } from '../types';
import { encrypt, decrypt, validateAnthropicApiKey } from '../services/encryption';

const router = Router();

// Settings keys that should be encrypted
const ENCRYPTED_KEYS = ['anthropic_api_key', 'vercel_api_token', 'netlify_api_token', 'github_api_token'];

/**
 * GET /api/settings
 * Fetch all settings (sensitive values are masked)
 */
router.get('/', (_req: Request, res: Response) => {
  try {
    const settings = db.prepare('SELECT * FROM settings').all() as Setting[];

    // Mask sensitive values
    const maskedSettings = settings.map((setting) => {
      if (ENCRYPTED_KEYS.includes(setting.key) && setting.value) {
        return {
          ...setting,
          value: '••••••••' + decrypt(setting.value).slice(-4),
          hasValue: true
        };
      }
      return { ...setting, hasValue: !!setting.value };
    });

    res.json({
      success: true,
      data: maskedSettings
    });
  } catch (error) {
    console.error('Error fetching settings:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch settings'
    });
  }
});

/**
 * GET /api/settings/:key
 * Fetch a specific setting
 */
router.get('/:key', (req: Request, res: Response) => {
  try {
    const { key } = req.params;

    const setting = db.prepare('SELECT * FROM settings WHERE key = ?').get(key) as Setting | undefined;

    if (!setting) {
      return res.json({
        success: true,
        data: { key, value: null, hasValue: false }
      });
    }

    // For sensitive keys, only return whether a value exists
    if (ENCRYPTED_KEYS.includes(key)) {
      return res.json({
        success: true,
        data: {
          key,
          hasValue: !!setting.value,
          value: setting.value ? '••••••••' + decrypt(setting.value).slice(-4) : null
        }
      });
    }

    res.json({
      success: true,
      data: setting
    });
  } catch (error) {
    console.error('Error fetching setting:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch setting'
    });
  }
});

/**
 * PUT /api/settings/:key
 * Update or create a setting
 */
router.put('/:key', (req: Request, res: Response) => {
  try {
    const { key } = req.params;
    const { value } = req.body;

    // Validate Anthropic API key if that's what's being set
    if (key === 'anthropic_api_key' && value) {
      if (!validateAnthropicApiKey(value)) {
        return res.status(400).json({
          success: false,
          error: 'Invalid Anthropic API key format. Key should start with "sk-ant-"'
        });
      }
    }

    const now = new Date().toISOString();
    const shouldEncrypt = ENCRYPTED_KEYS.includes(key);
    const storedValue = shouldEncrypt && value ? encrypt(value) : value;

    // Check if setting exists
    const existing = db.prepare('SELECT * FROM settings WHERE key = ?').get(key) as Setting | undefined;

    if (existing) {
      db.prepare('UPDATE settings SET value = ?, encrypted = ?, updated_at = ? WHERE key = ?').run(
        storedValue,
        shouldEncrypt ? 1 : 0,
        now,
        key
      );
    } else {
      const id = uuidv4();
      db.prepare('INSERT INTO settings (id, key, value, encrypted, updated_at) VALUES (?, ?, ?, ?, ?)').run(
        id,
        key,
        storedValue,
        shouldEncrypt ? 1 : 0,
        now
      );
    }

    res.json({
      success: true,
      data: {
        key,
        hasValue: !!value,
        updated_at: now
      }
    });
  } catch (error) {
    console.error('Error updating setting:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to update setting'
    });
  }
});

/**
 * DELETE /api/settings/:key
 * Remove a setting
 */
router.delete('/:key', (req: Request, res: Response) => {
  try {
    const { key } = req.params;

    db.prepare('DELETE FROM settings WHERE key = ?').run(key);

    res.json({
      success: true,
      data: { deleted: key }
    });
  } catch (error) {
    console.error('Error deleting setting:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to delete setting'
    });
  }
});

/**
 * POST /api/settings/validate-api-key
 * Validate an Anthropic API key without saving it
 */
router.post('/validate-api-key', async (req: Request, res: Response) => {
  try {
    const { apiKey } = req.body;

    if (!apiKey) {
      return res.status(400).json({
        success: false,
        error: 'API key is required'
      });
    }

    if (!validateAnthropicApiKey(apiKey)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid API key format'
      });
    }

    // Optionally, make a test API call to verify the key works
    // This is a simple test that just checks format for now
    res.json({
      success: true,
      data: { valid: true }
    });
  } catch (error) {
    console.error('Error validating API key:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to validate API key'
    });
  }
});

export default router;
