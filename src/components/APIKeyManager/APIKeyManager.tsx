import React, { useState, useEffect, useCallback } from 'react';
import { Save, X, Eye, EyeOff, ExternalLink, RefreshCw, AlertCircle, Loader2 } from 'lucide-react';
import { APISettings } from '../../types';
import { api, GeminiModel } from '../../services/api';

interface ModelOption {
  id: string;
  displayName: string;
  description: string;
  supportsVision: boolean;
  isRecommended?: boolean;
}

interface APIKeyManagerProps {
  settings: APISettings | null;
  onSave: (settings: APISettings) => void;
  onCancel: () => void;
}

// Default fallback models when API is not available
const DEFAULT_MODELS: ModelOption[] = [
  { id: 'gemini-1.5-flash', displayName: 'Gemini 1.5 Flash', description: 'Fast & Efficient', supportsVision: true, isRecommended: true },
  { id: 'gemini-1.5-pro', displayName: 'Gemini 1.5 Pro', description: 'High Performance', supportsVision: true },
  { id: 'gemini-2.0-flash-exp', displayName: 'Gemini 2.0 Flash', description: 'Experimental', supportsVision: true },
  { id: 'gemini-pro-vision', displayName: 'Gemini Pro Vision', description: 'Legacy Vision', supportsVision: true },
  { id: 'gemini-pro', displayName: 'Gemini Pro', description: 'Text Only', supportsVision: false },
];

