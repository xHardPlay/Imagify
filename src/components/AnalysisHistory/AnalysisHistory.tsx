import React, { useState, useEffect } from 'react';
import { History, Trash2, Image as ImageIcon, ChevronRight, Clock, X, Loader2 } from 'lucide-react';
import { api, Analysis } from '../../services/api';
import { imageStorage } from '../../services/imageStorage';

interface AnalysisHistoryProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectAnalysis: (analysis: Analysis, imageData: string | null) => void;
}

const AnalysisHistory: React.FC<AnalysisHistoryProps> = ({
  isOpen,
  onClose,
  onSelectAnalysis,
}) => {
  const [analyses, setAnalyses] = useState<Analysis[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  // Load analyses on mount
  useEffect(() => {
    if (isOpen) {
      loadAnalyses();
    }
  }, [isOpen]);

  const loadAnalyses = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await api.getAnalyses(50);
      if (response.success && response.data) {
        setAnalyses(response.data);
      }
    } catch (err) {
      setError('Failed to load history');
      console.error('Failed to load analyses:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSelectAnalysis = async (analysis: Analysis) => {
    let imageData: string | null = null;

    // Try to load image from IndexedDB
    if (analysis.localImageId) {
      try {
        const storedImage = await imageStorage.getImage(analysis.localImageId);
        if (storedImage) {
          imageData = storedImage.data;
        }
      } catch (err) {
        console.error('Failed to load image from storage:', err);
      }
    }

    onSelectAnalysis(analysis, imageData);
    onClose();
  };

  const handleDeleteAnalysis = async (e: React.MouseEvent, analysisId: string) => {
    e.stopPropagation();
    if (!confirm('Delete this analysis? The image will also be removed.')) return;

    setDeletingId(analysisId);
    try {
      const response = await api.deleteAnalysis(analysisId);
      if (response.success) {
        // Delete image from IndexedDB if exists
        if (response.data?.localImageId) {
          try {
            await imageStorage.deleteImage(response.data.localImageId);
          } catch (err) {
            console.error('Failed to delete image from storage:', err);
          }
        }
        setAnalyses(prev => prev.filter(a => a.id !== analysisId));
      }
    } catch (err) {
      console.error('Failed to delete analysis:', err);
    } finally {
      setDeletingId(null);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return date.toLocaleDateString();
  };

  // Group analyses by date
  const groupedAnalyses = analyses.reduce((groups, analysis) => {
    const date = new Date(analysis.createdAt);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    let group = 'Older';
    if (date.toDateString() === today.toDateString()) {
      group = 'Today';
    } else if (date.toDateString() === yesterday.toDateString()) {
      group = 'Yesterday';
    } else if (date > new Date(today.setDate(today.getDate() - 7))) {
      group = 'This Week';
    }

    if (!groups[group]) groups[group] = [];
    groups[group].push(analysis);
    return groups;
  }, {} as Record<string, Analysis[]>);

  if (!isOpen) return null;

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-brutal-black/50 z-40 lg:hidden"
        onClick={onClose}
      />

      {/* Sidebar */}
      <div className="fixed top-0 left-0 h-full w-80 bg-brutal-white border-r-4 border-brutal-black z-50 flex flex-col"
           style={{ boxShadow: '4px 0 0 0 #000000' }}>
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b-3 border-brutal-black bg-brutal-yellow">
          <div className="flex items-center space-x-2">
            <History className="h-5 w-5" />
            <h2 className="font-bold uppercase">Analysis History</h2>
          </div>
          <button
            onClick={onClose}
            className="p-1 border-2 border-brutal-black bg-brutal-white hover:bg-brutal-red hover:text-brutal-white transition-colors"
            style={{ boxShadow: '2px 2px 0 0 #000000' }}
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-4">
          {isLoading ? (
            <div className="flex flex-col items-center justify-center h-40">
              <Loader2 className="h-8 w-8 animate-spin text-brutal-magenta mb-2" />
              <p className="text-sm font-medium">Loading history...</p>
            </div>
          ) : error ? (
            <div className="text-center py-8">
              <p className="text-brutal-red font-bold mb-2">{error}</p>
              <button
                onClick={loadAnalyses}
                className="btn btn-outline btn-sm"
              >
                Retry
              </button>
            </div>
          ) : analyses.length === 0 ? (
            <div className="text-center py-12">
              <div className="p-4 bg-brutal-lime/20 border-3 border-brutal-black inline-block mb-4"
                   style={{ boxShadow: '3px 3px 0 0 #000000' }}>
                <ImageIcon className="h-10 w-10 text-brutal-black" />
              </div>
              <h3 className="font-bold uppercase mb-2">No Analyses Yet</h3>
              <p className="text-sm text-gray-600">
                Your analysis history will appear here after you analyze images.
              </p>
            </div>
          ) : (
            <div className="space-y-6">
              {['Today', 'Yesterday', 'This Week', 'Older'].map(group => {
                const groupAnalyses = groupedAnalyses[group];
                if (!groupAnalyses || groupAnalyses.length === 0) return null;

                return (
                  <div key={group}>
                    <h3 className="text-xs font-bold uppercase text-gray-500 mb-2 flex items-center">
                      <Clock className="h-3 w-3 mr-1" />
                      {group}
                    </h3>
                    <div className="space-y-2">
                      {groupAnalyses.map(analysis => (
                        <button
                          key={analysis.id}
                          onClick={() => handleSelectAnalysis(analysis)}
                          className="w-full text-left p-3 border-3 border-brutal-black bg-brutal-white hover:bg-brutal-cyan transition-colors group"
                          style={{ boxShadow: '3px 3px 0 0 #000000' }}
                        >
                          <div className="flex items-start space-x-3">
                            {/* Thumbnail */}
                            <div className="flex-shrink-0 w-12 h-12 border-2 border-brutal-black bg-gray-100 overflow-hidden">
                              {analysis.thumbnailBase64 ? (
                                <img
                                  src={analysis.thumbnailBase64}
                                  alt=""
                                  className="w-full h-full object-cover"
                                />
                              ) : (
                                <div className="w-full h-full flex items-center justify-center">
                                  <ImageIcon className="h-6 w-6 text-gray-400" />
                                </div>
                              )}
                            </div>

                            {/* Info */}
                            <div className="flex-1 min-w-0">
                              <p className="font-bold text-sm truncate">
                                {analysis.title}
                              </p>
                              <p className="text-xs text-gray-500 truncate">
                                {analysis.workflowName}
                              </p>
                              <p className="text-xs text-gray-400 mt-1">
                                {formatDate(analysis.createdAt)}
                              </p>
                            </div>

                            {/* Actions */}
                            <div className="flex-shrink-0 flex items-center space-x-1">
                              <button
                                onClick={(e) => handleDeleteAnalysis(e, analysis.id)}
                                disabled={deletingId === analysis.id}
                                className="p-1 opacity-0 group-hover:opacity-100 transition-opacity border-2 border-brutal-black bg-brutal-red text-brutal-white hover:bg-red-600"
                                style={{ boxShadow: '2px 2px 0 0 #000000' }}
                              >
                                {deletingId === analysis.id ? (
                                  <Loader2 className="h-3 w-3 animate-spin" />
                                ) : (
                                  <Trash2 className="h-3 w-3" />
                                )}
                              </button>
                              <ChevronRight className="h-4 w-4 text-gray-400 group-hover:text-brutal-black transition-colors" />
                            </div>
                          </div>
                        </button>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Footer */}
        {analyses.length > 0 && (
          <div className="p-4 border-t-3 border-brutal-black bg-gray-50">
            <p className="text-xs text-gray-500 text-center">
              {analyses.length} analysis{analyses.length !== 1 ? 'es' : ''} saved
            </p>
          </div>
        )}
      </div>
    </>
  );
};

export default AnalysisHistory;
