import { memo, useState, useRef, useEffect } from 'react';
import { Handle, Position, NodeProps, useReactFlow } from '@xyflow/react';
import { BookOpen, PenTool, Plus, RefreshCw, Loader2 } from 'lucide-react';
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
  // Future: { id: 'openai', name: 'OpenAI' },
];

const StoryGenNode = memo(({ id, selected, data }: NodeProps) => {
  const { getNodes, getEdges, setNodes } = useReactFlow();
  const { apiSettings } = usePlanContext();
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Node data with defaults
  const nodeData = data as {
    prompt?: string;
    provider?: string;
    model?: string;
    temperature?: number;
  };

  const [prompt, setPrompt] = useState(nodeData.prompt || '');
  const [provider, setProvider] = useState(nodeData.provider || 'gemini');
  const [model, setModel] = useState(nodeData.model || apiSettings?.model || 'gemini-1.5-flash');
  const [temperature, setTemperature] = useState(nodeData.temperature ?? apiSettings?.temperature ?? 0.7);

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

  // Find connected Analysis node and get its variables
  const getConnectedVariables = (): ConnectedVariable[] => {
    const edges = getEdges();
    const nodes = getNodes();

    // Find edge that connects to this node's "variables" input
    const incomingEdge = edges.find(e => e.target === id && e.targetHandle === 'variables');
    if (!incomingEdge) return [];

    // Find the source node
    const sourceNode = nodes.find(n => n.id === incomingEdge.source);
    if (!sourceNode || sourceNode.type !== 'analysis') return [];

    // Get variables from source node's data
    const sourceData = sourceNode.data as {
      selectedAnalysis?: {
        variables: Array<{ name: string; value: any }>;
      };
    };

    return sourceData?.selectedAnalysis?.variables || [];
  };

  const connectedVariables = getConnectedVariables();

  const insertVariable = (variableName: string) => {
    const textarea = textareaRef.current;
    if (!textarea) return;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const variableTag = `{${variableName}}`;

    const newPrompt = prompt.substring(0, start) + variableTag + prompt.substring(end);
    setPrompt(newPrompt);
    updateNodeData({ prompt: newPrompt });

    // Focus and set cursor position after the inserted variable
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

  return (
    <div
      className={`min-w-[260px] max-w-[320px] bg-brutal-yellow border-3 border-brutal-black ${
        selected ? 'ring-4 ring-brutal-magenta' : ''
      }`}
      style={{ boxShadow: '4px 4px 0px 0px #000000' }}
    >
      {/* Input Handle */}
      <Handle
        type="target"
        position={Position.Left}
        id="variables"
        className="!w-4 !h-4 !bg-brutal-black !border-2 !border-brutal-white"
        style={{ left: -8 }}
      />

      {/* Header */}
      <div className="bg-brutal-black text-brutal-white px-3 py-2 flex items-center space-x-2">
        <BookOpen className="h-4 w-4" />
        <span className="font-bold uppercase text-sm">Story Gen</span>
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
              Insert Variable
            </p>
            <div className="flex flex-wrap gap-1">
              {connectedVariables.map((variable, idx) => (
                <button
                  key={idx}
                  onClick={() => insertVariable(variable.name)}
                  className="px-2 py-0.5 bg-brutal-cyan text-brutal-black text-[10px] font-bold uppercase border-2 border-brutal-black hover:bg-brutal-cyan/70 transition-colors"
                  title={`Value: ${typeof variable.value === 'string' ? variable.value : JSON.stringify(variable.value)}`}
                >
                  {`{${variable.name}}`}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* No connection warning */}
        {connectedVariables.length === 0 && (
          <div className="text-xs bg-brutal-white/50 p-2 border-2 border-brutal-black border-dashed">
            <p className="text-[10px] text-brutal-black/60 text-center">
              Connect an Analysis node to use variables
            </p>
          </div>
        )}

        <div className="text-xs bg-brutal-white/90 p-2 border-2 border-brutal-black">
          <p className="font-bold uppercase text-[10px] text-brutal-black/60 mb-1">
            Story Prompt
          </p>
          <textarea
            ref={textareaRef}
            value={prompt}
            onChange={(e) => handlePromptChange(e.target.value)}
            placeholder="Write a story about {FOOD NAME}..."
            className="w-full bg-brutal-white border-2 border-brutal-black p-2 text-xs font-mono resize-none h-20"
          />
        </div>

        {/* Provider Selection */}
        <div className="text-xs bg-brutal-white/90 p-2 border-2 border-brutal-black">
          <p className="font-bold uppercase text-[10px] text-brutal-black/60 mb-1">
            Provider
          </p>
          <select
            value={provider}
            onChange={(e) => handleProviderChange(e.target.value)}
            className="w-full bg-brutal-white border-2 border-brutal-black p-1 text-xs font-bold"
          >
            {PROVIDERS.map((p) => (
              <option key={p.id} value={p.id}>{p.name}</option>
            ))}
          </select>
        </div>

        {/* Model Selection */}
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
                title="Refresh models"
              >
                {modelsLoading ? (
                  <Loader2 className="h-3 w-3 animate-spin" />
                ) : (
                  <RefreshCw className="h-3 w-3" />
                )}
              </button>
            )}
          </div>
          <select
            value={model}
            onChange={(e) => handleModelChange(e.target.value)}
            disabled={modelsLoading}
            className="w-full bg-brutal-white border-2 border-brutal-black p-1 text-xs font-bold"
          >
            {models.map((m) => (
              <option key={m.id} value={m.id}>
                {m.isRecommended ? '* ' : ''}{m.displayName}
              </option>
            ))}
          </select>
        </div>

        {/* Temperature Slider */}
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

        <div className="text-[10px] text-brutal-black/70 uppercase font-bold">
          Outputs generated text
        </div>
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
