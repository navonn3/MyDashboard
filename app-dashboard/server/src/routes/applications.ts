/**
 * Applications API Routes
 * Handles CRUD operations for applications
 */

import { Router, Request, Response } from 'express';
import { v4 as uuidv4 } from 'uuid';
import db from '../database';
import { Application, CreateApplicationRequest, UpdateApplicationRequest, ApiResponse } from '../types';
import { checkApplicationStatus } from '../services/statusChecker';

const router = Router();

/**
 * GET /api/applications
 * Fetch all applications with optional filtering
 */
router.get('/', (req: Request, res: Response) => {
  try {
    const { status, search, sortBy, sortOrder } = req.query;

    let query = 'SELECT * FROM applications WHERE 1=1';
    const params: (string | number)[] = [];

    if (status && status !== 'all') {
      query += ' AND status = ?';
      params.push(status as string);
    }

    if (search) {
      query += ' AND (name LIKE ? OR description LIKE ?)';
      const searchTerm = `%${search}%`;
      params.push(searchTerm, searchTerm);
    }

    // Sorting
    const validSortColumns = ['name', 'build_platform', 'status', 'created_at', 'updated_at'];
    const sortColumn = validSortColumns.includes(sortBy as string) ? sortBy : 'updated_at';
    const order = sortOrder === 'asc' ? 'ASC' : 'DESC';
    query += ` ORDER BY ${sortColumn} ${order}`;

    const applications = db.prepare(query).all(...params) as Application[];

    const response: ApiResponse<Application[]> = {
      success: true,
      data: applications
    };

    res.json(response);
  } catch (error) {
    console.error('Error fetching applications:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch applications'
    });
  }
});

/**
 * GET /api/applications/:id
 * Fetch a single application by ID
 */
router.get('/:id', (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const application = db.prepare('SELECT * FROM applications WHERE id = ?').get(id) as Application | undefined;

    if (!application) {
      return res.status(404).json({
        success: false,
        error: 'Application not found'
      });
    }

    res.json({
      success: true,
      data: application
    });
  } catch (error) {
    console.error('Error fetching application:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch application'
    });
  }
});

/**
 * GET /api/applications/:id/status
 * Check the status of an application's integrations
 */
router.get('/:id/status', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const application = db.prepare('SELECT * FROM applications WHERE id = ?').get(id) as Application | undefined;

    if (!application) {
      return res.status(404).json({
        success: false,
        error: 'Application not found'
      });
    }

    const platformConfig = application.platform_config
      ? JSON.parse(application.platform_config)
      : undefined;

    const status = await checkApplicationStatus(
      application.live_url || undefined,
      application.github_url || undefined,
      application.database_platform || undefined,
      application.frontend_platform || undefined,
      platformConfig
    );

    res.json({
      success: true,
      data: status
    });
  } catch (error) {
    console.error('Error checking application status:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to check application status'
    });
  }
});

/**
 * POST /api/applications
 * Create a new application
 */
router.post('/', (req: Request, res: Response) => {
  try {
    const body: CreateApplicationRequest = req.body;

    // Validation
    if (!body.name || !body.name.trim()) {
      return res.status(400).json({
        success: false,
        error: 'Application name is required'
      });
    }

    if (!body.build_platform) {
      return res.status(400).json({
        success: false,
        error: 'Build platform is required'
      });
    }

    const id = uuidv4();
    const now = new Date().toISOString();

    const insertStmt = db.prepare(`
      INSERT INTO applications (
        id, name, description, github_url, database_url, database_platform,
        frontend_url, frontend_platform, live_url, build_platform, platform_config, status, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'active', ?, ?)
    `);

    insertStmt.run(
      id,
      body.name.trim(),
      body.description?.trim() || null,
      body.github_url?.trim() || null,
      body.database_url?.trim() || null,
      body.database_platform || null,
      body.frontend_url?.trim() || null,
      body.frontend_platform || null,
      body.live_url?.trim() || null,
      body.build_platform,
      body.platform_config ? JSON.stringify(body.platform_config) : null,
      now,
      now
    );

    // Also create an empty notes entry for the application
    const noteId = uuidv4();
    db.prepare('INSERT INTO app_notes (id, app_id, content) VALUES (?, ?, ?)').run(noteId, id, '');

    const newApplication = db.prepare('SELECT * FROM applications WHERE id = ?').get(id) as Application;

    res.status(201).json({
      success: true,
      data: newApplication
    });
  } catch (error) {
    console.error('Error creating application:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to create application'
    });
  }
});

