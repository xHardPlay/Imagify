// API client service for FLUX Studio

const API_BASE = '/api';

export interface User {
  id: string;
  email: string;
}

export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
}

export interface WorkflowVariable {
  id: string;
  name: string;
  type: 'text' | 'number' | 'color' | 'boolean' | 'list';
  description?: string;
  defaultValue?: string;
  required?: boolean;
}

export interface Workflow {
  id: string;
  name: string;
  description?: string;
  variables: WorkflowVariable[];
  created_at: string;
  updated_at: string;
}

export interface ApiSettings {
  geminiApiKey: string | null;
  geminiApiKeyMasked: string | null;
  model: string;
  maxTokens: number;
  temperature: number;
  hasApiKey: boolean;
}

export interface GeminiModel {
  id: string;
  displayName: string;
  supportsVision: boolean;
  isRecommended?: boolean;
}

// Auth routes should not trigger the unauthorized event on 401
// because they're expected to fail with 401 for invalid credentials
const AUTH_ROUTES = ['/auth/login', '/auth/register'];

class ApiClient {
  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<ApiResponse<T>> {
    const isAuthRoute = AUTH_ROUTES.some(route => endpoint.includes(route));

    try {
      const response = await fetch(`${API_BASE}${endpoint}`, {
        ...options,
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
          ...options.headers,
        },
      });

      let data: ApiResponse<T>;
      try {
        data = await response.json();
      } catch {
        // If JSON parsing fails, create a generic error response
        data = { success: false, error: 'Invalid server response' };
      }

      if (response.status === 401) {
        // Only dispatch unauthorized event for non-auth routes
        // Auth routes (login/register) are expected to return 401 for invalid credentials
        if (!isAuthRoute) {
          window.dispatchEvent(new CustomEvent('auth:unauthorized'));
        }
        throw new Error(data.error || 'Unauthorized');
      }

      if (!response.ok) {
        throw new Error(data.error || 'API Error');
      }

      return data;
    } catch (error) {
      if (error instanceof Error) {
        throw error;
      }
      throw new Error('Network error');
    }
  }

  // Auth methods
  async login(email: string, password: string): Promise<ApiResponse<{ user: User }>> {
    return this.request('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });
  }

  async register(email: string, password: string): Promise<ApiResponse<{ user: User }>> {
    return this.request('/auth/register', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });
  }

  async logout(): Promise<ApiResponse<{ message: string }>> {
    return this.request('/auth/logout', { method: 'POST' });
  }

  async getCurrentUser(): Promise<ApiResponse<{ user: User }>> {
    return this.request('/auth/me');
  }

  // Workflow methods
  async getWorkflows(): Promise<ApiResponse<Workflow[]>> {
    return this.request('/workflows');
  }

  async getWorkflow(id: string): Promise<ApiResponse<Workflow>> {
    return this.request(`/workflows/${id}`);
  }

  async createWorkflow(workflow: {
    name: string;
    description?: string;
    variables?: Omit<WorkflowVariable, 'id'>[];
  }): Promise<ApiResponse<Workflow>> {
    return this.request('/workflows', {
      method: 'POST',
      body: JSON.stringify(workflow),
    });
  }

  async updateWorkflow(
    id: string,
    updates: {
      name?: string;
      description?: string;
      variables?: WorkflowVariable[];
    }
  ): Promise<ApiResponse<Workflow>> {
    return this.request(`/workflows/${id}`, {
      method: 'PUT',
      body: JSON.stringify(updates),
    });
  }

  async deleteWorkflow(id: string): Promise<ApiResponse<{ message: string }>> {
    return this.request(`/workflows/${id}`, { method: 'DELETE' });
  }

  // Settings methods
  async getSettings(): Promise<ApiResponse<ApiSettings>> {
    return this.request('/settings');
  }

  async updateSettings(settings: {
    geminiApiKey?: string;
    model?: string;
    maxTokens?: number;
    temperature?: number;
  }): Promise<ApiResponse<ApiSettings>> {
    return this.request('/settings', {
      method: 'PUT',
      body: JSON.stringify(settings),
    });
  }

  // Gemini methods
  async getModels(): Promise<ApiResponse<GeminiModel[]>> {
    return this.request('/gemini/models');
  }

  async analyzeImage(
    contents: Array<{
      parts: Array<{
        text?: string;
        inline_data?: {
          mime_type: string;
          data: string;
        };
      }>;
    }>,
    generationConfig?: {
      temperature?: number;
      maxOutputTokens?: number;
    }
  ): Promise<ApiResponse<any>> {
    return this.request('/gemini/proxy', {
      method: 'POST',
      body: JSON.stringify({ contents, generationConfig }),
    });
  }
}

export const api = new ApiClient();
