/**
 * Claude API Service
 * Handles communication with Anthropic's Claude API for prompt generation
 */

import { Application, AppIdea } from '../types';

const ANTHROPIC_API_URL = 'https://api.anthropic.com/v1/messages';
const MODEL = 'claude-sonnet-4-20250514';

interface ClaudeMessage {
  role: 'user' | 'assistant';
  content: string;
}

interface ClaudeRequest {
  model: string;
  max_tokens: number;
  messages: ClaudeMessage[];
}

interface ClaudeResponse {
  id: string;
  type: string;
  role: string;
  content: Array<{ type: string; text: string }>;
  model: string;
  stop_reason: string;
  usage: {
    input_tokens: number;
    output_tokens: number;
  };
}

/**
 * Build the prompt template for Claude to generate implementation prompts
 */
function buildPromptTemplate(app: Application, ideas: AppIdea[]): string {
  const ideasText = ideas
    .map(
      (idea) => `
- Title: ${idea.title}
  Description: ${idea.description || 'No description provided'}
  Priority: ${idea.priority}
  Status: ${idea.status}`
    )
    .join('\n');

  return `You are a technical prompt engineer. Given the following application context and feature ideas, generate a detailed, professional, and well-structured prompt that can be sent to Claude Code for implementation.

APPLICATION CONTEXT:
- Name: ${app.name}
- Description: ${app.description || 'No description provided'}
- Build Platform: ${app.build_platform}
- Database: ${app.database_platform || 'Not specified'}
- Frontend: ${app.frontend_platform || 'Not specified'}
- GitHub: ${app.github_url || 'Not specified'}
- Live URL: ${app.live_url || 'Not specified'}

FEATURE IDEAS TO IMPLEMENT:
${ideasText}

Generate a comprehensive prompt that:
1. Clearly defines each feature with technical specifications
2. Suggests appropriate implementation approaches based on the tech stack
3. Includes database schema changes if needed
4. Specifies UI/UX requirements
5. Lists edge cases and error handling requirements
6. Is formatted for easy copy-paste to Claude Code

Output the prompt in a code block for easy copying. The prompt should be actionable and ready to use immediately.`;
}

/**
 * Generate an implementation prompt using Claude API
 */
export async function generateImplementationPrompt(
  apiKey: string,
  app: Application,
  ideas: AppIdea[]
): Promise<string> {
  const requestBody: ClaudeRequest = {
    model: MODEL,
    max_tokens: 4096,
    messages: [
      {
        role: 'user',
        content: buildPromptTemplate(app, ideas)
      }
    ]
  };

  const response = await fetch(ANTHROPIC_API_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': apiKey,
      'anthropic-version': '2023-06-01'
    },
    body: JSON.stringify(requestBody)
  });

  if (!response.ok) {
    const errorText = await response.text();
    let errorMessage = 'Failed to generate prompt';

    try {
      const errorJson = JSON.parse(errorText);
      if (errorJson.error?.message) {
        errorMessage = errorJson.error.message;
      }
    } catch {
      // Use default error message
    }

    if (response.status === 401) {
      throw new Error('Invalid API key. Please check your Anthropic API key in settings.');
    }
    if (response.status === 429) {
      throw new Error('Rate limit exceeded. Please wait a moment and try again.');
    }
    if (response.status === 400) {
      throw new Error(`Bad request: ${errorMessage}`);
    }

    throw new Error(`API error (${response.status}): ${errorMessage}`);
  }

  const data: ClaudeResponse = await response.json();

  if (!data.content || data.content.length === 0) {
    throw new Error('No response content from Claude API');
  }

  return data.content[0].text;
}
