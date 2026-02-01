import { describe, it, expect, vi, beforeEach } from 'vitest';
import { api } from '../../services/api';

describe('API Client', () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });

  describe('login', () => {
    it('should call POST /api/auth/login with credentials', async () => {
      const mockResponse = {
        success: true,
        data: { user: { id: '123', email: 'test@example.com' } }
      };

      vi.mocked(global.fetch).mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: () => Promise.resolve(mockResponse)
      } as Response);

      const result = await api.login('test@example.com', 'Password123');

      expect(global.fetch).toHaveBeenCalledWith(
        '/api/auth/login',
        expect.objectContaining({
          method: 'POST',
          credentials: 'include',
          body: JSON.stringify({ email: 'test@example.com', password: 'Password123' })
        })
      );
      expect(result.success).toBe(true);
      expect(result.data?.user.email).toBe('test@example.com');
    });

    it('should throw error for invalid credentials', async () => {
      const mockResponse = { success: false, error: 'Invalid credentials' };

      vi.mocked(global.fetch).mockResolvedValueOnce({
        ok: false,
        status: 401,
        json: () => Promise.resolve(mockResponse)
      } as Response);

      await expect(api.login('wrong@example.com', 'wrong')).rejects.toThrow('Invalid credentials');
    });
  });

  describe('register', () => {
    it('should call POST /api/auth/register with user data', async () => {
      const mockResponse = {
        success: true,
        data: { user: { id: '456', email: 'new@example.com' } }
      };

      vi.mocked(global.fetch).mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: () => Promise.resolve(mockResponse)
      } as Response);

      const result = await api.register('new@example.com', 'NewPassword123');

      expect(global.fetch).toHaveBeenCalledWith(
        '/api/auth/register',
        expect.objectContaining({
          method: 'POST',
          body: JSON.stringify({ email: 'new@example.com', password: 'NewPassword123' })
        })
      );
      expect(result.success).toBe(true);
    });

    it('should handle duplicate email error', async () => {
      const mockResponse = { success: false, error: 'Email already exists' };

      vi.mocked(global.fetch).mockResolvedValueOnce({
        ok: false,
        status: 400,
        json: () => Promise.resolve(mockResponse)
      } as Response);

      await expect(api.register('existing@example.com', 'Password123')).rejects.toThrow('Email already exists');
    });
  });

  describe('logout', () => {
    it('should call POST /api/auth/logout', async () => {
      const mockResponse = { success: true, data: { message: 'Logged out' } };

      vi.mocked(global.fetch).mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: () => Promise.resolve(mockResponse)
      } as Response);

      const result = await api.logout();

      expect(global.fetch).toHaveBeenCalledWith(
        '/api/auth/logout',
        expect.objectContaining({ method: 'POST' })
      );
      expect(result.success).toBe(true);
    });
  });

  describe('getCurrentUser', () => {
    it('should return user when authenticated', async () => {
      const mockResponse = {
        success: true,
        data: { user: { id: '123', email: 'test@example.com' } }
      };

      vi.mocked(global.fetch).mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: () => Promise.resolve(mockResponse)
      } as Response);

      const result = await api.getCurrentUser();

      expect(result.success).toBe(true);
      expect(result.data?.user.id).toBe('123');
    });

    it('should dispatch unauthorized event on 401', async () => {
      const mockResponse = { success: false, error: 'Unauthorized' };
      const dispatchSpy = vi.spyOn(window, 'dispatchEvent');

      vi.mocked(global.fetch).mockResolvedValueOnce({
        ok: false,
        status: 401,
        json: () => Promise.resolve(mockResponse)
      } as Response);

      await expect(api.getCurrentUser()).rejects.toThrow('Unauthorized');
      expect(dispatchSpy).toHaveBeenCalledWith(expect.any(CustomEvent));
    });
  });

  describe('workflows', () => {
    it('should get all workflows', async () => {
      const mockWorkflows = [
        { id: '1', name: 'Workflow 1', variables: [], created_at: '', updated_at: '' }
      ];
      const mockResponse = { success: true, data: mockWorkflows };

      vi.mocked(global.fetch).mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: () => Promise.resolve(mockResponse)
      } as Response);

      const result = await api.getWorkflows();

      expect(global.fetch).toHaveBeenCalledWith(
        '/api/workflows',
        expect.objectContaining({ credentials: 'include' })
      );
      expect(result.data).toHaveLength(1);
    });

    it('should create a workflow', async () => {
      const newWorkflow = { name: 'New Workflow', description: 'Test' };
      const mockResponse = {
        success: true,
        data: { id: '123', ...newWorkflow, variables: [], created_at: '', updated_at: '' }
      };

      vi.mocked(global.fetch).mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: () => Promise.resolve(mockResponse)
      } as Response);

      const result = await api.createWorkflow(newWorkflow);

      expect(global.fetch).toHaveBeenCalledWith(
        '/api/workflows',
        expect.objectContaining({
          method: 'POST',
          body: JSON.stringify(newWorkflow)
        })
      );
      expect(result.data?.name).toBe('New Workflow');
    });

    it('should update a workflow', async () => {
      const updates = { name: 'Updated Workflow' };
      const mockResponse = {
        success: true,
        data: { id: '123', name: 'Updated Workflow', variables: [], created_at: '', updated_at: '' }
      };

      vi.mocked(global.fetch).mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: () => Promise.resolve(mockResponse)
      } as Response);

      const result = await api.updateWorkflow('123', updates);

      expect(global.fetch).toHaveBeenCalledWith(
        '/api/workflows/123',
        expect.objectContaining({
          method: 'PUT',
          body: JSON.stringify(updates)
        })
      );
      expect(result.data?.name).toBe('Updated Workflow');
    });

    it('should delete a workflow', async () => {
      const mockResponse = { success: true, data: { message: 'Deleted' } };

      vi.mocked(global.fetch).mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: () => Promise.resolve(mockResponse)
      } as Response);

      const result = await api.deleteWorkflow('123');

      expect(global.fetch).toHaveBeenCalledWith(
        '/api/workflows/123',
        expect.objectContaining({ method: 'DELETE' })
      );
      expect(result.success).toBe(true);
    });
  });

  describe('settings', () => {
    it('should get settings', async () => {
      const mockSettings = {
        geminiApiKey: null,
        geminiApiKeyMasked: null,
        model: 'gemini-1.5-flash',
        maxTokens: 2000,
        temperature: 0.4,
        hasApiKey: false
      };
      const mockResponse = { success: true, data: mockSettings };

      vi.mocked(global.fetch).mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: () => Promise.resolve(mockResponse)
      } as Response);

      const result = await api.getSettings();

      expect(result.data?.model).toBe('gemini-1.5-flash');
    });

    it('should update settings', async () => {
      const updates = { model: 'gemini-1.5-pro', maxTokens: 4000 };
      const mockResponse = {
        success: true,
        data: { ...updates, geminiApiKey: null, geminiApiKeyMasked: null, temperature: 0.4, hasApiKey: false }
      };

      vi.mocked(global.fetch).mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: () => Promise.resolve(mockResponse)
      } as Response);

      const result = await api.updateSettings(updates);

      expect(global.fetch).toHaveBeenCalledWith(
        '/api/settings',
        expect.objectContaining({
          method: 'PUT',
          body: JSON.stringify(updates)
        })
      );
      expect(result.data?.model).toBe('gemini-1.5-pro');
    });
  });

  describe('gemini', () => {
    it('should get available models', async () => {
      const mockModels = [
        { id: 'gemini-1.5-flash', displayName: 'Gemini 1.5 Flash', supportsVision: true }
      ];
      const mockResponse = { success: true, data: mockModels };

      vi.mocked(global.fetch).mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: () => Promise.resolve(mockResponse)
      } as Response);

      const result = await api.getModels();

      expect(result.data).toHaveLength(1);
      expect(result.data?.[0].supportsVision).toBe(true);
    });

    it('should analyze image through proxy', async () => {
      const contents = [{
        parts: [
          { text: 'Analyze this image' },
          { inline_data: { mime_type: 'image/jpeg', data: 'base64data' } }
        ]
      }];
      const mockResponse = { success: true, data: { candidates: [] } };

      vi.mocked(global.fetch).mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: () => Promise.resolve(mockResponse)
      } as Response);

      const result = await api.analyzeImage(contents);

      expect(global.fetch).toHaveBeenCalledWith(
        '/api/gemini/proxy',
        expect.objectContaining({
          method: 'POST',
          body: JSON.stringify({ contents })
        })
      );
      expect(result.success).toBe(true);
    });
  });
});
