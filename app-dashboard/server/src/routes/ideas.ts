/**
 * Ideas API Routes
 * Handles operations for application ideas and global ideas
 */

import { Router, Request, Response } from 'express';
import { v4 as uuidv4 } from 'uuid';
import db from '../database';
import {
  AppIdea,
  GlobalIdea,
  CreateIdeaRequest,
  UpdateIdeaRequest,
  CreateGlobalIdeaRequest,
  UpdateGlobalIdeaRequest
} from '../types';

const router = Router();

// ============== Application Ideas ==============

/**
 * GET /api/ideas/app/:appId
 * Fetch all ideas for a specific application
 */
router.get('/app/:appId', (req: Request, res: Response) => {
  try {
    const { appId } = req.params;
    const { status, priority, sortBy, sortOrder } = req.query;

    // Check if application exists
    const app = db.prepare('SELECT id FROM applications WHERE id = ?').get(appId);
    if (!app) {
      return res.status(404).json({
        success: false,
        error: 'Application not found'
      });
    }

    let query = 'SELECT * FROM app_ideas WHERE app_id = ?';
    const params: (string | number)[] = [appId];

    if (status && status !== 'all') {
      query += ' AND status = ?';
      params.push(status as string);
    }

    if (priority && priority !== 'all') {
      query += ' AND priority = ?';
      params.push(priority as string);
    }

    // Sorting
    const validSortColumns = ['title', 'priority', 'status', 'created_at'];
    const sortColumn = validSortColumns.includes(sortBy as string) ? sortBy : 'created_at';
    const order = sortOrder === 'asc' ? 'ASC' : 'DESC';

    // Priority-based sorting for priority column
    if (sortColumn === 'priority') {
      query += ` ORDER BY CASE priority WHEN 'high' THEN 1 WHEN 'medium' THEN 2 WHEN 'low' THEN 3 END ${order}`;
    } else {
      query += ` ORDER BY ${sortColumn} ${order}`;
    }

    const ideas = db.prepare(query).all(...params) as AppIdea[];

    res.json({
      success: true,
      data: ideas
    });
  } catch (error) {
    console.error('Error fetching ideas:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch ideas'
    });
  }
});

/**
 * POST /api/ideas/app/:appId
 * Create a new idea for an application
 */
router.post('/app/:appId', (req: Request, res: Response) => {
  try {
    const { appId } = req.params;
    const body: CreateIdeaRequest = req.body;

    // Check if application exists
    const app = db.prepare('SELECT id FROM applications WHERE id = ?').get(appId);
    if (!app) {
      return res.status(404).json({
        success: false,
        error: 'Application not found'
      });
    }

    // Validation
    if (!body.title || !body.title.trim()) {
      return res.status(400).json({
        success: false,
        error: 'Idea title is required'
      });
    }

    const id = uuidv4();
    const now = new Date().toISOString();

    db.prepare(`
      INSERT INTO app_ideas (id, app_id, title, description, priority, status, created_at)
      VALUES (?, ?, ?, ?, ?, 'pending', ?)
    `).run(
      id,
      appId,
      body.title.trim(),
      body.description?.trim() || null,
      body.priority || 'medium',
      now
    );

    const newIdea = db.prepare('SELECT * FROM app_ideas WHERE id = ?').get(id) as AppIdea;

    res.status(201).json({
      success: true,
      data: newIdea
    });
  } catch (error) {
    console.error('Error creating idea:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to create idea'
    });
  }
});

/**
 * PUT /api/ideas/:id
 * Update an existing idea
 */
router.put('/:id', (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const body: UpdateIdeaRequest = req.body;

    // Check if idea exists
    const existing = db.prepare('SELECT * FROM app_ideas WHERE id = ?').get(id) as AppIdea | undefined;
    if (!existing) {
      return res.status(404).json({
        success: false,
        error: 'Idea not found'
      });
    }

    // Handle status change to completed
    let completedAt = existing.completed_at;
    if (body.status === 'completed' && existing.status !== 'completed') {
      completedAt = new Date().toISOString();
    } else if (body.status && body.status !== 'completed') {
      completedAt = null;
    }

    db.prepare(`
      UPDATE app_ideas SET
        title = COALESCE(?, title),
        description = COALESCE(?, description),
        priority = COALESCE(?, priority),
        status = COALESCE(?, status),
        completed_at = ?
      WHERE id = ?
    `).run(
      body.title?.trim() || null,
      body.description?.trim(),
      body.priority,
      body.status,
      completedAt,
      id
    );

    const updatedIdea = db.prepare('SELECT * FROM app_ideas WHERE id = ?').get(id) as AppIdea;

    res.json({
      success: true,
      data: updatedIdea
    });
  } catch (error) {
    console.error('Error updating idea:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to update idea'
    });
  }
});

/**
 * DELETE /api/ideas/:id
 * Delete an idea
 */
router.delete('/:id', (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const existing = db.prepare('SELECT * FROM app_ideas WHERE id = ?').get(id) as AppIdea | undefined;
    if (!existing) {
      return res.status(404).json({
        success: false,
        error: 'Idea not found'
      });
    }

    db.prepare('DELETE FROM app_ideas WHERE id = ?').run(id);

    res.json({
      success: true,
      data: { deleted: id }
    });
  } catch (error) {
    console.error('Error deleting idea:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to delete idea'
    });
  }
});

// ============== Global Ideas ==============

/**
 * GET /api/ideas/global
 * Fetch all global ideas
 */
