import { useState } from 'react';
import { Settings, ImageIcon, Zap, Database, Trash2, Menu, X, Loader2 } from 'lucide-react';
import { Workflow, ImageAnalysis } from './types';
import ImageUpload from './components/ImageUpload/ImageUpload';
import VariableManager from './components/VariableManager/VariableManager';
import ResultsDisplay from './components/ResultsDisplay/ResultsDisplay';
import APIKeyManager from './components/APIKeyManager/APIKeyManager';
import { useAppState } from './hooks/useAppState';
import ImportExportModal from './components/ImportExportModal';
import UserMenu from './components/UserMenu';

function App() {
  const {
    appState,
    isLoading,
    error,
    createWorkflow,
    updateWorkflow,
    deleteWorkflow,
    updateSettings,
    selectWorkflow,
    setCurrentImage,
    setIsProcessing,
  } = useAppState();

  const [showAPISettings, setShowAPISettings] = useState(false);
  const [activeTab, setActiveTab] = useState<'workflow' | 'image' | 'results'>('workflow');
  const [showImportExport, setShowImportExport] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const handleCreateNewWorkflow = async () => {
    await createWorkflow('New Workflow', '');
    setActiveTab('workflow');
  };

  const handleSelectWorkflow = (workflow: Workflow) => {
    selectWorkflow(workflow);
    setActiveTab('workflow');
    setMobileMenuOpen(false);
  };

  const handleDeleteWorkflow = async (workflowId: string) => {
    if (window.confirm('Are you sure you want to delete this workflow? This action cannot be undone.')) {
      await deleteWorkflow(workflowId);
      if (appState.currentWorkflow === null) {
        setActiveTab('workflow');
      }
    }
  };

  const handleUpdateCurrentWorkflow = async (updates: Partial<Workflow>) => {
    if (!appState.currentWorkflow) return;
    await updateWorkflow(appState.currentWorkflow.id, updates);
  };

  const handleSetCurrentImage = (image: ImageAnalysis | null) => {
    setCurrentImage(image);
    if (image) {
      setActiveTab('results');
    }
  };

  const handleSaveSettings = async (settings: any) => {
    try {
      await updateSettings({
        geminiApiKey: settings.geminiApiKey,
        model: settings.model,
        maxTokens: settings.maxTokens,
        temperature: settings.temperature,
      });
      setShowAPISettings(false);
    } catch (err) {
      console.error('Failed to save settings:', err);
    }
  };

  // Show loading state while fetching initial data
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-12 w-12 animate-spin text-brutal-cyan mx-auto mb-4" />
          <p className="font-bold uppercase">Loading...</p>
        </div>
      </div>
    );
  }

  // Show error state
  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <div className="card max-w-md">
          <div className="card-content text-center">
            <p className="text-brutal-red font-bold mb-4">{error}</p>
            <button onClick={() => window.location.reload()} className="btn btn-primary">
              Retry
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col">
      {/* Neo Brutalism Background Shapes */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none z-0">
        <div className="absolute top-20 left-10 w-24 h-24 sm:w-32 sm:h-32 bg-brutal-yellow border-4 border-brutal-black rotate-12" style={{boxShadow: '4px 4px 0px 0px #000000'}}></div>
        <div className="absolute top-1/4 right-5 sm:right-10 w-28 h-28 sm:w-40 sm:h-40 bg-brutal-cyan border-4 border-brutal-black -rotate-6" style={{boxShadow: '4px 4px 0px 0px #000000'}}></div>
        <div className="absolute bottom-40 left-1/4 w-16 h-16 sm:w-24 sm:h-24 bg-brutal-magenta border-4 border-brutal-black rotate-45" style={{boxShadow: '4px 4px 0px 0px #000000'}}></div>
        <div className="absolute top-2/3 right-1/4 w-14 h-14 sm:w-20 sm:h-20 bg-brutal-lime border-4 border-brutal-black -rotate-12" style={{boxShadow: '4px 4px 0px 0px #000000'}}></div>
      </div>

      {/* Header */}
      <header className="relative z-10 bg-brutal-white border-b-4 border-brutal-black" style={{boxShadow: '0 4px 0px 0px #000000'}}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16 sm:h-20">
            <div className="flex items-center space-x-2 sm:space-x-4">
              <div className="relative p-2 bg-brutal-yellow border-3 border-brutal-black" style={{boxShadow: '3px 3px 0px 0px #000000'}}>
                <ImageIcon className="h-6 w-6 sm:h-8 sm:w-8 text-brutal-black" />
              </div>
              <div className="hidden sm:block">
                <h1 className="text-2xl sm:text-3xl font-black uppercase tracking-tight">FLUX <span className="text-brutal-magenta">Studio</span></h1>
                <span className="text-xs sm:text-sm font-bold uppercase tracking-wide">AI-Powered Image Analysis</span>
              </div>
              <div className="sm:hidden">
                <h1 className="text-xl font-black uppercase">FLUX <span className="text-brutal-magenta">Studio</span></h1>
              </div>
            </div>

            {/* Desktop Menu */}
            <div className="hidden sm:flex items-center space-x-2 lg:space-x-4">
              <button
                onClick={() => setShowAPISettings(!showAPISettings)}
                className="btn btn-ghost btn-sm group"
              >
                <Settings className="h-4 w-4 sm:h-5 sm:w-5 group-hover:animate-spin transition-transform" />
                <span className="hidden lg:inline">Settings</span>
              </button>
              <button
                onClick={() => setShowImportExport(true)}
                className="btn btn-ghost btn-sm group"
                title="Import/Export Config & Workflows"
              >
                <Database className="h-4 w-4 sm:h-5 sm:w-5" />
                <span className="hidden lg:inline">Import/Export</span>
              </button>
              <UserMenu />
            </div>

            {/* Mobile Menu Button */}
            <div className="sm:hidden flex items-center space-x-2">
              <UserMenu />
              <button
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="btn btn-ghost btn-sm"
              >
                {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
              </button>
            </div>
          </div>

          {/* Mobile Menu */}
          {mobileMenuOpen && (
            <div className="sm:hidden border-t-3 border-brutal-black py-4 space-y-2 bg-brutal-white">
              <button
                onClick={() => {
                  setShowAPISettings(!showAPISettings);
                  setMobileMenuOpen(false);
                }}
                className="w-full btn btn-outline btn-sm justify-start"
              >
                <Settings className="h-4 w-4 mr-2" />
                SETTINGS
              </button>
              <button
                onClick={() => {
                  setShowImportExport(true);
                  setMobileMenuOpen(false);
                }}
                className="w-full btn btn-outline btn-sm justify-start"
              >
                <Database className="h-4 w-4 mr-2" />
                IMPORT/EXPORT
              </button>
            </div>
          )}
        </div>
      </header>

      {/* API Settings Modal */}
      {showAPISettings && (
        <div className="fixed inset-0 bg-brutal-black/80 flex items-center justify-center z-50 p-4">
          <div className="bg-brutal-white border-4 border-brutal-black p-4 sm:p-8 w-full max-w-md" style={{boxShadow: '8px 8px 0px 0px #000000'}}>
            <APIKeyManager
              settings={appState.apiSettings}
              onSave={handleSaveSettings}
              onCancel={() => setShowAPISettings(false)}
            />
          </div>
        </div>
      )}

      {showImportExport && (
        <ImportExportModal
          appState={appState}
          setAppState={() => {}} // Import/export needs to be updated for API
          onClose={() => setShowImportExport(false)}
        />
      )}

      <main className="relative z-10 flex-grow max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-12 w-full">
        {/* Mobile Layout */}
        <div className="block lg:hidden">
          {/* Mobile Workflows Section */}
          <div className="card mb-6">
            <div className="card-header">
              <h2 className="card-title text-xl sm:text-2xl">WORKFLOWS</h2>
              <p className="card-description text-sm">
                Create and manage your AI analysis workflows
                {appState.workflows.length > 0 && (
                  <span className="inline-block ml-2 px-2 py-1 bg-brutal-lime border-2 border-brutal-black text-xs font-bold" style={{boxShadow: '2px 2px 0px 0px #000000'}}>
                    {appState.workflows.length} SAVED
                  </span>
                )}
              </p>
            </div>
            <div className="card-content">
              <button
                onClick={handleCreateNewWorkflow}
                className="btn btn-primary btn-md w-full mb-4"
              >
                <Zap className="h-4 w-4 sm:h-5 sm:w-5 mr-2" />
                NEW WORKFLOW
              </button>

              <div className="space-y-2">
                {appState.workflows.map((workflow) => (
                  <div
                    key={workflow.id}
                    className={`relative p-3 sm:p-4 text-sm transition-all duration-150 group border-3 border-brutal-black ${
                      appState.currentWorkflow?.id === workflow.id
                        ? 'bg-brutal-cyan'
                        : 'bg-brutal-white hover:bg-brutal-yellow'
                    }`}
                    style={{boxShadow: appState.currentWorkflow?.id === workflow.id ? '4px 4px 0px 0px #000000' : '3px 3px 0px 0px #000000'}}
                  >
                    <button
                      onClick={() => handleSelectWorkflow(workflow)}
                      className="w-full text-left"
                    >
                      <div className="font-bold flex items-center pr-8 text-sm sm:text-base uppercase">
                        {workflow.name}
                      </div>
                      <div className="text-xs font-medium mt-1">
                        {workflow.variables.length} variables
                      </div>
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDeleteWorkflow(workflow.id);
                      }}
                      className="absolute top-2 right-2 p-1 border-2 border-brutal-black bg-brutal-red text-brutal-white opacity-0 group-hover:opacity-100 transition-opacity"
                      title="Delete workflow"
                      style={{boxShadow: '2px 2px 0px 0px #000000'}}
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Mobile Tabs */}
          <div className="mb-6">
            <nav className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-2 bg-brutal-white p-2 border-3 border-brutal-black" style={{boxShadow: '4px 4px 0px 0px #000000'}}>
              <button
                onClick={() => setActiveTab('workflow')}
                className={`px-4 py-3 text-sm font-bold uppercase transition-all duration-150 flex items-center justify-center space-x-2 border-3 border-brutal-black ${
                  activeTab === 'workflow'
                    ? 'bg-brutal-yellow'
                    : 'bg-brutal-white hover:bg-brutal-lime'
                }`}
                style={{boxShadow: activeTab === 'workflow' ? '3px 3px 0px 0px #000000' : '2px 2px 0px 0px #000000'}}
              >
                <Database className="h-4 w-4 sm:h-5 sm:w-5" />
                <span>Workflow</span>
              </button>
              <button
                onClick={() => setActiveTab('image')}
                className={`px-4 py-3 text-sm font-bold uppercase transition-all duration-150 flex items-center justify-center space-x-2 border-3 border-brutal-black ${
                  activeTab === 'image'
                    ? 'bg-brutal-cyan'
                    : 'bg-brutal-white hover:bg-brutal-cyan'
                } ${!appState.currentWorkflow ? 'opacity-50 cursor-not-allowed' : ''}`}
                style={{boxShadow: activeTab === 'image' ? '3px 3px 0px 0px #000000' : '2px 2px 0px 0px #000000'}}
                disabled={!appState.currentWorkflow}
              >
                <ImageIcon className="h-4 w-4 sm:h-5 sm:w-5" />
                <span>Upload</span>
              </button>
              <button
                onClick={() => setActiveTab('results')}
                className={`px-4 py-3 text-sm font-bold uppercase transition-all duration-150 flex items-center justify-center space-x-2 border-3 border-brutal-black ${
                  activeTab === 'results'
                    ? 'bg-brutal-magenta text-brutal-white'
                    : 'bg-brutal-white hover:bg-brutal-magenta hover:text-brutal-white'
                } ${!appState.currentImage ? 'opacity-50 cursor-not-allowed' : ''}`}
                style={{boxShadow: activeTab === 'results' ? '3px 3px 0px 0px #000000' : '2px 2px 0px 0px #000000'}}
                disabled={!appState.currentImage}
              >
                <Zap className="h-4 w-4 sm:h-5 sm:w-5" />
                <span>Results</span>
              </button>
            </nav>
          </div>

          {/* Mobile Tab Content */}
          <div className="space-y-6">
            {activeTab === 'workflow' && (
              <VariableManager
                workflow={appState.currentWorkflow}
                onUpdateWorkflow={handleUpdateCurrentWorkflow}
              />
            )}

            {activeTab === 'image' && appState.currentWorkflow && (
              <ImageUpload
                workflow={appState.currentWorkflow}
                apiSettings={appState.apiSettings}
                onImageAnalyzed={handleSetCurrentImage}
                isProcessing={appState.isProcessing}
                onProcessingChange={setIsProcessing}
              />
            )}

            {activeTab === 'results' && appState.currentImage && (
              <ResultsDisplay
                imageAnalysis={appState.currentImage}
                apiSettings={appState.apiSettings}
                onExport={(format) => {
                  console.log('Export requested:', format);
                }}
              />
            )}
          </div>
        </div>

        {/* Desktop Layout */}
        <div className="hidden lg:grid lg:grid-cols-4 gap-8">
          {/* Sidebar */}
          <div className="lg:col-span-1">
            <div className="card">
              <div className="card-header">
                <h2 className="card-title">WORKFLOWS</h2>
                <p className="card-description">
                  Create and manage your AI analysis workflows
                  {appState.workflows.length > 0 && (
                    <span className="inline-block ml-2 px-2 py-1 bg-brutal-lime border-2 border-brutal-black text-xs font-bold" style={{boxShadow: '2px 2px 0px 0px #000000'}}>
                      {appState.workflows.length} SAVED
                    </span>
                  )}
                </p>
              </div>
              <div className="card-content">
                <button
                  onClick={handleCreateNewWorkflow}
                  className="btn btn-primary btn-md w-full mb-6"
                >
                  <Zap className="h-5 w-5 mr-2" />
                  NEW WORKFLOW
                </button>

                <div className="space-y-3">
                  {appState.workflows.map((workflow) => (
                    <div
                      key={workflow.id}
                      className={`relative p-4 text-sm transition-all duration-150 group border-3 border-brutal-black ${
                        appState.currentWorkflow?.id === workflow.id
                          ? 'bg-brutal-cyan'
                          : 'bg-brutal-white hover:bg-brutal-yellow'
                      }`}
                      style={{boxShadow: appState.currentWorkflow?.id === workflow.id ? '4px 4px 0px 0px #000000' : '3px 3px 0px 0px #000000'}}
                    >
                      <button
                        onClick={() => handleSelectWorkflow(workflow)}
                        className="w-full text-left"
                      >
                        <div className="font-bold flex items-center pr-8 uppercase">
                          {workflow.name}
                        </div>
                        <div className="text-xs font-medium mt-1">
                          {workflow.variables.length} variables
                        </div>
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDeleteWorkflow(workflow.id);
                        }}
                        className="absolute top-2 right-2 p-1 border-2 border-brutal-black bg-brutal-red text-brutal-white opacity-0 group-hover:opacity-100 transition-opacity"
                        title="Delete workflow"
                        style={{boxShadow: '2px 2px 0px 0px #000000'}}
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
              <nav className="flex space-x-2 bg-brutal-white p-2 border-3 border-brutal-black" style={{boxShadow: '4px 4px 0px 0px #000000'}}>
                <button
                  onClick={() => setActiveTab('workflow')}
                  className={`px-6 py-3 text-sm font-bold uppercase transition-all duration-150 flex items-center space-x-2 border-3 border-brutal-black ${
                    activeTab === 'workflow'
                      ? 'bg-brutal-yellow'
                      : 'bg-brutal-white hover:bg-brutal-lime'
                  }`}
                  style={{boxShadow: activeTab === 'workflow' ? '3px 3px 0px 0px #000000' : '2px 2px 0px 0px #000000'}}
                >
                  <Database className="h-5 w-5" />
                  <span>Workflow</span>
                </button>
                <button
                  onClick={() => setActiveTab('image')}
                  className={`px-6 py-3 text-sm font-bold uppercase transition-all duration-150 flex items-center space-x-2 border-3 border-brutal-black ${
                    activeTab === 'image'
                      ? 'bg-brutal-cyan'
                      : 'bg-brutal-white hover:bg-brutal-cyan'
                  } ${!appState.currentWorkflow ? 'opacity-50 cursor-not-allowed' : ''}`}
                  style={{boxShadow: activeTab === 'image' ? '3px 3px 0px 0px #000000' : '2px 2px 0px 0px #000000'}}
                  disabled={!appState.currentWorkflow}
                >
                  <ImageIcon className="h-5 w-5" />
                  <span>Upload</span>
                </button>
                <button
                  onClick={() => setActiveTab('results')}
                  className={`px-6 py-3 text-sm font-bold uppercase transition-all duration-150 flex items-center space-x-2 border-3 border-brutal-black ${
                    activeTab === 'results'
                      ? 'bg-brutal-magenta text-brutal-white'
                      : 'bg-brutal-white hover:bg-brutal-magenta hover:text-brutal-white'
                  } ${!appState.currentImage ? 'opacity-50 cursor-not-allowed' : ''}`}
                  style={{boxShadow: activeTab === 'results' ? '3px 3px 0px 0px #000000' : '2px 2px 0px 0px #000000'}}
                  disabled={!appState.currentImage}
                >
                  <Zap className="h-5 w-5" />
                  <span>Results</span>
                </button>
              </nav>
            </div>

            {/* Tab Content */}
            <div className="space-y-6">
              {activeTab === 'workflow' && (
                <VariableManager
                  workflow={appState.currentWorkflow}
                  onUpdateWorkflow={handleUpdateCurrentWorkflow}
                />
              )}

              {activeTab === 'image' && appState.currentWorkflow && (
                <ImageUpload
                  workflow={appState.currentWorkflow}
                  apiSettings={appState.apiSettings}
                  onImageAnalyzed={handleSetCurrentImage}
                  isProcessing={appState.isProcessing}
                  onProcessingChange={setIsProcessing}
                />
              )}

              {activeTab === 'results' && appState.currentImage && (
                <ResultsDisplay
                  imageAnalysis={appState.currentImage}
                  apiSettings={appState.apiSettings}
                  onExport={(format) => {
                    console.log('Export requested:', format);
                  }}
                />
              )}
            </div>
          </div>
        </div>
      </main>

      {/* Footer with Credits */}
      <footer className="relative z-10 bg-brutal-black text-brutal-white py-6 border-t-4 border-brutal-yellow mt-auto">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-brutal-yellow border-3 border-brutal-white" style={{boxShadow: '3px 3px 0px 0px #FFFFFF'}}>
                <ImageIcon className="h-5 w-5 text-brutal-black" />
              </div>
              <span className="font-black uppercase text-lg">FLUX <span className="text-brutal-magenta">Studio</span></span>
            </div>

            <div className="flex items-center space-x-2 text-sm font-bold">
              <span>Made with</span>
              <span className="text-brutal-red text-lg">♥</span>
              <span>by</span>
              <a
                href="https://portafolio-centurion.pages.dev/"
                target="_blank"
                rel="noopener noreferrer"
                className="px-3 py-1 bg-brutal-cyan text-brutal-black border-2 border-brutal-white font-black uppercase hover:bg-brutal-yellow transition-colors"
                style={{boxShadow: '2px 2px 0px 0px #FFFFFF'}}
              >
                Charly
              </a>
            </div>

            <div className="text-xs font-medium opacity-70">
              © {new Date().getFullYear()} All rights reserved
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}

export default App;
