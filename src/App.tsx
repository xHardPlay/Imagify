import { useState } from 'react';
import { Loader2 } from 'lucide-react';
import { ImageAnalysis } from './types';
import APIKeyManager from './components/APIKeyManager/APIKeyManager';
import MainLayout from './components/MainLayout/MainLayout';
import AnalyzePage from './pages/AnalyzePage';
import PlanPage from './pages/PlanPage';
import CreatePage from './pages/CreatePage';
import { useAppState } from './hooks/useAppState';
import ImportExportModal from './components/ImportExportModal';
import { Analysis } from './services/api';

type Section = 'analyze' | 'plan' | 'create';

function App() {
  const {
    appState,
    isLoading,
    error,
    updateSettings,
    setCurrentImage,
  } = useAppState();

  const [showAPISettings, setShowAPISettings] = useState(false);
  const [showImportExport, setShowImportExport] = useState(false);
  const [activeSection, setActiveSection] = useState<Section>('analyze');

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

  const handleSelectAnalysis = (analysis: Analysis, imageData: string | null) => {
    // Convert resultData from Record<string, {value, confidence}> to VariableResult[]
    const results = Object.entries(analysis.resultData).map(([name, data]: [string, any]) => ({
      variableId: name,
      variableName: name,
      value: data?.value ?? data,
      confidence: data?.confidence ?? 0,
      source: 'ai' as const,
    }));

    // Create ImageAnalysis from the saved analysis
    const restoredAnalysis: ImageAnalysis = {
      id: analysis.id,
      imageUrl: imageData || '',
      imageName: analysis.title,
      uploadedAt: new Date(analysis.createdAt),
      variables: [],
      results,
      status: 'completed',
    };
    setCurrentImage(restoredAnalysis);
    setActiveSection('analyze');
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
    <>
      <MainLayout
        activeSection={activeSection}
        onSectionChange={setActiveSection}
        onShowSettings={() => setShowAPISettings(true)}
        onShowImportExport={() => setShowImportExport(true)}
        onSelectAnalysis={handleSelectAnalysis}
      >
        {activeSection === 'analyze' && <AnalyzePage />}
        {activeSection === 'plan' && <PlanPage />}
        {activeSection === 'create' && <CreatePage />}
      </MainLayout>

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
    </>
  );
}

export default App;
