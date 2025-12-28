/**
 * API Service
 * Handles all HTTP requests to the backend server
 */

import type {
  Application,
  AppNote,
  AppIdea,
  GlobalIdea,
  Setting,
  GeneratedPrompt,
  ApplicationStatusCheck,
  ApiResponse,
  CreateApplicationData,
  CreateIdeaData,
  CreateGlobalIdeaData,
  ExportData,
  IdeaStatus,
  IdeaPriority,
  GlobalIdeaStatus,
  GlobalIdeaComplexity,
} from '../types';

const API_BASE = import.meta.env.VITE_API_URL || '/api';

/**
 * Generic fetch wrapper with error handling
 */
async function fetchApi<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<ApiResponse<T>> {
  try {
    const response = await fetch(`${API_BASE}${endpoint}`, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
    });

    const data = await response.json();

    if (!response.ok) {
      return {
        success: false,
        error: data.error || `HTTP error ${response.status}`,
      };
    }

    return data;
  } catch (error) {
    console.error('API Error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Network error',
    };
  }
}

// ============== Applications API ==============

export async function getApplications(params?: {
  status?: string;
  search?: string;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}): Promise<ApiResponse<Application[]>> {
  const searchParams = new URLSearchParams();
  if (params?.status) searchParams.append('status', params.status);
  if (params?.search) searchParams.append('search', params.search);
  if (params?.sortBy) searchParams.append('sortBy', params.sortBy);
  if (params?.sortOrder) searchParams.append('sortOrder', params.sortOrder);

  const query = searchParams.toString();
  return fetchApi<Application[]>(`/applications${query ? `?${query}` : ''}`);
}

export async function getApplication(id: string): Promise<ApiResponse<Application>> {
  return fetchApi<Application>(`/applications/${id}`);
}

export async function getApplicationStatus(id: string): Promise<ApiResponse<ApplicationStatusCheck>> {
  return fetchApi<ApplicationStatusCheck>(`/applications/${id}/status`);
}

