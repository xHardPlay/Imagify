import { memo, useState } from 'react';
import { Handle, Position, NodeProps, useReactFlow } from '@xyflow/react';
import { Wand2, Play, Loader2, Copy, Check, AlertCircle, ChevronDown, ChevronUp } from 'lucide-react';
import { api } from '../../services/api';
import { usePlanContext } from '../../contexts/PlanContext';

interface GeneratedPrompt {
  section: number;
  title: string;
  imagePrompt: string;
}

const PromptGenNode = memo(({ id, selected, data }: NodeProps) => {
  const { getNodes, getEdges, setNodes } = useReactFlow();
  const { apiSettings, isLoadingSettings } = usePlanContext();

  // Node data
  const nodeData = data as {
    instructions?: string;
    generatedPrompts?: GeneratedPrompt[];
  };

  const [instructions, setInstructions] = useState(nodeData.instructions || '');
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedPrompts, setGeneratedPrompts] = useState<GeneratedPrompt[]>(nodeData.generatedPrompts || []);
  const [error, setError] = useState<string | null>(null);
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);
  const [isExpanded, setIsExpanded] = useState(true);

  // Get connected StoryGen node's generated text
  const getInputText = (): string | null => {
    const edges = getEdges();
    const nodes = getNodes();

    // Find edge connecting to this node's input
    const incomingEdge = edges.find(e => e.target === id && e.targetHandle === 'text');
    if (!incomingEdge) return null;

    const sourceNode = nodes.find(n => n.id === incomingEdge.source);
    if (!sourceNode) return null;

    // Get generated text from source node
    const sourceData = sourceNode.data as { generatedText?: string };
    return sourceData?.generatedText || null;
  };

  const inputText = getInputText();

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

  const handleInstructionsChange = (value: string) => {
    setInstructions(value);
    updateNodeData({ instructions: value });
  };

  const handleGenerate = async () => {
    if (!inputText) {
      setError('No input text. Connect a Story Gen node with generated content.');
      return;
    }

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
      const systemPrompt = `You are an expert at creating image generation prompts.
Your task is to analyze a story and create detailed image prompts for each major section.

Instructions from user: ${instructions || 'Create image prompts for each section of the story'}

IMPORTANT: Respond ONLY with valid JSON in this exact format:
{
  "prompts": [
    {
      "section": 1,
      "title": "Brief section title",
      "imagePrompt": "Detailed image generation prompt describing the scene, style, lighting, composition..."
    }
  ]
}

Guidelines for image prompts:
- Be specific about visual details (colors, lighting, composition)
- Include art style suggestions (photorealistic, illustration, cinematic, etc.)
- Describe the mood and atmosphere
- Keep each prompt focused on a single key moment
- Create 3-6 prompts depending on story length`;

      const userPrompt = `Here is the story to analyze:\n\n${inputText}\n\nCreate image prompts for the key scenes.`;

      const contents = [{
        parts: [
          { text: systemPrompt },
          { text: userPrompt }
        ]
      }];

      const response = await api.analyzeImage(
        contents,
        {
          temperature: 0.7,
          maxOutputTokens: 4096,
        },
        apiSettings.model
      );

      if (!response.success || !response.data) {
        throw new Error(response.error || 'Failed to generate prompts');
      }

      const responseText = response.data.candidates?.[0]?.content?.parts?.[0]?.text || '';

      // Parse JSON from response
      const jsonMatch = responseText.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        throw new Error('Invalid response format');
      }

      const parsed = JSON.parse(jsonMatch[0]);
      const prompts: GeneratedPrompt[] = parsed.prompts || [];

      setGeneratedPrompts(prompts);
      updateNodeData({ generatedPrompts: prompts });

    } catch (err) {
      console.error('Generation error:', err);
      setError(err instanceof Error ? err.message : 'Generation failed');
    } finally {
      setIsGenerating(false);
    }
  };

  const copyPrompt = async (index: number, text: string) => {
    await navigator.clipboard.writeText(text);
    setCopiedIndex(index);
    setTimeout(() => setCopiedIndex(null), 2000);
  };

  const hasPrompts = generatedPrompts.length > 0;

  return (
    <div
      className={`min-w-[300px] max-w-[400px] bg-brutal-magenta border-3 border-brutal-black ${
        selected ? 'ring-4 ring-brutal-cyan' : ''
      }`}
      style={{ boxShadow: '4px 4px 0px 0px #000000' }}
    >
      {/* Input Handle */}
      <Handle
        type="target"
        position={Position.Left}
        id="text"
        className="!w-4 !h-4 !bg-brutal-yellow !border-2 !border-brutal-black"
        style={{ left: -8 }}
      />

      {/* Header */}
      <div className="bg-brutal-black text-brutal-white px-3 py-2 flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <Wand2 className="h-4 w-4" />
          <span className="font-bold uppercase text-sm">Prompt Gen</span>
        </div>
        {hasPrompts && (
          <div className="flex items-center space-x-2">
            <span className="text-[10px] bg-green-500 px-2 py-0.5 rounded font-bold">
              {generatedPrompts.length} PROMPTS
            </span>
            <button
              onClick={() => setIsExpanded(!isExpanded)}
              className="p-1 hover:bg-white/20 rounded"
            >
              {isExpanded ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
            </button>
          </div>
        )}
      </div>

      {/* Content */}
      <div className="p-3 space-y-2">
        <div className="flex items-center space-x-2 text-xs text-brutal-white">
          <Wand2 className="h-3 w-3" />
          <span className="font-bold">Story to Image Prompts</span>
        </div>

        {/* Input Status */}
        <div className={`text-xs p-2 border-2 border-brutal-black ${inputText ? 'bg-green-100' : 'bg-brutal-white/50 border-dashed'}`}>
          {inputText ? (
            <div>
              <p className="font-bold uppercase text-[10px] text-brutal-black/60 mb-1">Input Text</p>
              <p className="text-[10px] text-brutal-black/80 line-clamp-2">
                {inputText.substring(0, 150)}...
              </p>
            </div>
          ) : (
            <p className="text-[10px] text-brutal-black/60 text-center">
              Connect a Story Gen node output
            </p>
          )}
        </div>

        {/* Instructions */}
        <div className="text-xs bg-brutal-white/90 p-2 border-2 border-brutal-black">
          <p className="font-bold uppercase text-[10px] text-brutal-black/60 mb-1">
            Instructions (optional)
          </p>
          <textarea
            value={instructions}
            onChange={(e) => handleInstructionsChange(e.target.value)}
            placeholder="e.g., Create cinematic image prompts for each scene..."
            className="w-full bg-brutal-white border-2 border-brutal-black p-2 text-xs font-mono resize-none h-14"
          />
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
          disabled={isGenerating || !inputText || isLoadingSettings || !apiSettings?.hasApiKey}
          className={`w-full flex items-center justify-center space-x-2 p-2.5 text-sm font-bold uppercase border-3 border-brutal-black transition-all ${
            isGenerating || !inputText || isLoadingSettings || !apiSettings?.hasApiKey
              ? 'bg-gray-300 cursor-not-allowed'
              : 'bg-brutal-yellow hover:bg-brutal-yellow/80 hover:translate-x-0.5 hover:translate-y-0.5'
          }`}
          style={{ boxShadow: (isGenerating || !inputText || isLoadingSettings || !apiSettings?.hasApiKey) ? 'none' : '3px 3px 0px 0px #000000' }}
        >
          {isLoadingSettings ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              <span>Loading...</span>
            </>
          ) : isGenerating ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              <span>Generating Prompts...</span>
            </>
          ) : (
            <>
              <Play className="h-4 w-4" />
              <span>Generate Prompts</span>
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

        {/* Generated Prompts */}
        {hasPrompts && isExpanded && (
          <div className="space-y-2 max-h-64 overflow-y-auto">
            {generatedPrompts.map((prompt, idx) => (
              <div key={idx} className="text-xs bg-brutal-white p-2 border-2 border-brutal-black">
                <div className="flex items-center justify-between mb-1">
                  <p className="font-bold uppercase text-[10px] text-brutal-black">
                    {prompt.section}. {prompt.title}
                  </p>
                  <button
                    onClick={() => copyPrompt(idx, prompt.imagePrompt)}
                    className="p-1 hover:bg-gray-100 rounded"
                    title="Copy prompt"
                  >
                    {copiedIndex === idx ? (
                      <Check className="h-3 w-3 text-green-500" />
                    ) : (
                      <Copy className="h-3 w-3" />
                    )}
                  </button>
                </div>
                <p className="text-[10px] text-brutal-black/80 font-mono bg-gray-50 p-1.5 border border-brutal-black/20">
                  {prompt.imagePrompt}
                </p>
              </div>
            ))}
          </div>
        )}

        {/* Collapsed state */}
        {hasPrompts && !isExpanded && (
          <div className="text-xs bg-brutal-white/80 p-2 border-2 border-brutal-black text-center">
            <button
              onClick={() => setIsExpanded(true)}
              className="text-[10px] text-brutal-black/60 hover:text-brutal-black"
            >
              Show {generatedPrompts.length} generated prompts
            </button>
          </div>
        )}
      </div>

      {/* Output Handle */}
      <Handle
        type="source"
        position={Position.Right}
        id="prompts"
        className="!w-4 !h-4 !bg-brutal-black !border-2 !border-brutal-white"
        style={{ right: -8 }}
      />
    </div>
  );
});

PromptGenNode.displayName = 'PromptGenNode';

export default PromptGenNode;