router.get('/global', (req: Request, res: Response) => {
  try {
    const { status, complexity, sortBy, sortOrder } = req.query;

    let query = 'SELECT * FROM global_ideas WHERE 1=1';
    const params: (string | number)[] = [];

    if (status && status !== 'all') {
      query += ' AND status = ?';
      params.push(status as string);
    }

    if (complexity && complexity !== 'all') {
      query += ' AND complexity = ?';
      params.push(complexity as string);
    }

    // Sorting
    const validSortColumns = ['title', 'complexity', 'status', 'created_at'];
    const sortColumn = validSortColumns.includes(sortBy as string) ? sortBy : 'created_at';
    const order = sortOrder === 'asc' ? 'ASC' : 'DESC';
    query += ` ORDER BY ${sortColumn} ${order}`;

    const ideas = db.prepare(query).all(...params) as GlobalIdea[];

    res.json({
      success: true,
      data: ideas
    });
  } catch (error) {
    console.error('Error fetching global ideas:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch global ideas'
    });
  }
});

/**
 * POST /api/ideas/global
 * Create a new global idea
 */
router.post('/global', (req: Request, res: Response) => {
  try {
    const body: CreateGlobalIdeaRequest = req.body;

    // Validation
    if (!body.title || !body.title.trim()) {
      return res.status(400).json({
        success: false,
        error: 'Idea title is required'
      });
    }

    const id = uuidv4();
    const now = new Date().toISOString();

    db.prepare(`
      INSERT INTO global_ideas (id, title, description, target_platform, complexity, status, created_at)
      VALUES (?, ?, ?, ?, ?, 'idea', ?)
    `).run(
      id,
      body.title.trim(),
      body.description?.trim() || null,
      body.target_platform || null,
      body.complexity || 'medium',
      now
    );

    const newIdea = db.prepare('SELECT * FROM global_ideas WHERE id = ?').get(id) as GlobalIdea;

    res.status(201).json({
      success: true,
      data: newIdea
    });
  } catch (error) {
    console.error('Error creating global idea:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to create global idea'
    });
  }
});

/**
 * PUT /api/ideas/global/:id
 * Update an existing global idea
 */
router.put('/global/:id', (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const body: UpdateGlobalIdeaRequest = req.body;

    // Check if idea exists
    const existing = db.prepare('SELECT * FROM global_ideas WHERE id = ?').get(id) as GlobalIdea | undefined;
    if (!existing) {
      return res.status(404).json({
        success: false,
        error: 'Global idea not found'
      });
    }

    db.prepare(`
      UPDATE global_ideas SET
        title = COALESCE(?, title),
        description = COALESCE(?, description),
        target_platform = COALESCE(?, target_platform),
        complexity = COALESCE(?, complexity),
        status = COALESCE(?, status)
      WHERE id = ?
    `).run(
      body.title?.trim() || null,
      body.description?.trim(),
      body.target_platform,
      body.complexity,
      body.status,
      id
    );

    const updatedIdea = db.prepare('SELECT * FROM global_ideas WHERE id = ?').get(id) as GlobalIdea;

    res.json({
      success: true,
      data: updatedIdea
    });
  } catch (error) {
    console.error('Error updating global idea:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to update global idea'
    });
  }
});

/**
 * DELETE /api/ideas/global/:id
 * Delete a global idea
 */
router.delete('/global/:id', (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const existing = db.prepare('SELECT * FROM global_ideas WHERE id = ?').get(id) as GlobalIdea | undefined;
    if (!existing) {
      return res.status(404).json({
        success: false,
        error: 'Global idea not found'
      });
    }

    db.prepare('DELETE FROM global_ideas WHERE id = ?').run(id);

    res.json({
      success: true,
      data: { deleted: id }
    });
  } catch (error) {
    console.error('Error deleting global idea:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to delete global idea'
    });
  }
});

/**
 * POST /api/ideas/global/:id/convert
 * Convert a global idea to an application
 */
router.post('/global/:id/convert', (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const idea = db.prepare('SELECT * FROM global_ideas WHERE id = ?').get(id) as GlobalIdea | undefined;
    if (!idea) {
      return res.status(404).json({
        success: false,
        error: 'Global idea not found'
      });
    }

    // Return the idea data to pre-fill the application creation form
    // The actual application creation will be done through the /api/applications endpoint
    res.json({
      success: true,
      data: {
        prefill: {
          name: idea.title,
          description: idea.description,
          build_platform: idea.target_platform || 'custom'
        },
        globalIdeaId: id
      }
    });
  } catch (error) {
    console.error('Error converting global idea:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to convert global idea'
    });
  }
});

/**
 * POST /api/ideas/global/:id/mark-converted
 * Mark a global idea as converted after application is created
 */
router.post('/global/:id/mark-converted', (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { appId } = req.body;

    const idea = db.prepare('SELECT * FROM global_ideas WHERE id = ?').get(id) as GlobalIdea | undefined;
    if (!idea) {
      return res.status(404).json({
        success: false,
        error: 'Global idea not found'
      });
    }

    db.prepare(`
      UPDATE global_ideas SET status = 'converted', converted_app_id = ? WHERE id = ?
    `).run(appId, id);

    const updatedIdea = db.prepare('SELECT * FROM global_ideas WHERE id = ?').get(id) as GlobalIdea;

    res.json({
      success: true,
      data: updatedIdea
    });
  } catch (error) {
    console.error('Error marking global idea as converted:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to mark global idea as converted'
    });
  }
});

export default router;
