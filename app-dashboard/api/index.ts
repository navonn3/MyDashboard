import type { VercelRequest, VercelResponse } from '@vercel/node';
import { v4 as uuidv4 } from 'uuid';
import { db, Application, AppIdea, GlobalIdea } from './db';

// CORS headers helper
function setCors(res: VercelResponse) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
}

// Sort helper
function sortItems<T>(items: T[], sortBy: string, sortOrder: string): T[] {
  return [...items].sort((a, b) => {
    const aVal = String((a as Record<string, unknown>)[sortBy] || '');
    const bVal = String((b as Record<string, unknown>)[sortBy] || '');
    return sortOrder === 'desc' ? bVal.localeCompare(aVal) : aVal.localeCompare(bVal);
  });
}

export default function handler(req: VercelRequest, res: VercelResponse) {
  db.init();
  setCors(res);

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  // Parse route from URL path (remove /api prefix)
  const url = new URL(req.url || '/', `http://${req.headers.host}`);
  const route = url.pathname.replace(/^\/api/, '') || '/';

  try {
    // Health check
    if (route === '/health') {
      return res.json({
        success: true,
        data: { status: 'healthy', timestamp: new Date().toISOString(), version: '1.0.0', mode: 'serverless' }
      });
    }

    // Applications
    if (route === '/applications') {
      if (req.method === 'GET') {
        const { sortBy = 'updated_at', sortOrder = 'desc', status, search } = req.query;
        let apps = [...db.applications];
        if (status && status !== 'all') apps = apps.filter(app => app.status === status);
        if (search && typeof search === 'string') {
          const s = search.toLowerCase();
          apps = apps.filter(app => app.name.toLowerCase().includes(s) || app.description?.toLowerCase().includes(s));
        }
        apps = sortItems(apps, String(sortBy), String(sortOrder));
        return res.json({ success: true, data: apps });
      }
      if (req.method === 'POST') {
        const body = req.body;
        const now = new Date().toISOString();
        const newApp: Application = {
          id: uuidv4(), name: body.name, description: body.description, github_url: body.github_url,
          database_url: body.database_url, database_platform: body.database_platform,
          frontend_url: body.frontend_url, frontend_platform: body.frontend_platform,
          live_url: body.live_url, build_platform: body.build_platform || 'custom',
          platform_config: body.platform_config ? JSON.stringify(body.platform_config) : undefined,
          status: 'active', created_at: now, updated_at: now
        };
        db.applications.push(newApp);
        return res.status(201).json({ success: true, data: newApp });
      }
    }

    // Applications export
    if (route === '/applications/export/all' && req.method === 'GET') {
      return res.json({
        success: true,
        data: {
          applications: db.applications, notes: db.notes, ideas: db.ideas,
          globalIdeas: db.globalIdeas, settings: db.settings.map(s => ({ ...s, value: s.encrypted ? '[ENCRYPTED]' : s.value })),
          exportedAt: new Date().toISOString(), version: '1.0.0'
        }
      });
    }

    // Application by ID
    const appMatch = route.match(/^\/applications\/([^/]+)$/);
    if (appMatch) {
      const id = appMatch[1];
      const appIndex = db.applications.findIndex(a => a.id === id);
      if (appIndex === -1) return res.status(404).json({ success: false, error: 'Application not found' });

      if (req.method === 'GET') return res.json({ success: true, data: db.applications[appIndex] });
      if (req.method === 'PUT') {
        const body = req.body;
        db.applications[appIndex] = {
          ...db.applications[appIndex], ...body,
          platform_config: body.platform_config ? JSON.stringify(body.platform_config) : db.applications[appIndex].platform_config,
          updated_at: new Date().toISOString()
        };
        return res.json({ success: true, data: db.applications[appIndex] });
      }
      if (req.method === 'DELETE') {
        const deleted = db.applications.splice(appIndex, 1)[0];
        db.notes = db.notes.filter(n => n.app_id !== id);
        db.ideas = db.ideas.filter(i => i.app_id !== id);
        return res.json({ success: true, data: deleted });
      }
    }

    // Application status
    const statusMatch = route.match(/^\/applications\/([^/]+)\/status$/);
    if (statusMatch && req.method === 'GET') {
      const app = db.applications.find(a => a.id === statusMatch[1]);
      if (!app) return res.status(404).json({ success: false, error: 'Application not found' });
      return res.json({
        success: true,
        data: { app_id: app.id, live_url_status: app.live_url ? 'unknown' : null, github_status: app.github_url ? 'unknown' : null, last_checked: new Date().toISOString() }
      });
    }

    // Notes
    const notesMatch = route.match(/^\/notes\/([^/]+)$/);
    if (notesMatch) {
      const appId = notesMatch[1];
      if (!db.applications.find(a => a.id === appId)) return res.status(404).json({ success: false, error: 'Application not found' });

      if (req.method === 'GET') {
        const note = db.notes.find(n => n.app_id === appId);
        return res.json({ success: true, data: note || { id: '', app_id: appId, content: '', updated_at: new Date().toISOString() } });
      }
      if (req.method === 'PUT') {
        const { content } = req.body;
        const now = new Date().toISOString();
        let note = db.notes.find(n => n.app_id === appId);
        if (note) { note.content = content; note.updated_at = now; }
        else { note = { id: uuidv4(), app_id: appId, content, updated_at: now }; db.notes.push(note); }
        return res.json({ success: true, data: note });
      }
    }

    // App Ideas
    const appIdeasMatch = route.match(/^\/ideas\/app\/([^/]+)$/);
    if (appIdeasMatch) {
      const appId = appIdeasMatch[1];
      if (!db.applications.find(a => a.id === appId)) return res.status(404).json({ success: false, error: 'Application not found' });

      if (req.method === 'GET') {
        const { status, priority, sortBy = 'created_at', sortOrder = 'desc' } = req.query;
        let ideas = db.ideas.filter(i => i.app_id === appId);
        if (status && status !== 'all') ideas = ideas.filter(i => i.status === status);
        if (priority && priority !== 'all') ideas = ideas.filter(i => i.priority === priority);
        ideas = sortItems(ideas, String(sortBy), String(sortOrder));
        return res.json({ success: true, data: ideas });
      }
      if (req.method === 'POST') {
        const body = req.body;
        const newIdea: AppIdea = {
          id: uuidv4(), app_id: appId, title: body.title, description: body.description,
          priority: body.priority || 'medium', status: 'pending', created_at: new Date().toISOString()
        };
        db.ideas.push(newIdea);
        return res.status(201).json({ success: true, data: newIdea });
      }
    }

    // Single idea
    const ideaMatch = route.match(/^\/ideas\/([^/]+)$/);
    if (ideaMatch && !route.includes('/global') && !route.includes('/app')) {
      const id = ideaMatch[1];
      const ideaIndex = db.ideas.findIndex(i => i.id === id);
      if (ideaIndex === -1) return res.status(404).json({ success: false, error: 'Idea not found' });

      if (req.method === 'GET') return res.json({ success: true, data: db.ideas[ideaIndex] });
      if (req.method === 'PUT') {
        const body = req.body;
        let completedAt = db.ideas[ideaIndex].completed_at;
        if (body.status === 'completed' && db.ideas[ideaIndex].status !== 'completed') completedAt = new Date().toISOString();
        else if (body.status && body.status !== 'completed') completedAt = undefined;
        db.ideas[ideaIndex] = { ...db.ideas[ideaIndex], ...body, completed_at: completedAt };
        return res.json({ success: true, data: db.ideas[ideaIndex] });
      }
      if (req.method === 'DELETE') {
        const deleted = db.ideas.splice(ideaIndex, 1)[0];
        return res.json({ success: true, data: { deleted: deleted.id } });
      }
    }

    // Global ideas
    if (route === '/ideas/global') {
      if (req.method === 'GET') {
        const { status, complexity, sortBy = 'created_at', sortOrder = 'desc' } = req.query;
        let ideas = [...db.globalIdeas];
        if (status && status !== 'all') ideas = ideas.filter(i => i.status === status);
        if (complexity && complexity !== 'all') ideas = ideas.filter(i => i.complexity === complexity);
        ideas = sortItems(ideas, String(sortBy), String(sortOrder));
        return res.json({ success: true, data: ideas });
      }
      if (req.method === 'POST') {
        const body = req.body;
        const newIdea: GlobalIdea = {
          id: uuidv4(), title: body.title, description: body.description,
          target_platform: body.target_platform, complexity: body.complexity || 'medium',
          status: 'idea', created_at: new Date().toISOString()
        };
        db.globalIdeas.push(newIdea);
        return res.status(201).json({ success: true, data: newIdea });
      }
    }

    // Global idea by ID
    const globalIdeaMatch = route.match(/^\/ideas\/global\/([^/]+)$/);
    if (globalIdeaMatch) {
      const id = globalIdeaMatch[1];
      const ideaIndex = db.globalIdeas.findIndex(i => i.id === id);
      if (ideaIndex === -1) return res.status(404).json({ success: false, error: 'Global idea not found' });

      if (req.method === 'GET') return res.json({ success: true, data: db.globalIdeas[ideaIndex] });
      if (req.method === 'PUT') {
        db.globalIdeas[ideaIndex] = { ...db.globalIdeas[ideaIndex], ...req.body };
        return res.json({ success: true, data: db.globalIdeas[ideaIndex] });
      }
      if (req.method === 'DELETE') {
        const deleted = db.globalIdeas.splice(ideaIndex, 1)[0];
        return res.json({ success: true, data: { deleted: deleted.id } });
      }
    }

    // Global idea convert
    const convertMatch = route.match(/^\/ideas\/global\/([^/]+)\/convert$/);
    if (convertMatch && req.method === 'POST') {
      const idea = db.globalIdeas.find(i => i.id === convertMatch[1]);
      if (!idea) return res.status(404).json({ success: false, error: 'Global idea not found' });
      return res.json({
        success: true,
        data: { prefill: { name: idea.title, description: idea.description, build_platform: idea.target_platform || 'custom' }, globalIdeaId: idea.id }
      });
    }

    // Global idea mark-converted
    const markConvertedMatch = route.match(/^\/ideas\/global\/([^/]+)\/mark-converted$/);
    if (markConvertedMatch && req.method === 'POST') {
      const ideaIndex = db.globalIdeas.findIndex(i => i.id === markConvertedMatch[1]);
      if (ideaIndex === -1) return res.status(404).json({ success: false, error: 'Global idea not found' });
      const { appId } = req.body;
      if (!appId || !db.applications.find(a => a.id === appId)) return res.status(400).json({ success: false, error: 'Valid appId required' });
      db.globalIdeas[ideaIndex] = { ...db.globalIdeas[ideaIndex], status: 'converted', converted_app_id: appId };
      return res.json({ success: true, data: db.globalIdeas[ideaIndex] });
    }

    // Settings
    if (route === '/settings' && req.method === 'GET') {
      return res.json({ success: true, data: db.settings.map(s => ({ ...s, value: s.encrypted ? '********' : s.value })) });
    }

    const settingMatch = route.match(/^\/settings\/([^/]+)$/);
    if (settingMatch && settingMatch[1] !== 'validate-api-key') {
      const key = settingMatch[1];
      if (req.method === 'GET') {
        const setting = db.settings.find(s => s.key === key);
        if (!setting) return res.status(404).json({ success: false, error: 'Setting not found' });
        return res.json({ success: true, data: { ...setting, value: setting.encrypted ? '********' : setting.value } });
      }
      if (req.method === 'PUT') {
        const { value, encrypted = false } = req.body;
        let setting = db.settings.find(s => s.key === key);
        if (setting) { setting.value = value; setting.encrypted = encrypted ? 1 : 0; setting.updated_at = new Date().toISOString(); }
        else { setting = { id: uuidv4(), key, value, encrypted: encrypted ? 1 : 0, updated_at: new Date().toISOString() }; db.settings.push(setting); }
        return res.json({ success: true, data: { ...setting, value: setting.encrypted ? '********' : setting.value } });
      }
      if (req.method === 'DELETE') {
        const idx = db.settings.findIndex(s => s.key === key);
        if (idx === -1) return res.status(404).json({ success: false, error: 'Setting not found' });
        db.settings.splice(idx, 1);
        return res.json({ success: true, data: { deleted: key } });
      }
    }

    if (route === '/settings/validate-api-key' && req.method === 'POST') {
      const { apiKey } = req.body;
      return res.json({ success: true, data: { valid: typeof apiKey === 'string' && apiKey.length > 10 } });
    }

    // Generate prompt
    if (route === '/generate-prompt' && req.method === 'POST') {
      const { appId, ideaIds } = req.body;
      const app = db.applications.find(a => a.id === appId);
      if (!app) return res.status(404).json({ success: false, error: 'Application not found' });

      let ideas = db.ideas.filter(i => i.app_id === appId);
      if (ideaIds?.length) ideas = ideas.filter(i => ideaIds.includes(i.id));
      else ideas = ideas.filter(i => i.status === 'pending');

      const ideasText = ideas.map(i => `- ${i.title}${i.description ? `: ${i.description}` : ''} [Priority: ${i.priority}]`).join('\n');
      const prompt = `Application: ${app.name}\n${app.description ? `Description: ${app.description}\n` : ''}${app.github_url ? `GitHub: ${app.github_url}\n` : ''}${app.live_url ? `Live URL: ${app.live_url}\n` : ''}Platform: ${app.build_platform}\n\n${ideas.length > 0 ? `Ideas to implement:\n${ideasText}` : 'No pending ideas.'}\n\nPlease help me implement the above ideas for this application.`;

      const generated = { id: uuidv4(), app_id: appId, prompt, ideas_count: ideas.length, idea_ids: ideas.map(i => i.id), created_at: new Date().toISOString() };
      db.generatedPrompts.push(generated);
      return res.status(201).json({ success: true, data: { id: generated.id, prompt, ideas_count: generated.ideas_count, created_at: generated.created_at } });
    }

    // Generate prompt history
    const historyMatch = route.match(/^\/generate-prompt\/history\/([^/]+)$/);
    if (historyMatch && req.method === 'GET') {
      const appId = historyMatch[1];
      if (!db.applications.find(a => a.id === appId)) return res.status(404).json({ success: false, error: 'Application not found' });
      let prompts = db.generatedPrompts.filter(p => p.app_id === appId).sort((a, b) => b.created_at.localeCompare(a.created_at));
      const limit = parseInt(String(req.query.limit || '0'), 10);
      if (limit > 0) prompts = prompts.slice(0, limit);
      return res.json({ success: true, data: prompts });
    }

    // Generate prompt by ID
    const promptMatch = route.match(/^\/generate-prompt\/([^/]+)$/);
    if (promptMatch && promptMatch[1] !== 'history') {
      const idx = db.generatedPrompts.findIndex(p => p.id === promptMatch[1]);
      if (idx === -1) return res.status(404).json({ success: false, error: 'Generated prompt not found' });
      if (req.method === 'GET') return res.json({ success: true, data: db.generatedPrompts[idx] });
      if (req.method === 'DELETE') {
        const deleted = db.generatedPrompts.splice(idx, 1)[0];
        return res.json({ success: true, data: { deleted: deleted.id } });
      }
    }

    return res.status(404).json({ success: false, error: 'Not found' });
  } catch (error) {
    console.error('API Error:', error);
    return res.status(500).json({ success: false, error: 'Internal server error' });
  }
}
