import React, { useState, useEffect } from 'react';
import { Settings, ImageIcon, Zap, Database, Trash2 } from 'lucide-react';
import { AppState, Workflow, ImageAnalysis } from './types';
import ImageUpload from './components/ImageUpload/ImageUpload';
import VariableManager from './components/VariableManager/VariableManager';
import ResultsDisplay from './components/ResultsDisplay/ResultsDisplay';
import APIKeyManager from './components/APIKeyManager/APIKeyManager';
import { useLocalStorage } from './hooks/useLocalStorage';

function App() {
  const [appState, setAppState] = useLocalStorage<AppState>('imagify-app-state', {
    workflows: [],
    currentWorkflow: null,
    currentImage: null,
    apiSettings: null,
    isProcessing: false,
  });

  const [showAPISettings, setShowAPISettings] = useState(false);
  const [activeTab, setActiveTab] = useState<'workflow' | 'image' | 'results'>('workflow');

  // Check if API key is configured
  useEffect(() => {
    if (!appState.apiSettings?.geminiApiKey) {
      setShowAPISettings(true);
    }
  }, [appState.apiSettings]);

  const updateAppState = (updates: Partial<AppState>) => {
    console.log('updateAppState called with updates:', updates);
    console.log('Previous state:', appState);
    
    setAppState(prev => {
      const newState = { ...prev, ...updates };
      console.log('New state after update:', newState);
      return newState;
    });
  };

  const createNewWorkflow = () => {
    const newWorkflow: Workflow = {
      id: Date.now().toString(),
      name: 'New Workflow',
      description: '',
      variables: [],
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    
    updateAppState({
      workflows: [...appState.workflows, newWorkflow],
      currentWorkflow: newWorkflow,
    });
    setActiveTab('workflow');
  };

  const selectWorkflow = (workflow: Workflow) => {
    updateAppState({ currentWorkflow: workflow });
    setActiveTab('workflow');
  };

  const deleteWorkflow = (workflowId: string) => {
    if (window.confirm('Are you sure you want to delete this workflow? This action cannot be undone.')) {
      const updatedWorkflows = appState.workflows.filter(w => w.id !== workflowId);
      const newCurrentWorkflow = appState.currentWorkflow?.id === workflowId ? null : appState.currentWorkflow;
      
      updateAppState({
        workflows: updatedWorkflows,
        currentWorkflow: newCurrentWorkflow,
        currentImage: null // Clear current image if workflow is deleted
      });
      
      if (newCurrentWorkflow === null) {
        setActiveTab('workflow');
      }
    }
  };

  const updateCurrentWorkflow = (updates: Partial<Workflow>) => {
    if (!appState.currentWorkflow) return;
    
    const updatedWorkflow = {
      ...appState.currentWorkflow,
      ...updates,
      updatedAt: new Date(),
    };
    
    const updatedWorkflows = appState.workflows.map(w => 
      w.id === updatedWorkflow.id ? updatedWorkflow : w
    );
    
    updateAppState({
      workflows: updatedWorkflows,
      currentWorkflow: updatedWorkflow,
    });
  };

  const setCurrentImage = (image: ImageAnalysis | null) => {
    console.log('setCurrentImage called with:', image);
    console.log('Current appState before update:', appState);
    
    updateAppState({ currentImage: image });
    
    if (image) {
      console.log('Switching to results tab');
      setActiveTab('results');
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-pink-50 to-blue-50">
      {/* Floating Background Elements */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-10 left-10 w-32 h-32 bg-gradient-to-r from-purple-400/20 to-pink-400/20 rounded-full blur-xl animate-float"></div>
        <div className="absolute top-1/3 right-10 w-40 h-40 bg-gradient-to-r from-blue-400/20 to-purple-400/20 rounded-full blur-xl animate-float" style={{animationDelay: '2s'}}></div>
        <div className="absolute bottom-20 left-1/4 w-24 h-24 bg-gradient-to-r from-pink-400/20 to-blue-400/20 rounded-full blur-xl animate-float" style={{animationDelay: '4s'}}></div>
      </div>
      
      {/* Header */}
      <header className="relative bg-white/80 backdrop-blur-lg shadow-lg border-b border-white/20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-20">
            <div className="flex items-center space-x-4">
              <div className="relative">
                <ImageIcon className="h-10 w-10 text-purple-600 animate-pulse" />
                <div className="absolute -top-1 -right-1 w-4 h-4 bg-gradient-to-r from-pink-500 to-purple-500 rounded-full animate-ping"></div>
              </div>
              <div>
                <h1 className="text-3xl font-bold gradient-text">Imagify</h1>
                <span className="text-sm text-purple-600/70 font-medium">✨ AI-Powered Image Analysis</span>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <button
                onClick={() => setShowAPISettings(!showAPISettings)}
                className="btn btn-ghost btn-sm group"
              >
                <Settings className="h-5 w-5 group-hover:animate-spin transition-transform" />
                Settings
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* API Settings Modal */}
      {showAPISettings && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 animate-in fade-in duration-300">
          <div className="bg-white/95 backdrop-blur-lg rounded-2xl p-8 w-full max-w-md shadow-2xl border border-white/20 transform animate-in zoom-in duration-300">
            <APIKeyManager
              settings={appState.apiSettings}
              onSave={(settings) => {
                updateAppState({ apiSettings: settings });
                setShowAPISettings(false);
              }}
              onCancel={() => setShowAPISettings(false)}
            />
          </div>
        </div>
      )}

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Debug Info for Development */}
        {process.env.NODE_ENV === 'development' && (
          <div className="mb-4 p-3 bg-gray-100 rounded-lg text-sm">
            <strong>Debug Info:</strong> {appState.workflows.length} workflows saved | 
            API: {appState.apiSettings ? '✓ Configured' : '❌ Not configured'} |
            <button 
              onClick={() => {
                localStorage.removeItem('imagify-app-state');
                window.location.reload();
              }}
              className="ml-2 text-red-600 hover:text-red-800"
            >
              Reset All Data
            </button>
          </div>
        )}
        
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Sidebar */}
          <div className="lg:col-span-1">
            <div className="card animate-in slide-in-from-left duration-500">
              <div className="card-header">
                <h2 className="card-title">🔥 Workflows</h2>
                <p className="card-description">
                  Create and manage your AI analysis workflows
                  {appState.workflows.length > 0 && (
                    <span className="block text-xs text-green-600 mt-1">
                      ✓ {appState.workflows.length} workflow{appState.workflows.length > 1 ? 's' : ''} saved locally
                    </span>
                  )}
                </p>
              </div>
              <div className="card-content">
                <button
                  onClick={createNewWorkflow}
                  className="btn btn-primary btn-md w-full mb-6 group"
                >
                  <Zap className="h-5 w-5 mr-2 group-hover:animate-bounce" />
                  ✨ New Workflow
                </button>
                
                <div className="space-y-3">
                  {appState.workflows.map((workflow, index) => (
                    <div
                      key={workflow.id}
                      className={`relative p-4 rounded-xl text-sm transition-all duration-300 group ${
                        appState.currentWorkflow?.id === workflow.id
                          ? 'bg-gradient-to-r from-purple-100 to-pink-100 text-purple-800 shadow-lg scale-105'
                          : 'hover:bg-gradient-to-r hover:from-purple-50 hover:to-pink-50 hover:shadow-md hover:scale-102'
                      }`}
                      style={{animationDelay: `${index * 100}ms`}}
                    >
                      <button
                        onClick={() => selectWorkflow(workflow)}
                        className="w-full text-left"
                      >
                        <div className="font-semibold flex items-center pr-8">
                          🤖 {workflow.name}
                        </div>
                        <div className="text-xs text-purple-600/70 mt-1">
                          📊 {workflow.variables.length} variables
                        </div>
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          deleteWorkflow(workflow.id);
                        }}
                        className="absolute top-2 right-2 p-1 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity text-red-500 hover:text-red-700 hover:bg-red-50"
                        title="Delete workflow"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Main Content */}
          <div className="lg:col-span-3">
            {/* Tabs */}
            <div className="mb-8">
              <nav className="flex space-x-2 bg-white/50 backdrop-blur-lg p-2 rounded-2xl shadow-lg border border-white/20">
                <button
                  onClick={() => setActiveTab('workflow')}
                  className={`px-6 py-3 rounded-xl text-sm font-semibold transition-all duration-300 flex items-center space-x-2 ${
                    activeTab === 'workflow'
                      ? 'bg-gradient-to-r from-purple-500 to-pink-500 text-white shadow-lg transform scale-105'
                      : 'text-purple-600 hover:bg-purple-50 hover:scale-102'
                  }`}
                >
                  <Database className="h-5 w-5" />
                  <span>🛠️ Workflow Setup</span>
                </button>
                <button
                  onClick={() => setActiveTab('image')}
                  className={`px-6 py-3 rounded-xl text-sm font-semibold transition-all duration-300 flex items-center space-x-2 ${
                    activeTab === 'image'
                      ? 'bg-gradient-to-r from-purple-500 to-pink-500 text-white shadow-lg transform scale-105'
                      : 'text-purple-600 hover:bg-purple-50 hover:scale-102'
                  } ${!appState.currentWorkflow ? 'opacity-50 cursor-not-allowed' : ''}`}
                  disabled={!appState.currentWorkflow}
                >
                  <ImageIcon className="h-5 w-5" />
                  <span>📸 Image Analysis</span>
                </button>
                <button
                  onClick={() => setActiveTab('results')}
                  className={`px-6 py-3 rounded-xl text-sm font-semibold transition-all duration-300 flex items-center space-x-2 ${
                    activeTab === 'results'
                      ? 'bg-gradient-to-r from-purple-500 to-pink-500 text-white shadow-lg transform scale-105'
                      : 'text-purple-600 hover:bg-purple-50 hover:scale-102'
                  } ${!appState.currentImage ? 'opacity-50 cursor-not-allowed' : ''}`}
                  disabled={!appState.currentImage}
                >
                  <Zap className="h-5 w-5" />
                  <span>✨ Results</span>
                </button>
              </nav>
            </div>

            {/* Tab Content */}
            <div className="space-y-6">
              {activeTab === 'workflow' && (
                <VariableManager
                  workflow={appState.currentWorkflow}
                  onUpdateWorkflow={updateCurrentWorkflow}
                />
              )}

              {activeTab === 'image' && appState.currentWorkflow && (
                <ImageUpload
                  workflow={appState.currentWorkflow}
                  apiSettings={appState.apiSettings}
                  onImageAnalyzed={setCurrentImage}
                  isProcessing={appState.isProcessing}
                  onProcessingChange={(isProcessing) => updateAppState({ isProcessing })}
                />
              )}

              {activeTab === 'results' && appState.currentImage && (
                <ResultsDisplay
                  imageAnalysis={appState.currentImage}
                  apiSettings={appState.apiSettings}
                  onExport={(format) => {
                    // TODO: Implement export functionality
                    console.log('Export requested:', format);
                  }}
                />
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default App;
