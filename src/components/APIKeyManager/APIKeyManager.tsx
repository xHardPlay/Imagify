import React, { useState } from 'react';
import { Save, X, Eye, EyeOff, ExternalLink } from 'lucide-react';
import { APISettings } from '../../types';

interface APIKeyManagerProps {
  settings: APISettings | null;
  onSave: (settings: APISettings) => void;
  onCancel: () => void;
}

const APIKeyManager: React.FC<APIKeyManagerProps> = ({ settings, onSave, onCancel }) => {
  const [formData, setFormData] = useState<APISettings>({
    geminiApiKey: settings?.geminiApiKey || '',
    model: settings?.model || 'gemini-1.5-flash',
    maxTokens: settings?.maxTokens || 2000,
    temperature: settings?.temperature || 0.4,
  });

  const [showApiKey, setShowApiKey] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved'>('idle');

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.geminiApiKey.trim()) {
      newErrors.geminiApiKey = 'API Key is required';
    } else if (!formData.geminiApiKey.startsWith('AIza')) {
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
        onSave(formData);
        setSaveStatus('saved');
        setTimeout(() => setSaveStatus('idle'), 2000);
      } catch (error) {
        setSaveStatus('idle');
        console.error('Error saving settings:', error);
      }
    }
  };

  const handleInputChange = (field: keyof APISettings, value: string | number) => {
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
              Google Gemini API Key Required
            </h3>
            <p className="mt-1 text-xs sm:text-sm text-blue-700">
              You need a Google Gemini API key to use image analysis features. 
              Your API key is stored locally and never sent to our servers.
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
            Google Gemini API Key *
          </label>
          <div className="relative">
            <input
              id="apiKey"
              type={showApiKey ? 'text' : 'password'}
              value={formData.geminiApiKey}
              onChange={(e) => handleInputChange('geminiApiKey', e.target.value)}
              placeholder="AIza..."
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
          <label htmlFor="model" className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">
            Model
          </label>
          <select
            id="model"
            value={formData.model}
            onChange={(e) => handleInputChange('model', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 text-sm"
          >
            <option value="gemini-1.5-flash">🚀 Gemini 1.5 Flash (Recommended - Fast & Efficient)</option>
            <option value="gemini-1.5-pro">⚡ Gemini 1.5 Pro (High Performance)</option>
            <option value="gemini-2.0-flash-exp">✨ Gemini 2.0 Flash (Experimental)</option>
            <option value="gemini-exp-1206">🧪 Gemini Experimental 1206</option>
            <option value="gemini-pro-vision">👁️ Gemini Pro Vision (Legacy)</option>
            <option value="gemini-pro">🔧 Gemini Pro (Text Only)</option>
          </select>
          <p className="mt-1 text-xs text-gray-500">
            💡 Gemini 1.5 Flash offers the best balance of speed and accuracy for image analysis
          </p>
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
