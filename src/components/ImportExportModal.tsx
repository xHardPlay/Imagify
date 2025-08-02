import React, { useRef, useState } from 'react';
import { AppState } from '../types';
import { X, Download, Upload } from 'lucide-react';

interface ImportExportModalProps {
  appState: AppState;
  setAppState: (val: any) => void;
  onClose: () => void;
}

const ImportExportModal: React.FC<ImportExportModalProps> = ({ appState, setAppState, onClose }) => {
  const [message, setMessage] = useState<string | null>(null);
  const importConfigRef = useRef<HTMLInputElement>(null);
  const importWorkflowsRef = useRef<HTMLInputElement>(null);

  // Export config
  const handleExportConfig = () => {
    const dataStr = JSON.stringify(appState.apiSettings, null, 2);
    const blob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'imagify-config.json';
    a.click();
    URL.revokeObjectURL(url);
    setMessage('Config exported!');
  };

  // Import config
  const handleImportConfig = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const imported = JSON.parse(event.target?.result as string);
        if (imported.geminiApiKey && imported.model && imported.maxTokens && imported.temperature !== undefined) {
          setAppState((prev: AppState) => ({ ...prev, apiSettings: imported }));
          setMessage('Config imported!');
        } else {
          setMessage('Invalid config file.');
        }
      } catch {
        setMessage('Failed to parse config file.');
      }
    };
    reader.readAsText(file);
  };

  // Export workflows
  const handleExportWorkflows = () => {
    const dataStr = JSON.stringify(appState.workflows, null, 2);
    const blob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'imagify-workflows.json';
    a.click();
    URL.revokeObjectURL(url);
    setMessage('Workflows exported!');
  };

  // Import workflows
  const handleImportWorkflows = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const imported = JSON.parse(event.target?.result as string);
        if (Array.isArray(imported)) {
          setAppState((prev: AppState) => ({ ...prev, workflows: imported }));
          setMessage('Workflows imported!');
        } else {
          setMessage('Invalid workflows file.');
        }
      } catch {
        setMessage('Failed to parse workflows file.');
      }
    };
    reader.readAsText(file);
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 animate-in fade-in duration-300 p-4">
      <div className="bg-white/95 backdrop-blur-lg rounded-2xl p-4 sm:p-8 w-full max-w-lg shadow-2xl border border-white/20 relative">
        <button
          onClick={onClose}
          className="absolute top-2 sm:top-4 right-2 sm:right-4 btn btn-ghost btn-sm"
        >
          <X className="h-5 w-5" />
        </button>
        <h2 className="text-xl sm:text-2xl font-bold mb-4 sm:mb-6 text-center">Import / Export</h2>
        <div className="space-y-4 sm:space-y-6">
          <div>
            <h3 className="font-semibold mb-2 flex items-center text-sm sm:text-base"><Download className="h-4 w-4 mr-2" /> Export</h3>
            <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-2">
              <button className="btn btn-outline btn-sm w-full sm:w-auto" onClick={handleExportConfig}>Export Config</button>
              <button className="btn btn-outline btn-sm w-full sm:w-auto" onClick={handleExportWorkflows}>Export Workflows</button>
            </div>
          </div>
          <div>
            <h3 className="font-semibold mb-2 flex items-center text-sm sm:text-base"><Upload className="h-4 w-4 mr-2" /> Import</h3>
            <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-2">
              <label className="btn btn-outline btn-sm cursor-pointer w-full sm:w-auto">
                Import Config
                <input
                  type="file"
                  accept="application/json"
                  className="hidden"
                  ref={importConfigRef}
                  onChange={handleImportConfig}
                />
              </label>
              <label className="btn btn-outline btn-sm cursor-pointer w-full sm:w-auto">
                Import Workflows
                <input
                  type="file"
                  accept="application/json"
                  className="hidden"
                  ref={importWorkflowsRef}
                  onChange={handleImportWorkflows}
                />
              </label>
            </div>
          </div>
          {message && <div className="mt-4 text-center text-xs sm:text-sm text-blue-700">{message}</div>}
        </div>
      </div>
    </div>
  );
};

export default ImportExportModal; 