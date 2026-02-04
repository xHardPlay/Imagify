import { memo, useState, useRef, useEffect } from 'react';
import { Handle, Position, NodeProps, useReactFlow } from '@xyflow/react';
import { BookOpen, PenTool, Plus, RefreshCw, Loader2, Play, Copy, Check, AlertCircle } from 'lucide-react';
import { api, GeminiModel } from '../../services/api';
import { usePlanContext } from '../../contexts/PlanContext';

interface ConnectedVariable {
  name: string;
  value: any;
}

interface ModelOption {
  id: string;
  displayName: string;
  supportsVision: boolean;
  isRecommended?: boolean;
}

const DEFAULT_MODELS: ModelOption[] = [
  { id: 'gemini-1.5-flash', displayName: 'Gemini 1.5 Flash', supportsVision: true, isRecommended: true },
  { id: 'gemini-1.5-pro', displayName: 'Gemini 1.5 Pro', supportsVision: true },
  { id: 'gemini-2.0-flash-exp', displayName: 'Gemini 2.0 Flash', supportsVision: true },
  { id: 'gemini-pro', displayName: 'Gemini Pro', supportsVision: false },
];

const PROVIDERS = [
  { id: 'gemini', name: 'Google Gemini' },
];

const StoryGenNode = memo(({ id, selected, data }: NodeProps) => {
  const { getNodes, getEdges, setNodes } = useReactFlow();
  const { apiSettings, isLoadingSettings } = usePlanContext();
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Node data with defaults
  const nodeData = data as {
    prompt?: string;
    provider?: string;
    model?: string;
    temperature?: number;
    generatedText?: string;
  };

  const [prompt, setPrompt] = useState(nodeData.prompt || '');
  const [provider, setProvider] = useState(nodeData.provider || 'gemini');
  const [model, setModel] = useState(nodeData.model || apiSettings?.model || 'gemini-1.5-flash');
  const [temperature, setTemperature] = useState(nodeData.temperature ?? apiSettings?.temperature ?? 0.7);

  // Generation state
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedText, setGeneratedText] = useState(nodeData.generatedText || '');
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  // Models state
  const [models, setModels] = useState<ModelOption[]>(DEFAULT_MODELS);
  const [modelsLoading, setModelsLoading] = useState(false);

  // Fetch models on mount if API key is configured
  useEffect(() => {
    if (apiSettings?.hasApiKey) {
      fetchModels();
    }
  }, [apiSettings?.hasApiKey]);

  const fetchModels = async () => {
    setModelsLoading(true);
    try {
      const response = await api.getModels();
      if (response.success && response.data && response.data.length > 0) {
        const modelOptions: ModelOption[] = response.data.map((m: GeminiModel) => ({
          id: m.id,
          displayName: m.displayName,
          supportsVision: m.supportsVision,
          isRecommended: m.isRecommended,
        }));
        setModels(modelOptions);
      }
    } catch (error) {
      console.error('Error fetching models:', error);
    } finally {
      setModelsLoading(false);
    }
  };

  // Find ALL connected Analysis nodes and get their variables (single input, multiple connections)
  const getConnectedVariables = (): Array<ConnectedVariable & { source: string }> => {
    const edges = getEdges();
    const nodes = getNodes();

    const allVariables: Array<ConnectedVariable & { source: string }> = [];

    // Find ALL edges connecting to this node's input
    const incomingEdges = edges.filter(e => e.target === id && e.targetHandle === 'variables');

    for (const edge of incomingEdges) {
      const sourceNode = nodes.find(n => n.id === edge.source);
      if (!sourceNode || sourceNode.type !== 'analysis') continue;

      const sourceData = sourceNode.data as {
        selectedAnalysis?: {
          title?: string;
          variables: Array<{ name: string; value: any }>;
        };
      };

      const sourceTitle = sourceData?.selectedAnalysis?.title || 'Analysis';
      const variables = sourceData?.selectedAnalysis?.variables || [];

      for (const v of variables) {
        allVariables.push({
          ...v,
          source: sourceTitle,
        });
      }
    }

    return allVariables;
  };

  const connectedVariables = getConnectedVariables();
  const connectedCount = new Set(connectedVariables.map(v => v.source)).size;

  // Replace {VARIABLE} placeholders with actual values
  const replaceVariables = (text: string): string => {
    let result = text;
    // Get fresh variables at generation time
    const vars = getConnectedVariables();
    for (const variable of vars) {
      const placeholder = new RegExp(`\\{${variable.name}\\}`, 'gi');
      const stringValue = typeof variable.value === 'string' ? variable.value : JSON.stringify(variable.value);
      result = result.replace(placeholder, stringValue);
    }
    return result;
  };

  const insertVariable = (variableName: string) => {
    const textarea = textareaRef.current;
    if (!textarea) return;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const variableTag = `{${variableName}}`;

    const newPrompt = prompt.substring(0, start) + variableTag + prompt.substring(end);
    setPrompt(newPrompt);
    updateNodeData({ prompt: newPrompt });

    setTimeout(() => {
      textarea.focus();
      const newPosition = start + variableTag.length;
      textarea.setSelectionRange(newPosition, newPosition);
    }, 0);
  };

  const updateNodeData = (updates: Record<string, any>) => {
    setNodes(nodes => nodes.map(node => {
      if (node.id === id) {
        return {
          ...node,
          data: {
            ...node.data,
            ...updates,
          },
        };
      }
      return node;
    }));
  };

  const handlePromptChange = (value: string) => {
    setPrompt(value);
    updateNodeData({ prompt: value });
  };

  const handleProviderChange = (value: string) => {
    setProvider(value);
    updateNodeData({ provider: value });
  };

  const handleModelChange = (value: string) => {
    setModel(value);
    updateNodeData({ model: value });
  };

  const handleTemperatureChange = (value: number) => {
    setTemperature(value);
    updateNodeData({ temperature: value });
  };

  const handleGenerate = async () => {
    if (!prompt.trim()) {
      setError('Please enter a prompt');
      return;
    }

    // Check if settings are loaded and API key exists
    if (apiSettings === null) {
      setError('Loading settings... Please wait.');
      return;
    }

    if (!apiSettings.hasApiKey) {
      setError('API key not configured. Go to Settings first.');
      return;
    }

    setIsGenerating(true);
    setError(null);

    try {
      const finalPrompt = replaceVariables(prompt);

      const contents = [{
        parts: [{ text: finalPrompt }]
      }];

      const response = await api.analyzeImage(
        contents,
        {
          temperature: temperature,
          maxOutputTokens: apiSettings?.maxTokens ?? 2048,
        },
        model
      );

      if (!response.success || !response.data) {
        const errorMsg = response.error || 'Failed to generate text';
        if (errorMsg.includes('overloaded') || errorMsg.includes('503')) {
          throw new Error(`Model "${model}" is overloaded. Try again or change model.`);
        }
        if (errorMsg.includes('quota') || errorMsg.includes('429')) {
          throw new Error('API quota exceeded.');
        }
        throw new Error(errorMsg);
      }

      const text = response.data.candidates?.[0]?.content?.parts?.[0]?.text || '';
      setGeneratedText(text);
      updateNodeData({ generatedText: text });

    } catch (err) {
      setError(err instanceof Error ? err.message : 'Generation failed');
    } finally {
      setIsGenerating(false);
    }
  };

  const copyToClipboard = async () => {
    await navigator.clipboard.writeText(generatedText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div
      className={`min-w-[280px] max-w-[350px] bg-brutal-yellow border-3 border-brutal-black ${
        selected ? 'ring-4 ring-brutal-magenta' : ''
      }`}
      style={{ boxShadow: '4px 4px 0px 0px #000000' }}
    >
      {/* Single Input Handle - accepts multiple connections */}
      <Handle
        type="target"
        position={Position.Left}
        id="variables"
        className="!w-4 !h-4 !bg-brutal-black !border-2 !border-brutal-white"
        style={{ left: -8 }}
        isConnectableEnd={true}
      />

      {/* Header */}
      <div className="bg-brutal-black text-brutal-white px-3 py-2 flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <BookOpen className="h-4 w-4" />
          <span className="font-bold uppercase text-sm">Story Gen</span>
        </div>
        {generatedText && (
          <span className="text-[10px] bg-green-500 px-2 py-0.5 rounded font-bold">
            READY
          </span>
        )}
      </div>

      {/* Content */}
      <div className="p-3 space-y-2">
        <div className="flex items-center space-x-2 text-xs">
          <PenTool className="h-3 w-3" />
          <span className="font-bold">AI Text Generation</span>
        </div>

        {/* Available Variables */}
        {connectedVariables.length > 0 && (
          <div className="text-xs bg-brutal-white/90 p-2 border-2 border-brutal-black">
            <p className="font-bold uppercase text-[10px] text-brutal-black/60 mb-2">
              <Plus className="h-3 w-3 inline mr-1" />
              Variables ({connectedCount} source{connectedCount > 1 ? 's' : ''})
            </p>
            <div className="flex flex-wrap gap-1 max-h-24 overflow-y-auto">
              {connectedVariables.map((variable, idx) => (
                <button
                  key={idx}
                  onClick={() => insertVariable(variable.name)}
                  className="px-2 py-0.5 bg-brutal-cyan text-brutal-black text-[10px] font-bold uppercase border-2 border-brutal-black hover:bg-brutal-cyan/70 transition-colors"
                  title={`${variable.source}: ${typeof variable.value === 'string' ? variable.value : JSON.stringify(variable.value)}`}
                >
                  {`{${variable.name}}`}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* No connection info */}
        {connectedVariables.length === 0 && (
          <div className="text-xs bg-brutal-white/50 p-2 border-2 border-brutal-black border-dashed">
            <p className="text-[10px] text-brutal-black/60 text-center">
              Connect Analysis nodes to use variables
            </p>
          </div>
        )}

        {/* Prompt */}
        <div className="text-xs bg-brutal-white/90 p-2 border-2 border-brutal-black">
          <p className="font-bold uppercase text-[10px] text-brutal-black/60 mb-1">
            Story Prompt
          </p>
          <textarea
            ref={textareaRef}
            value={prompt}
            onChange={(e) => handlePromptChange(e.target.value)}
            placeholder="Write a story about {FOOD NAME}..."
            className="w-full bg-brutal-white border-2 border-brutal-black p-2 text-xs font-mono resize-none h-16"
          />
        </div>

        {/* Provider & Model in one row */}
        <div className="grid grid-cols-2 gap-2">
          <div className="text-xs bg-brutal-white/90 p-2 border-2 border-brutal-black">
            <p className="font-bold uppercase text-[10px] text-brutal-black/60 mb-1">
              Provider
            </p>
            <select
              value={provider}
              onChange={(e) => handleProviderChange(e.target.value)}
              className="w-full bg-brutal-white border-2 border-brutal-black p-1 text-[10px] font-bold"
            >
              {PROVIDERS.map((p) => (
                <option key={p.id} value={p.id}>{p.name}</option>
              ))}
            </select>
          </div>

          <div className="text-xs bg-brutal-white/90 p-2 border-2 border-brutal-black">
            <div className="flex items-center justify-between mb-1">
              <p className="font-bold uppercase text-[10px] text-brutal-black/60">
                Model
              </p>
              {apiSettings?.hasApiKey && (
                <button
                  onClick={fetchModels}
                  disabled={modelsLoading}
                  className="p-0.5 hover:bg-brutal-black/10 rounded"
                >
                  {modelsLoading ? (
                    <Loader2 className="h-2.5 w-2.5 animate-spin" />
                  ) : (
                    <RefreshCw className="h-2.5 w-2.5" />
                  )}
                </button>
              )}
            </div>
            <select
              value={model}
              onChange={(e) => handleModelChange(e.target.value)}
              disabled={modelsLoading}
              className="w-full bg-brutal-white border-2 border-brutal-black p-1 text-[10px] font-bold"
            >
              {models.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.isRecommended ? '* ' : ''}{m.displayName}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Temperature */}
        <div className="text-xs bg-brutal-white/90 p-2 border-2 border-brutal-black">
          <p className="font-bold uppercase text-[10px] text-brutal-black/60 mb-1">
            Temperature: {temperature.toFixed(1)}
          </p>
          <input
            type="range"
            min="0"
            max="1"
            step="0.1"
            value={temperature}
            onChange={(e) => handleTemperatureChange(parseFloat(e.target.value))}
            className="w-full h-2 bg-brutal-black/20 rounded-lg appearance-none cursor-pointer"
          />
          <div className="flex justify-between text-[9px] text-brutal-black/50 mt-0.5">
            <span>Focused</span>
            <span>Creative</span>
          </div>
        </div>

        {/* API Status Warning */}
        {!isLoadingSettings && !apiSettings?.hasApiKey && (
          <div className="flex items-center space-x-2 text-xs bg-brutal-red/20 text-brutal-red p-2 border-2 border-brutal-red">
            <AlertCircle className="h-4 w-4 flex-shrink-0" />
            <span>API key not configured. Go to Settings.</span>
          </div>
        )}

        {/* Generate Button */}
        <button
          onClick={handleGenerate}
          disabled={isGenerating || !prompt.trim() || isLoadingSettings || !apiSettings?.hasApiKey}
          className={`w-full flex items-center justify-center space-x-2 p-2.5 text-sm font-bold uppercase border-3 border-brutal-black transition-all ${
            isGenerating || !prompt.trim() || isLoadingSettings || !apiSettings?.hasApiKey
              ? 'bg-gray-300 cursor-not-allowed'
              : 'bg-brutal-cyan hover:bg-brutal-cyan/80 hover:translate-x-0.5 hover:translate-y-0.5'
          }`}
          style={{ boxShadow: (isGenerating || !prompt.trim() || isLoadingSettings || !apiSettings?.hasApiKey) ? 'none' : '3px 3px 0px 0px #000000' }}
        >
          {isLoadingSettings ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              <span>Loading...</span>
            </>
          ) : isGenerating ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              <span>Generating...</span>
            </>
          ) : (
            <>
              <Play className="h-4 w-4" />
              <span>Generate</span>
            </>
          )}
        </button>

        {/* Error */}
        {error && (
          <div className="flex items-start space-x-2 text-xs bg-brutal-red/20 text-brutal-red p-2 border-2 border-brutal-red">
            <AlertCircle className="h-4 w-4 flex-shrink-0 mt-0.5" />
            <span>{error}</span>
          </div>
        )}

        {/* Generated Result */}
        {generatedText && (
          <div className="text-xs bg-brutal-white p-2 border-2 border-brutal-black">
            <div className="flex items-center justify-between mb-2">
              <p className="font-bold uppercase text-[10px] text-brutal-black/60">
                Generated Text
              </p>
              <div className="flex space-x-1">
                <button
                  onClick={copyToClipboard}
                  className="p-1 hover:bg-gray-100 rounded"
                  title="Copy"
                >
                  {copied ? (
                    <Check className="h-3 w-3 text-green-500" />
                  ) : (
                    <Copy className="h-3 w-3" />
                  )}
                </button>
                <button
                  onClick={handleGenerate}
                  disabled={isGenerating}
                  className="p-1 hover:bg-gray-100 rounded"
                  title="Regenerate"
                >
                  <RefreshCw className={`h-3 w-3 ${isGenerating ? 'animate-spin' : ''}`} />
                </button>
              </div>
            </div>
            <div className="max-h-40 overflow-y-auto">
              <p className="text-xs whitespace-pre-wrap font-mono bg-gray-50 p-2 border border-brutal-black/20">
                {generatedText}
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Output Handle */}
      <Handle
        type="source"
        position={Position.Right}
        id="text"
        className="!w-4 !h-4 !bg-brutal-black !border-2 !border-brutal-white"
        style={{ right: -8 }}
      />
    </div>
  );
});

StoryGenNode.displayName = 'StoryGenNode';

export default StoryGenNode;
