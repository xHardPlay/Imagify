import { useState, useEffect, useCallback } from 'react';
import { api, Workflow, ApiSettings } from '../services/api';
import { ImageAnalysis, AppState } from '../types';

const initialState: AppState = {
  workflows: [],
  currentWorkflow: null,
  currentImage: null,
  apiSettings: null,
  isProcessing: false,
};

export function useAppState() {
  const [appState, setAppState] = useState<AppState>(initialState);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Transform API workflow to app workflow
  const transformWorkflow = (apiWorkflow: Workflow): any => ({
    id: apiWorkflow.id,
    name: apiWorkflow.name,
    description: apiWorkflow.description || '',
    variables: apiWorkflow.variables.map(v => ({
      id: v.id,
      name: v.name,
      type: v.type,
      description: v.description || '',
      defaultValue: v.defaultValue || '',
      required: v.required || false,
    })),
    createdAt: new Date(apiWorkflow.created_at),
    updatedAt: new Date(apiWorkflow.updated_at),
  });

  // Transform API settings to app settings
  const transformSettings = (apiSettings: ApiSettings): any => ({
    geminiApiKey: '', // Never store the actual key on client
    model: apiSettings.model,
    maxTokens: apiSettings.maxTokens,
    temperature: apiSettings.temperature,
    hasApiKey: apiSettings.hasApiKey,
  });

  // Load initial data from API
  const loadData = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const [workflowsRes, settingsRes] = await Promise.all([
        api.getWorkflows(),
        api.getSettings(),
      ]);

      const workflows = workflowsRes.data?.map(transformWorkflow) || [];
      const apiSettings = settingsRes.data ? transformSettings(settingsRes.data) : null;

      setAppState(prev => ({
        ...prev,
        workflows,
        apiSettings,
        currentWorkflow: workflows[0] || null,
      }));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load data');
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Load data on mount
  useEffect(() => {
    loadData();
  }, [loadData]);

  // Update app state
  const updateAppState = useCallback((updates: Partial<AppState>) => {
    setAppState(prev => ({ ...prev, ...updates }));
  }, []);

  // Create workflow
  const createWorkflow = useCallback(async (name: string, description?: string) => {
    try {
      const response = await api.createWorkflow({ name, description });
      if (response.success && response.data) {
        const newWorkflow = transformWorkflow(response.data);
        setAppState(prev => ({
          ...prev,
          workflows: [...prev.workflows, newWorkflow],
          currentWorkflow: newWorkflow,
        }));
        return newWorkflow;
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create workflow');
    }
  }, []);

  // Update workflow
  const updateWorkflow = useCallback(async (id: string, updates: { name?: string; description?: string; variables?: any[] }) => {
    try {
      const response = await api.updateWorkflow(id, updates);
      if (response.success && response.data) {
        const updatedWorkflow = transformWorkflow(response.data);
        setAppState(prev => ({
          ...prev,
          workflows: prev.workflows.map(w => w.id === id ? updatedWorkflow : w),
          currentWorkflow: prev.currentWorkflow?.id === id ? updatedWorkflow : prev.currentWorkflow,
        }));
        return updatedWorkflow;
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update workflow');
    }
  }, []);

  // Delete workflow
  const deleteWorkflow = useCallback(async (id: string) => {
    try {
      await api.deleteWorkflow(id);
      setAppState(prev => ({
        ...prev,
        workflows: prev.workflows.filter(w => w.id !== id),
        currentWorkflow: prev.currentWorkflow?.id === id ? null : prev.currentWorkflow,
        currentImage: null,
      }));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete workflow');
    }
  }, []);

  // Update settings
  const updateSettings = useCallback(async (settings: { geminiApiKey?: string; model?: string; maxTokens?: number; temperature?: number }) => {
    try {
      const response = await api.updateSettings(settings);
      if (response.success && response.data) {
        const updatedSettings = transformSettings(response.data);
        setAppState(prev => ({
          ...prev,
          apiSettings: updatedSettings,
        }));
        return updatedSettings;
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update settings');
      throw err;
    }
  }, []);

  // Set current workflow
  const selectWorkflow = useCallback((workflow: any) => {
    setAppState(prev => ({
      ...prev,
      currentWorkflow: workflow,
    }));
  }, []);

  // Set current image
  const setCurrentImage = useCallback((image: ImageAnalysis | null) => {
    setAppState(prev => ({
      ...prev,
      currentImage: image,
    }));
  }, []);

  // Set processing state
  const setIsProcessing = useCallback((isProcessing: boolean) => {
    setAppState(prev => ({
      ...prev,
      isProcessing,
    }));
  }, []);

  return {
    appState,
    isLoading,
    error,
    updateAppState,
    createWorkflow,
    updateWorkflow,
    deleteWorkflow,
    updateSettings,
    selectWorkflow,
    setCurrentImage,
    setIsProcessing,
    reload: loadData,
  };
}