const APIKeyManager: React.FC<APIKeyManagerProps> = ({ settings, onSave, onCancel }) => {
  const [formData, setFormData] = useState({
    geminiApiKey: '',
    model: settings?.model || 'gemini-1.5-flash',
    maxTokens: settings?.maxTokens || 2000,
    temperature: settings?.temperature || 0.4,
  });

  const [showApiKey, setShowApiKey] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved'>('idle');

  // Model fetching state
  const [models, setModels] = useState<ModelOption[]>(DEFAULT_MODELS);
  const [modelsLoading, setModelsLoading] = useState(false);
  const [modelsError, setModelsError] = useState<string | null>(null);
  const [showAllModels, setShowAllModels] = useState(false);

  // Fetch models from API
  const fetchModels = useCallback(async () => {
    setModelsLoading(true);
    setModelsError(null);

    try {
      const response = await api.getModels();

      if (!response.success || !response.data) {
        throw new Error(response.error || 'Failed to fetch models');
      }

      const modelOptions: ModelOption[] = response.data.map((model: GeminiModel) => ({
        id: model.id,
        displayName: model.displayName,
        description: '',
        supportsVision: model.supportsVision,
        isRecommended: model.isRecommended,
      }));

      if (modelOptions.length > 0) {
        setModels(modelOptions);

        // If current model is not in the list, select the first recommended one
        const currentModelExists = modelOptions.some(m => m.id === formData.model);
        if (!currentModelExists) {
          const recommendedModel = modelOptions.find(m => m.isRecommended && m.supportsVision)
            || modelOptions.find(m => m.supportsVision)
            || modelOptions[0];
          setFormData(prev => ({ ...prev, model: recommendedModel.id }));
        }
      } else {
        setModels(DEFAULT_MODELS);
      }
    } catch (error) {
      console.error('Error fetching models:', error);
      setModelsError(error instanceof Error ? error.message : 'Failed to fetch models');
      setModels(DEFAULT_MODELS);
    } finally {
      setModelsLoading(false);
    }
  }, [formData.model]);

  // Fetch models on mount if user has API key configured
  useEffect(() => {
    if (settings?.hasApiKey) {
      fetchModels();
    }
  }, []);

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    // Only require API key if user doesn't have one already and didn't enter a new one
    if (!settings?.hasApiKey && !formData.geminiApiKey.trim()) {
      newErrors.geminiApiKey = 'API Key is required';
    } else if (formData.geminiApiKey.trim() && !formData.geminiApiKey.startsWith('AIza')) {
      newErrors.geminiApiKey = 'Invalid Google Gemini API Key format';
    }

    if (formData.maxTokens < 100 || formData.maxTokens > 4000) {
      newErrors.maxTokens = 'Max tokens must be between 100 and 4000';
    }

    if (formData.temperature < 0 || formData.temperature > 1) {
      newErrors.temperature = 'Temperature must be between 0 and 1';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (validateForm()) {
      setSaveStatus('saving');
      try {
        // Only include API key if user entered a new one
        const saveData: any = {
          model: formData.model,
          maxTokens: formData.maxTokens,
          temperature: formData.temperature,
        };

        if (formData.geminiApiKey.trim()) {
          saveData.geminiApiKey = formData.geminiApiKey;
        }

        onSave(saveData);
        setSaveStatus('saved');
        setTimeout(() => setSaveStatus('idle'), 2000);
      } catch (error) {
        setSaveStatus('idle');
        console.error('Error saving settings:', error);
      }
    }
  };

  const handleInputChange = (field: string, value: string | number) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  return (
    <div className="space-y-4 sm:space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-lg sm:text-xl font-semibold text-gray-900">API Configuration</h2>
        <button
          onClick={onCancel}
          className="btn btn-ghost btn-sm"
        >
          <X className="h-4 w-4" />
        </button>
      </div>

      <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 sm:p-4">
        <div className="flex items-start">
          <div className="flex-1">
            <h3 className="text-xs sm:text-sm font-medium text-blue-800">
              Google Gemini API Key {settings?.hasApiKey ? '(Configured)' : 'Required'}
            </h3>
            <p className="mt-1 text-xs sm:text-sm text-blue-700">
              {settings?.hasApiKey
                ? 'Your API key is securely stored. Enter a new key to update it.'
                : 'You need a Google Gemini API key to use image analysis features.'}
              {' '}Your API key is encrypted and stored securely.
            </p>
            <a
              href="https://aistudio.google.com/app/apikey"
              target="_blank"
              rel="noopener noreferrer"
              className="mt-2 inline-flex items-center text-xs sm:text-sm text-blue-600 hover:text-blue-800"
            >
              Get your API key here
              <ExternalLink className="ml-1 h-3 w-3" />
            </a>
          </div>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-3 sm:space-y-4">
        {/* API Key */}
        <div>
          <label htmlFor="apiKey" className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">
            Google Gemini API Key {settings?.hasApiKey ? '(leave blank to keep current)' : '*'}
          </label>
          <div className="relative">
            <input
              id="apiKey"
              type={showApiKey ? 'text' : 'password'}
              value={formData.geminiApiKey}
              onChange={(e) => handleInputChange('geminiApiKey', e.target.value)}
              placeholder={settings?.hasApiKey ? '••••••••••••••••' : 'AIza...'}
              className={`w-full px-3 py-2 pr-10 border rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 text-sm ${
                errors.geminiApiKey ? 'border-red-500' : 'border-gray-300'
              }`}
            />
            <button
              type="button"
              onClick={() => setShowApiKey(!showApiKey)}
              className="absolute inset-y-0 right-0 pr-3 flex items-center"
            >
              {showApiKey ? (
                <EyeOff className="h-4 w-4 text-gray-400" />
              ) : (
                <Eye className="h-4 w-4 text-gray-400" />
              )}
            </button>
          </div>
          {errors.geminiApiKey && (
            <p className="mt-1 text-xs sm:text-sm text-red-600">{errors.geminiApiKey}</p>
          )}
        </div>

        {/* Model Selection */}
        <div>
          <div className="flex items-center justify-between mb-1">
            <label htmlFor="model" className="block text-xs sm:text-sm font-medium text-gray-700">
              Model
            </label>
            <div className="flex items-center gap-2">
              {modelsLoading && (
                <span className="flex items-center text-xs text-gray-500">
                  <Loader2 className="h-3 w-3 mr-1 animate-spin" />
                  Loading...
                </span>
              )}
              {settings?.hasApiKey && !modelsLoading && (
                <button
                  type="button"
                  onClick={fetchModels}
                  className="flex items-center text-xs text-blue-600 hover:text-blue-800"
                  title="Refresh model list"
                >
                  <RefreshCw className="h-3 w-3 mr-1" />
                  Refresh
                </button>
              )}
            </div>
          </div>

          {modelsError && (
            <div className="mb-2 flex items-center text-xs text-amber-600 bg-amber-50 px-2 py-1 rounded">
              <AlertCircle className="h-3 w-3 mr-1 flex-shrink-0" />
              {modelsError} - Using default models
            </div>
          )}

          <select
            id="model"
            value={formData.model}
            onChange={(e) => handleInputChange('model', e.target.value)}
            disabled={modelsLoading}
            className={`w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 text-sm ${
              modelsLoading ? 'bg-gray-100 cursor-wait' : ''
            }`}
          >
            {/* Vision-capable models */}
            <optgroup label="Vision Models (Supports Images)">
              {models
                .filter(m => m.supportsVision)
                .map(model => (
                  <option key={model.id} value={model.id}>
                    {model.isRecommended ? '* ' : ''}{model.displayName}
                    {model.isRecommended ? ' (Recommended)' : ''}
                  </option>
                ))}
            </optgroup>

            {/* Text-only models - show only if toggle is on or if there are any */}
            {(showAllModels || models.some(m => !m.supportsVision)) && (
              <optgroup label="Text Only Models">
                {models
                  .filter(m => !m.supportsVision)
                  .map(model => (
                    <option key={model.id} value={model.id} disabled={!showAllModels}>
                      {model.displayName} (No image support)
                    </option>
                  ))}
              </optgroup>
            )}
          </select>

          <div className="mt-2 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1">
            <p className="text-xs text-gray-500">
              {models.find(m => m.id === formData.model)?.supportsVision
                ? 'This model supports image analysis'
                : 'This model does NOT support images'}
            </p>
            <label className="flex items-center text-xs text-gray-500 cursor-pointer">
              <input
                type="checkbox"
                checked={showAllModels}
                onChange={(e) => setShowAllModels(e.target.checked)}
                className="mr-1 h-3 w-3"
              />
              Show text-only models
            </label>
          </div>
        </div>

        {/* Max Tokens */}
        <div>
          <label htmlFor="maxTokens" className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">
            Max Tokens
          </label>
          <input
            id="maxTokens"
            type="number"
            min="100"
            max="4000"
            value={formData.maxTokens}
            onChange={(e) => handleInputChange('maxTokens', parseInt(e.target.value))}
            className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 text-sm ${
              errors.maxTokens ? 'border-red-500' : 'border-gray-300'
            }`}
          />
          {errors.maxTokens && (
            <p className="mt-1 text-xs sm:text-sm text-red-600">{errors.maxTokens}</p>
          )}
        </div>

        {/* Temperature */}
        <div>
          <label htmlFor="temperature" className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">
            Temperature ({formData.temperature})
          </label>
          <input
            id="temperature"
            type="range"
            min="0"
            max="1"
            step="0.1"
            value={formData.temperature}
            onChange={(e) => handleInputChange('temperature', parseFloat(e.target.value))}
            className="w-full"
          />
          <div className="flex justify-between text-xs text-gray-500 mt-1">
            <span>More focused</span>
            <span>More creative</span>
          </div>
          {errors.temperature && (
            <p className="mt-1 text-xs sm:text-sm text-red-600">{errors.temperature}</p>
          )}
        </div>

        {/* Actions */}
        <div className="flex flex-col sm:flex-row justify-end space-y-2 sm:space-y-0 sm:space-x-3 pt-4">
          <button
            type="button"
            onClick={onCancel}
            className="btn btn-outline btn-md w-full sm:w-auto"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={saveStatus === 'saving'}
            className={`btn btn-md w-full sm:w-auto ${
              saveStatus === 'saved'
                ? 'bg-green-500 hover:bg-green-600 text-white'
                : 'btn-primary'
            }`}
          >
            {saveStatus === 'saving' && (
              <div className="h-4 w-4 mr-2 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
            )}
            {saveStatus === 'saved' && (
              <svg className="h-4 w-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            )}
            {saveStatus === 'idle' && <Save className="h-4 w-4 mr-2" />}
            {saveStatus === 'saving' && 'Saving...'}
            {saveStatus === 'saved' && 'Saved!'}
            {saveStatus === 'idle' && 'Save Settings'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default APIKeyManager;