/**
 * PUT /api/applications/:id
 * Update an existing application
 */
router.put('/:id', (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const body: UpdateApplicationRequest = req.body;

    // Check if application exists
    const existing = db.prepare('SELECT * FROM applications WHERE id = ?').get(id) as Application | undefined;

    if (!existing) {
      return res.status(404).json({
        success: false,
        error: 'Application not found'
      });
    }

    const now = new Date().toISOString();

    const updateStmt = db.prepare(`
      UPDATE applications SET
        name = COALESCE(?, name),
        description = COALESCE(?, description),
        github_url = COALESCE(?, github_url),
        database_url = COALESCE(?, database_url),
        database_platform = COALESCE(?, database_platform),
        frontend_url = COALESCE(?, frontend_url),
        frontend_platform = COALESCE(?, frontend_platform),
        live_url = COALESCE(?, live_url),
        build_platform = COALESCE(?, build_platform),
        platform_config = COALESCE(?, platform_config),
        status = COALESCE(?, status),
        updated_at = ?
      WHERE id = ?
    `);

    updateStmt.run(
      body.name?.trim() || null,
      body.description?.trim(),
      body.github_url?.trim(),
      body.database_url?.trim(),
      body.database_platform,
      body.frontend_url?.trim(),
      body.frontend_platform,
      body.live_url?.trim(),
      body.build_platform,
      body.platform_config ? JSON.stringify(body.platform_config) : null,
      body.status,
      now,
      id
    );

    const updatedApplication = db.prepare('SELECT * FROM applications WHERE id = ?').get(id) as Application;

    res.json({
      success: true,
      data: updatedApplication
    });
  } catch (error) {
    console.error('Error updating application:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to update application'
    });
  }
});

/**
 * DELETE /api/applications/:id
 * Delete an application and all related data
 */
router.delete('/:id', (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    // Check if application exists
    const existing = db.prepare('SELECT * FROM applications WHERE id = ?').get(id) as Application | undefined;

    if (!existing) {
      return res.status(404).json({
        success: false,
        error: 'Application not found'
      });
    }

    // Delete will cascade to notes, ideas, and generated_prompts due to foreign key constraints
    db.prepare('DELETE FROM applications WHERE id = ?').run(id);

    res.json({
      success: true,
      data: { deleted: id }
    });
  } catch (error) {
    console.error('Error deleting application:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to delete application'
    });
  }
});

/**
 * GET /api/applications/export/all
 * Export all application data as JSON
 */
router.get('/export/all', (_req: Request, res: Response) => {
  try {
    const applications = db.prepare('SELECT * FROM applications').all() as Application[];
    const notes = db.prepare('SELECT * FROM app_notes').all();
    const ideas = db.prepare('SELECT * FROM app_ideas').all();
    const globalIdeas = db.prepare('SELECT * FROM global_ideas').all();
    const generatedPrompts = db.prepare('SELECT * FROM generated_prompts').all();

    const exportData = {
      exportedAt: new Date().toISOString(),
      applications,
      notes,
      ideas,
      globalIdeas,
      generatedPrompts
    };

    res.json({
      success: true,
      data: exportData
    });
  } catch (error) {
    console.error('Error exporting data:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to export data'
    });
  }
});

export default router;
