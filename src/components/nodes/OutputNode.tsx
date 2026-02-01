import { memo, useState } from 'react';
import { Handle, Position, NodeProps, useReactFlow } from '@xyflow/react';
import { Sparkles, Play, Loader2, Copy, Check, RefreshCw, AlertCircle } from 'lucide-react';
import { api } from '../../services/api';
import { usePlanContext } from '../../contexts/PlanContext';

interface GeneratedResult {
  type: 'text' | 'image';
  content: string;
  sourceNode: string;
}

const OutputNode = memo(({ id, selected }: NodeProps) => {
  const { getNodes, getEdges } = useReactFlow();
  const { apiSettings, isLoadingSettings } = usePlanContext();
  const [isRunning, setIsRunning] = useState(false);
  const [results, setResults] = useState<GeneratedResult[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  // Traverse the graph to find connected generators and their data
  const getConnectedPipeline = () => {
    const edges = getEdges();
    const nodes = getNodes();

    // Find edges coming into this output node
    const incomingEdges = edges.filter(e => e.target === id);

    const pipeline: Array<{
      type: 'storyGen' | 'imageGen';
      nodeId: string;
      prompt: string;
      format?: string;
      model?: string;
      temperature?: number;
      provider?: string;
      variables: Record<string, any>;
    }> = [];

    for (const edge of incomingEdges) {
      const sourceNode = nodes.find(n => n.id === edge.source);
      if (!sourceNode) continue;

      if (sourceNode.type === 'storyGen' || sourceNode.type === 'imageGen') {
        const nodeData = sourceNode.data as {
          prompt?: string;
          format?: string;
          model?: string;
          temperature?: number;
          provider?: string;
        };

        // Find the Analysis node connected to this generator
        const analysisEdge = edges.find(e => e.target === sourceNode.id);
        let variables: Record<string, any> = {};

        if (analysisEdge) {
          const analysisNode = nodes.find(n => n.id === analysisEdge.source);
          if (analysisNode?.type === 'analysis') {
            const analysisData = analysisNode.data as {
              selectedAnalysis?: {
                variables: Array<{ name: string; value: any }>;
              };
            };
            // Convert variables array to object
            if (analysisData?.selectedAnalysis?.variables) {
              for (const v of analysisData.selectedAnalysis.variables) {
                variables[v.name] = v.value;
              }
            }
          }
        }

        pipeline.push({
          type: sourceNode.type as 'storyGen' | 'imageGen',
          nodeId: sourceNode.id,
          prompt: nodeData.prompt || '',
          format: nodeData.format,
          model: nodeData.model,
          temperature: nodeData.temperature,
          provider: nodeData.provider,
          variables,
        });
      }
    }

    return pipeline;
  };

  // Replace {VARIABLE} placeholders with actual values
  const replaceVariables = (prompt: string, variables: Record<string, any>): string => {
    let result = prompt;
    for (const [name, value] of Object.entries(variables)) {
      const placeholder = new RegExp(`\\{${name}\\}`, 'gi');
      const stringValue = typeof value === 'string' ? value : JSON.stringify(value);
      result = result.replace(placeholder, stringValue);
    }
    return result;
  };

  const runPipeline = async () => {
    setIsRunning(true);
    setError(null);
    setResults([]);

    try {
      // Check if API is configured
      if (!apiSettings?.hasApiKey) {
        throw new Error('API key not configured. Please go to Settings to add your Gemini API key.');
      }

      const pipeline = getConnectedPipeline();

      if (pipeline.length === 0) {
        throw new Error('No generators connected. Connect a Story Gen or Image Gen node.');
      }

      const newResults: GeneratedResult[] = [];

      for (const step of pipeline) {
        if (!step.prompt) {
          throw new Error(`No prompt defined in ${step.type === 'storyGen' ? 'Story Gen' : 'Image Gen'} node.`);
        }

        const finalPrompt = replaceVariables(step.prompt, step.variables);

        if (step.type === 'storyGen') {
          // Call Gemini API for text generation using per-node settings (fallback to global settings)
          const contents = [{
            parts: [{ text: finalPrompt }]
          }];

          const nodeModel = step.model || apiSettings?.model;
          const nodeTemperature = step.temperature ?? apiSettings?.temperature ?? 0.7;

          const response = await api.analyzeImage(
            contents,
            {
              temperature: nodeTemperature,
              maxOutputTokens: apiSettings?.maxTokens ?? 2048,
            },
            nodeModel
          );

          if (!response.success || !response.data) {
            // Provide more specific error messages
            const errorMsg = response.error || 'Failed to generate text';
            if (errorMsg.includes('overloaded') || errorMsg.includes('503')) {
              throw new Error(`Model "${nodeModel || 'unknown'}" is currently overloaded. Try again in a few seconds or change the model.`);
            }
            if (errorMsg.includes('quota') || errorMsg.includes('429')) {
              throw new Error('API quota exceeded. Please check your Gemini API usage limits.');
            }
            throw new Error(errorMsg);
          }

          const generatedText = response.data.candidates?.[0]?.content?.parts?.[0]?.text;
          if (generatedText) {
            newResults.push({
              type: 'text',
              content: generatedText,
              sourceNode: step.nodeId,
            });
          }
        } else if (step.type === 'imageGen') {
          // For now, just show the final prompt (image generation would need a different API)
          newResults.push({
            type: 'text',
            content: `[Image Prompt Ready]\n\n${finalPrompt}\n\n(Image generation API not yet integrated)`,
            sourceNode: step.nodeId,
          });
        }
      }

      setResults(newResults);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setIsRunning(false);
    }
  };

  const copyToClipboard = async (text: string) => {
    await navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const hasResults = results.length > 0;

  return (
    <div
      className={`min-w-[280px] max-w-[400px] bg-brutal-lime border-3 border-brutal-black ${
        selected ? 'ring-4 ring-brutal-magenta' : ''
      }`}
      style={{ boxShadow: '4px 4px 0px 0px #000000' }}
    >
      {/* Input Handles */}
      <Handle
        type="target"
        position={Position.Left}
        id="image"
        className="!w-4 !h-4 !bg-brutal-magenta !border-2 !border-brutal-white"
        style={{ left: -8, top: '25%' }}
      />
      <Handle
        type="target"
        position={Position.Left}
        id="text"
        className="!w-4 !h-4 !bg-brutal-yellow !border-2 !border-brutal-black"
        style={{ left: -8, top: '45%' }}
      />

      {/* Header */}
      <div className="bg-brutal-black text-brutal-white px-3 py-2 flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <Sparkles className="h-4 w-4" />
          <span className="font-bold uppercase text-sm">Output</span>
        </div>
        {hasResults && (
          <span className="text-[10px] bg-green-500 px-2 py-0.5 rounded font-bold">
            READY
          </span>
        )}
      </div>

      {/* Content */}
      <div className="p-3 space-y-2">
        {/* Input indicators */}
        <div className="text-xs bg-brutal-white/90 p-2 border-2 border-brutal-black">
          <p className="font-bold uppercase text-[10px] text-brutal-black/60 mb-1">
            Inputs
          </p>
          <div className="space-y-1">
            <div className="flex items-center space-x-2 text-xs">
              <div className="w-2 h-2 bg-brutal-magenta rounded-full"></div>
              <span>Image (optional)</span>
            </div>
            <div className="flex items-center space-x-2 text-xs">
              <div className="w-2 h-2 bg-brutal-yellow rounded-full"></div>
              <span>Text (optional)</span>
            </div>
          </div>
        </div>

        {/* API Status */}
        {!isLoadingSettings && !apiSettings?.hasApiKey && (
          <div className="flex items-center space-x-2 text-xs bg-brutal-red/20 text-brutal-red p-2 border-2 border-brutal-red">
            <AlertCircle className="h-4 w-4 flex-shrink-0" />
            <span>API key not configured. Go to Settings first.</span>
          </div>
        )}

        {/* Model Info */}
        {apiSettings?.hasApiKey && (
          <div className="text-xs bg-brutal-white/90 p-2 border-2 border-brutal-black">
            <p className="font-bold uppercase text-[10px] text-brutal-black/60 mb-1">
              Model
            </p>
            <p className="text-xs font-mono truncate">{apiSettings.model}</p>
          </div>
        )}

        {/* Run Button */}
        <button
          onClick={runPipeline}
          disabled={isRunning || isLoadingSettings || !apiSettings?.hasApiKey}
          className={`w-full flex items-center justify-center space-x-2 p-3 text-sm font-bold uppercase border-3 border-brutal-black transition-all ${
            isRunning || isLoadingSettings || !apiSettings?.hasApiKey
              ? 'bg-gray-300 cursor-not-allowed'
              : 'bg-brutal-cyan hover:bg-brutal-cyan/80 hover:translate-x-0.5 hover:translate-y-0.5'
          }`}
          style={{ boxShadow: (isRunning || isLoadingSettings || !apiSettings?.hasApiKey) ? 'none' : '3px 3px 0px 0px #000000' }}
        >
          {isRunning ? (
            <>
              <Loader2 className="h-5 w-5 animate-spin" />
              <span>Running Pipeline...</span>
            </>
          ) : isLoadingSettings ? (
            <>
              <Loader2 className="h-5 w-5 animate-spin" />
              <span>Loading...</span>
            </>
          ) : (
            <>
              <Play className="h-5 w-5" />
              <span>Run Pipeline</span>
            </>
          )}
        </button>

        {/* Error Display */}
        {error && (
          <div className="text-xs bg-brutal-red/20 text-brutal-red p-2 border-2 border-brutal-red">
            <p className="font-bold uppercase text-[10px] mb-1">Error</p>
            <p>{error}</p>
          </div>
        )}

        {/* Results Display */}
        {hasResults && (
          <div className="space-y-2">
            {results.map((result, idx) => (
              <div key={idx} className="text-xs bg-brutal-white p-2 border-2 border-brutal-black">
                <div className="flex items-center justify-between mb-2">
                  <p className="font-bold uppercase text-[10px] text-brutal-black/60">
                    {result.type === 'text' ? 'Generated Text' : 'Generated Image'}
                  </p>
                  <div className="flex space-x-1">
                    <button
                      onClick={() => copyToClipboard(result.content)}
                      className="p-1 hover:bg-gray-100 rounded"
                      title="Copy to clipboard"
                    >
                      {copied ? (
                        <Check className="h-3 w-3 text-green-500" />
                      ) : (
                        <Copy className="h-3 w-3" />
                      )}
                    </button>
                    <button
                      onClick={runPipeline}
                      className="p-1 hover:bg-gray-100 rounded"
                      title="Regenerate"
                    >
                      <RefreshCw className="h-3 w-3" />
                    </button>
                  </div>
                </div>
                <div className="max-h-48 overflow-y-auto">
                  <p className="text-xs whitespace-pre-wrap font-mono bg-gray-50 p-2 border border-brutal-black/20">
                    {result.content}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Empty state */}
        {!hasResults && !error && !isRunning && (
          <div className="text-xs bg-brutal-white/50 p-3 border-2 border-brutal-black border-dashed text-center">
            <Sparkles className="h-6 w-6 mx-auto mb-2 text-brutal-black/40" />
            <p className="text-brutal-black/60">
              Connect generators and click "Run Pipeline" to see results
            </p>
          </div>
        )}
      </div>
    </div>
  );
});

OutputNode.displayName = 'OutputNode';

export default OutputNode;
