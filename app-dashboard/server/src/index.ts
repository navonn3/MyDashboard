/**
 * Application Dashboard Server
 * Express server with SQLite database for managing applications
 */

import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import rateLimit from 'express-rate-limit';
import { initializeDatabase } from './database';

// Import routes
import applicationsRouter from './routes/applications';
import notesRouter from './routes/notes';
import ideasRouter from './routes/ideas';
import settingsRouter from './routes/settings';
import promptGeneratorRouter from './routes/prompt-generator';

// Initialize Express app
const app = express();
const PORT = process.env.PORT || 3001;

// Initialize database
initializeDatabase();

// Middleware
app.use(cors({
  origin: true, // Allow all origins (configure specific domains in production)
  credentials: true
}));
app.use(express.json({ limit: '10mb' }));

// Rate limiting for API endpoints
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Limit each IP to 100 requests per windowMs
  message: { success: false, error: 'Too many requests, please try again later.' }
});

// Rate limiting specifically for Claude API calls (more restrictive)
const promptGeneratorLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 5, // Limit each IP to 5 prompt generations per minute
  message: { success: false, error: 'Rate limit exceeded for prompt generation. Please wait a moment.' }
});

// Apply rate limiting
app.use('/api', apiLimiter);
app.use('/api/generate-prompt', promptGeneratorLimiter);

// Request logging middleware
app.use((req: Request, _res: Response, next: NextFunction) => {
  console.log(`${new Date().toISOString()} ${req.method} ${req.path}`);
  next();
});

// API Routes
app.use('/api/applications', applicationsRouter);
app.use('/api/notes', notesRouter);
app.use('/api/ideas', ideasRouter);
app.use('/api/settings', settingsRouter);
app.use('/api/generate-prompt', promptGeneratorRouter);

// Health check endpoint
app.get('/api/health', (_req: Request, res: Response) => {
  res.json({
    success: true,
    data: {
      status: 'healthy',
      timestamp: new Date().toISOString(),
      version: '1.0.0'
    }
  });
});

// 404 handler
app.use((_req: Request, res: Response) => {
  res.status(404).json({
    success: false,
    error: 'Endpoint not found'
  });
});

// Error handler
app.use((err: Error, _req: Request, res: Response, _next: NextFunction) => {
  console.error('Server error:', err);
  res.status(500).json({
    success: false,
    error: 'Internal server error'
  });
});

// Start server
app.listen(PORT, () => {
  console.log(`
╔════════════════════════════════════════════════════════════════╗
║                                                                ║
║   Application Dashboard Server                                 ║
║   Running on http://localhost:${PORT}                            ║
║                                                                ║
║   API Endpoints:                                               ║
║   - GET    /api/applications       List all applications      ║
║   - POST   /api/applications       Create new application      ║
║   - GET    /api/applications/:id   Get single application      ║
║   - PUT    /api/applications/:id   Update application          ║
║   - DELETE /api/applications/:id   Delete application          ║
║   - GET    /api/notes/:appId       Get app notes               ║
║   - PUT    /api/notes/:appId       Update app notes            ║
║   - GET    /api/ideas/app/:appId   Get app ideas               ║
║   - POST   /api/ideas/app/:appId   Create app idea             ║
║   - GET    /api/ideas/global       Get global ideas            ║
║   - POST   /api/ideas/global       Create global idea          ║
║   - GET    /api/settings           Get all settings            ║
║   - PUT    /api/settings/:key      Update setting              ║
║   - POST   /api/generate-prompt    Generate AI prompt          ║
║                                                                ║
╚════════════════════════════════════════════════════════════════╝
  `);
});
