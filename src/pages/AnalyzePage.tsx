import React, { useState } from 'react';
import { Zap, Database, Trash2, ImageIcon } from 'lucide-react';
import { Workflow, ImageAnalysis } from '../types';
import ImageUpload from '../components/ImageUpload/ImageUpload';
import VariableManager from '../components/VariableManager/VariableManager';
import ResultsDisplay from '../components/ResultsDisplay/ResultsDisplay';
import { useAppState } from '../hooks/useAppState';

interface AnalyzePageProps {
  onImageAnalyzed?: (analysis: ImageAnalysis) => void;
}

const AnalyzePage: React.FC<AnalyzePageProps> = ({ onImageAnalyzed }) => {
  const {
    appState,
    createWorkflow,
    updateWorkflow,
    deleteWorkflow,
    selectWorkflow,
    setCurrentImage,
    setIsProcessing,
  } = useAppState();

  const [activeTab, setActiveTab] = useState<'workflow' | 'image' | 'results'>('workflow');

  const handleCreateNewWorkflow = async () => {
    await createWorkflow('New Workflow', '');
    setActiveTab('workflow');
  };

  const handleSelectWorkflow = (workflow: Workflow) => {
    selectWorkflow(workflow);
    setActiveTab('workflow');
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
      onImageAnalyzed?.(image);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-12 w-full">
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
    </div>
  );
};

export default AnalyzePage;
