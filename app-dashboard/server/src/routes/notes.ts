/**
 * Notes API Routes
 * Handles operations for application notes
 */

import { Router, Request, Response } from 'express';
import { v4 as uuidv4 } from 'uuid';
import db from '../database';
import { AppNote } from '../types';

const router = Router();

/**
 * GET /api/notes/:appId
 * Fetch notes for a specific application
 */
router.get('/:appId', (req: Request, res: Response) => {
  try {
    const { appId } = req.params;

    // Check if application exists
    const app = db.prepare('SELECT id FROM applications WHERE id = ?').get(appId);
    if (!app) {
      return res.status(404).json({
        success: false,
        error: 'Application not found'
      });
    }

    const note = db.prepare('SELECT * FROM app_notes WHERE app_id = ?').get(appId) as AppNote | undefined;

    // If no note exists, create an empty one
    if (!note) {
      const noteId = uuidv4();
      db.prepare('INSERT INTO app_notes (id, app_id, content) VALUES (?, ?, ?)').run(noteId, appId, '');

      const newNote = db.prepare('SELECT * FROM app_notes WHERE id = ?').get(noteId) as AppNote;

      return res.json({
        success: true,
        data: newNote
      });
    }

    res.json({
      success: true,
      data: note
    });
  } catch (error) {
    console.error('Error fetching notes:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch notes'
    });
  }
});

/**
 * PUT /api/notes/:appId
 * Update notes for a specific application
 */
router.put('/:appId', (req: Request, res: Response) => {
  try {
    const { appId } = req.params;
    const { content } = req.body;

    // Check if application exists
    const app = db.prepare('SELECT id FROM applications WHERE id = ?').get(appId);
    if (!app) {
      return res.status(404).json({
        success: false,
        error: 'Application not found'
      });
    }

    const now = new Date().toISOString();

    // Check if note exists
    const existingNote = db.prepare('SELECT * FROM app_notes WHERE app_id = ?').get(appId) as AppNote | undefined;

    if (existingNote) {
      // Update existing note
      db.prepare('UPDATE app_notes SET content = ?, updated_at = ? WHERE app_id = ?').run(
        content || '',
        now,
        appId
      );
    } else {
      // Create new note
      const noteId = uuidv4();
      db.prepare('INSERT INTO app_notes (id, app_id, content, updated_at) VALUES (?, ?, ?, ?)').run(
        noteId,
        appId,
        content || '',
        now
      );
    }

    const updatedNote = db.prepare('SELECT * FROM app_notes WHERE app_id = ?').get(appId) as AppNote;

    res.json({
      success: true,
      data: updatedNote
    });
  } catch (error) {
    console.error('Error updating notes:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to update notes'
    });
  }
});

export default router;