export async function createApplication(data: CreateApplicationData): Promise<ApiResponse<Application>> {
  return fetchApi<Application>('/applications', {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

export async function updateApplication(
  id: string,
  data: Partial<CreateApplicationData> & { status?: string }
): Promise<ApiResponse<Application>> {
  return fetchApi<Application>(`/applications/${id}`, {
    method: 'PUT',
    body: JSON.stringify(data),
  });
}

export async function deleteApplication(id: string): Promise<ApiResponse<{ deleted: string }>> {
  return fetchApi<{ deleted: string }>(`/applications/${id}`, {
    method: 'DELETE',
  });
}

export async function exportAllData(): Promise<ApiResponse<ExportData>> {
  return fetchApi<ExportData>('/applications/export/all');
}

// ============== Notes API ==============

export async function getNotes(appId: string): Promise<ApiResponse<AppNote>> {
  return fetchApi<AppNote>(`/notes/${appId}`);
}

export async function updateNotes(appId: string, content: string): Promise<ApiResponse<AppNote>> {
  return fetchApi<AppNote>(`/notes/${appId}`, {
    method: 'PUT',
    body: JSON.stringify({ content }),
  });
}

// ============== Application Ideas API ==============

export async function getAppIdeas(
  appId: string,
  params?: {
    status?: string;
    priority?: string;
    sortBy?: string;
    sortOrder?: 'asc' | 'desc';
  }
): Promise<ApiResponse<AppIdea[]>> {
  const searchParams = new URLSearchParams();
  if (params?.status) searchParams.append('status', params.status);
  if (params?.priority) searchParams.append('priority', params.priority);
  if (params?.sortBy) searchParams.append('sortBy', params.sortBy);
  if (params?.sortOrder) searchParams.append('sortOrder', params.sortOrder);

  const query = searchParams.toString();
  return fetchApi<AppIdea[]>(`/ideas/app/${appId}${query ? `?${query}` : ''}`);
}

export async function createAppIdea(appId: string, data: CreateIdeaData): Promise<ApiResponse<AppIdea>> {
  return fetchApi<AppIdea>(`/ideas/app/${appId}`, {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

export async function updateAppIdea(
  id: string,
  data: Partial<CreateIdeaData> & { status?: IdeaStatus; priority?: IdeaPriority }
): Promise<ApiResponse<AppIdea>> {
  return fetchApi<AppIdea>(`/ideas/${id}`, {
    method: 'PUT',
    body: JSON.stringify(data),
  });
}

export async function deleteAppIdea(id: string): Promise<ApiResponse<{ deleted: string }>> {
  return fetchApi<{ deleted: string }>(`/ideas/${id}`, {
    method: 'DELETE',
  });
}

// ============== Global Ideas API ==============

export async function getGlobalIdeas(params?: {
  status?: string;
  complexity?: string;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}): Promise<ApiResponse<GlobalIdea[]>> {
  const searchParams = new URLSearchParams();
  if (params?.status) searchParams.append('status', params.status);
  if (params?.complexity) searchParams.append('complexity', params.complexity);
  if (params?.sortBy) searchParams.append('sortBy', params.sortBy);
  if (params?.sortOrder) searchParams.append('sortOrder', params.sortOrder);

  const query = searchParams.toString();
  return fetchApi<GlobalIdea[]>(`/ideas/global${query ? `?${query}` : ''}`);
}

export async function createGlobalIdea(data: CreateGlobalIdeaData): Promise<ApiResponse<GlobalIdea>> {
  return fetchApi<GlobalIdea>('/ideas/global', {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

export async function updateGlobalIdea(
  id: string,
  data: Partial<CreateGlobalIdeaData> & { status?: GlobalIdeaStatus; complexity?: GlobalIdeaComplexity }
): Promise<ApiResponse<GlobalIdea>> {
  return fetchApi<GlobalIdea>(`/ideas/global/${id}`, {
    method: 'PUT',
    body: JSON.stringify(data),
  });
}

export async function deleteGlobalIdea(id: string): Promise<ApiResponse<{ deleted: string }>> {
  return fetchApi<{ deleted: string }>(`/ideas/global/${id}`, {
    method: 'DELETE',
  });
}

export async function convertGlobalIdea(
  id: string
): Promise<ApiResponse<{ prefill: Partial<CreateApplicationData>; globalIdeaId: string }>> {
  return fetchApi<{ prefill: Partial<CreateApplicationData>; globalIdeaId: string }>(
    `/ideas/global/${id}/convert`,
    { method: 'POST' }
  );
}

export async function markGlobalIdeaConverted(
  id: string,
  appId: string
): Promise<ApiResponse<GlobalIdea>> {
  return fetchApi<GlobalIdea>(`/ideas/global/${id}/mark-converted`, {
    method: 'POST',
    body: JSON.stringify({ appId }),
  });
}

// ============== Settings API ==============

export async function getSettings(): Promise<ApiResponse<Setting[]>> {
  return fetchApi<Setting[]>('/settings');
}

export async function getSetting(key: string): Promise<ApiResponse<Setting>> {
  return fetchApi<Setting>(`/settings/${key}`);
}

export async function updateSetting(key: string, value: string): Promise<ApiResponse<Setting>> {
  return fetchApi<Setting>(`/settings/${key}`, {
    method: 'PUT',
    body: JSON.stringify({ value }),
  });
}

export async function deleteSetting(key: string): Promise<ApiResponse<{ deleted: string }>> {
  return fetchApi<{ deleted: string }>(`/settings/${key}`, {
    method: 'DELETE',
  });
}

export async function validateApiKey(apiKey: string): Promise<ApiResponse<{ valid: boolean }>> {
  return fetchApi<{ valid: boolean }>('/settings/validate-api-key', {
    method: 'POST',
    body: JSON.stringify({ apiKey }),
  });
}

// ============== Prompt Generator API ==============

export async function generatePrompt(
  appId: string,
  ideaIds?: string[]
): Promise<ApiResponse<{ id: string; prompt: string; ideas_count: number; created_at: string }>> {
  return fetchApi<{ id: string; prompt: string; ideas_count: number; created_at: string }>(
    '/generate-prompt',
    {
      method: 'POST',
      body: JSON.stringify({ appId, ideaIds }),
    }
  );
}

export async function getPromptHistory(
  appId: string,
  limit?: number
): Promise<ApiResponse<GeneratedPrompt[]>> {
  const query = limit ? `?limit=${limit}` : '';
  return fetchApi<GeneratedPrompt[]>(`/generate-prompt/history/${appId}${query}`);
}

export async function getGeneratedPrompt(id: string): Promise<ApiResponse<GeneratedPrompt>> {
  return fetchApi<GeneratedPrompt>(`/generate-prompt/${id}`);
}

export async function deleteGeneratedPrompt(id: string): Promise<ApiResponse<{ deleted: string }>> {
  return fetchApi<{ deleted: string }>(`/generate-prompt/${id}`, {
    method: 'DELETE',
  });
}

// ============== Health Check ==============

export async function checkHealth(): Promise<ApiResponse<{ status: string; timestamp: string; version: string }>> {
  return fetchApi<{ status: string; timestamp: string; version: string }>('/health');
}
