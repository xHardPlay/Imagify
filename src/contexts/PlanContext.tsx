import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { api, Analysis, ApiSettings } from '../services/api';

interface PlanContextType {
  analyses: Analysis[];
  isLoadingAnalyses: boolean;
  refreshAnalyses: () => Promise<void>;
  updateNodeData: (nodeId: string, data: Record<string, any>) => void;
  nodeDataMap: Map<string, Record<string, any>>;
  apiSettings: ApiSettings | null;
  isLoadingSettings: boolean;
}

const PlanContext = createContext<PlanContextType | null>(null);

export function PlanProvider({
  children,
  onNodeDataChange,
}: {
  children: React.ReactNode;
  onNodeDataChange?: (nodeId: string, data: Record<string, any>) => void;
}) {
  const [analyses, setAnalyses] = useState<Analysis[]>([]);
  const [isLoadingAnalyses, setIsLoadingAnalyses] = useState(true);
  const [nodeDataMap, setNodeDataMap] = useState<Map<string, Record<string, any>>>(new Map());
  const [apiSettings, setApiSettings] = useState<ApiSettings | null>(null);
  const [isLoadingSettings, setIsLoadingSettings] = useState(true);

  const refreshAnalyses = useCallback(async () => {
    setIsLoadingAnalyses(true);
    try {
      const response = await api.getAnalyses(100, 0);
      if (response.success && response.data) {
        setAnalyses(response.data);
      }
    } catch (error) {
      console.error('Failed to load analyses:', error);
    } finally {
      setIsLoadingAnalyses(false);
    }
  }, []);

  const loadSettings = useCallback(async () => {
    setIsLoadingSettings(true);
    try {
      const response = await api.getSettings();
      if (response.success && response.data) {
        setApiSettings(response.data);
      }
    } catch (error) {
      console.error('Failed to load settings:', error);
    } finally {
      setIsLoadingSettings(false);
    }
  }, []);

  useEffect(() => {
    refreshAnalyses();
    loadSettings();
  }, [refreshAnalyses, loadSettings]);

  const updateNodeData = useCallback((nodeId: string, data: Record<string, any>) => {
    setNodeDataMap(prev => {
      const next = new Map(prev);
      next.set(nodeId, { ...prev.get(nodeId), ...data });
      return next;
    });
    onNodeDataChange?.(nodeId, data);
  }, [onNodeDataChange]);

  return (
    <PlanContext.Provider
      value={{
        analyses,
        isLoadingAnalyses,
        refreshAnalyses,
        updateNodeData,
        nodeDataMap,
        apiSettings,
        isLoadingSettings,
      }}
    >
      {children}
    </PlanContext.Provider>
  );
}

export function usePlanContext() {
  const context = useContext(PlanContext);
  if (!context) {
    throw new Error('usePlanContext must be used within a PlanProvider');
  }
  return context;
}
