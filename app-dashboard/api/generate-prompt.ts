import type { VercelRequest, VercelResponse } from '@vercel/node';
import { v4 as uuidv4 } from 'uuid';
import { db } from './db';

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
      const { appId, ideaIds } = req.body;

      if (!appId) {
        return res.status(400).json({ success: false, error: 'appId is required' });
      }

      // Find the application
      const app = db.applications.find(a => a.id === appId);
      if (!app) {
        return res.status(404).json({ success: false, error: 'Application not found' });
      }

      // Get ideas for this app (either specific ones or all pending)
      let ideas = db.ideas.filter(i => i.app_id === appId);
      if (ideaIds && ideaIds.length > 0) {
        ideas = ideas.filter(i => ideaIds.includes(i.id));
      } else {
        ideas = ideas.filter(i => i.status === 'pending');
      }

      // Generate a prompt based on app and ideas
      const now = new Date().toISOString();
      const ideasText = ideas.map(i =>
        `- ${i.title}${i.description ? `: ${i.description}` : ''} [Priority: ${i.priority}]`
      ).join('\n');

      const prompt = `Application: ${app.name}
${app.description ? `Description: ${app.description}` : ''}
${app.github_url ? `GitHub: ${app.github_url}` : ''}
${app.live_url ? `Live URL: ${app.live_url}` : ''}
Platform: ${app.build_platform}

${ideas.length > 0 ? `Ideas to implement:\n${ideasText}` : 'No pending ideas.'}

Please help me implement the above ideas for this application.`;

      const generatedPrompt = {
        id: uuidv4(),
        app_id: appId,
        prompt,
        ideas_count: ideas.length,
        idea_ids: ideas.map(i => i.id),
        created_at: now
      };

      db.generatedPrompts.push(generatedPrompt);

      return res.status(201).json({
        success: true,
        data: {
          id: generatedPrompt.id,
          prompt: generatedPrompt.prompt,
          ideas_count: generatedPrompt.ideas_count,
          created_at: generatedPrompt.created_at
        }
      });
    }

    return res.status(405).json({ success: false, error: 'Method not allowed' });
  } catch (error) {
    console.error('API Error:', error);
    return res.status(500).json({ success: false, error: 'Internal server error' });
  }
}
