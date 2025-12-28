/**
 * Prompt Generator API Routes
 * Handles AI-powered prompt generation using Claude API
 */

import { Router, Request, Response } from 'express';
import { v4 as uuidv4 } from 'uuid';
import db from '../database';
import { Application, AppIdea, Setting, GeneratedPrompt } from '../types';
import { decrypt } from '../services/encryption';
import { generateImplementationPrompt } from '../services/claudeApi';

const router = Router();

/**
 * POST /api/generate-prompt
 * Generate an implementation prompt using Claude API
 */
router.post('/', async (req: Request, res: Response) => {
  try {
    const { appId, ideaIds } = req.body;

    if (!appId) {
      return res.status(400).json({
        success: false,
        error: 'Application ID is required'
      });
    }

    // Get the API key from settings
    const apiKeySetting = db.prepare('SELECT * FROM settings WHERE key = ?').get('anthropic_api_key') as
      | Setting
      | undefined;

    if (!apiKeySetting || !apiKeySetting.value) {
      return res.status(400).json({
        success: false,
        error: 'Anthropic API key not configured. Please add your API key in Settings.'
      });
    }

    const apiKey = decrypt(apiKeySetting.value);

    if (!apiKey) {
      return res.status(400).json({
        success: false,
        error: 'Failed to decrypt API key. Please reconfigure your API key in Settings.'
      });
    }

    // Fetch the application
    const application = db.prepare('SELECT * FROM applications WHERE id = ?').get(appId) as Application | undefined;

    if (!application) {
      return res.status(404).json({
        success: false,
        error: 'Application not found'
      });
    }

    // Fetch ideas for the application
    let ideas: AppIdea[];

    if (ideaIds && Array.isArray(ideaIds) && ideaIds.length > 0) {
      // Fetch specific ideas
      const placeholders = ideaIds.map(() => '?').join(',');
      ideas = db
        .prepare(`SELECT * FROM app_ideas WHERE id IN (${placeholders}) AND app_id = ?`)
        .all(...ideaIds, appId) as AppIdea[];
    } else {
      // Fetch all pending and in_progress ideas by default
      ideas = db
        .prepare("SELECT * FROM app_ideas WHERE app_id = ? AND status IN ('pending', 'in_progress') ORDER BY priority DESC")
        .all(appId) as AppIdea[];
    }

    if (ideas.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'No ideas found for this application. Add some ideas first.'
      });
    }

    // Generate the prompt using Claude API
    const generatedPrompt = await generateImplementationPrompt(apiKey, application, ideas);

    // Save to history
    const promptId = uuidv4();
    const now = new Date().toISOString();

    db.prepare(`
      INSERT INTO generated_prompts (id, app_id, ideas_snapshot, generated_prompt, created_at)
      VALUES (?, ?, ?, ?, ?)
    `).run(promptId, appId, JSON.stringify(ideas), generatedPrompt, now);

    res.json({
      success: true,
      data: {
        id: promptId,
        prompt: generatedPrompt,
        ideas_count: ideas.length,
        created_at: now
      }
    });
  } catch (error) {
    console.error('Error generating prompt:', error);

    const message = error instanceof Error ? error.message : 'Failed to generate prompt';

    res.status(500).json({
      success: false,
      error: message
    });
  }
});

/**
 * GET /api/generate-prompt/history/:appId
 * Get prompt generation history for an application
 */
router.get('/history/:appId', (req: Request, res: Response) => {
  try {
    const { appId } = req.params;
    const { limit = 10 } = req.query;

    // Check if application exists
    const app = db.prepare('SELECT id FROM applications WHERE id = ?').get(appId);
    if (!app) {
      return res.status(404).json({
        success: false,
        error: 'Application not found'
      });
    }

    const history = db
      .prepare('SELECT * FROM generated_prompts WHERE app_id = ? ORDER BY created_at DESC LIMIT ?')
      .all(appId, Number(limit)) as GeneratedPrompt[];

    // Parse the ideas_snapshot JSON for each entry
    const parsedHistory = history.map((item) => ({
      ...item,
      ideas_snapshot: item.ideas_snapshot ? JSON.parse(item.ideas_snapshot) : []
    }));

    res.json({
      success: true,
      data: parsedHistory
    });
  } catch (error) {
    console.error('Error fetching prompt history:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch prompt history'
    });
  }
});

/**
 * GET /api/generate-prompt/:id
 * Get a specific generated prompt
 */
router.get('/:id', (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const prompt = db.prepare('SELECT * FROM generated_prompts WHERE id = ?').get(id) as GeneratedPrompt | undefined;

    if (!prompt) {
      return res.status(404).json({
        success: false,
        error: 'Generated prompt not found'
      });
    }

    res.json({
      success: true,
      data: {
        ...prompt,
        ideas_snapshot: prompt.ideas_snapshot ? JSON.parse(prompt.ideas_snapshot) : []
      }
    });
  } catch (error) {
    console.error('Error fetching generated prompt:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch generated prompt'
    });
  }
});

/**
 * DELETE /api/generate-prompt/:id
 * Delete a generated prompt from history
 */
router.delete('/:id', (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const existing = db.prepare('SELECT * FROM generated_prompts WHERE id = ?').get(id);
    if (!existing) {
      return res.status(404).json({
        success: false,
        error: 'Generated prompt not found'
      });
    }

    db.prepare('DELETE FROM generated_prompts WHERE id = ?').run(id);

    res.json({
      success: true,
      data: { deleted: id }
    });
  } catch (error) {
    console.error('Error deleting generated prompt:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to delete generated prompt'
    });
  }
});

export default router;
