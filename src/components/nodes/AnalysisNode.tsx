import { memo, useState } from 'react';
import { Handle, Position, NodeProps, useReactFlow } from '@xyflow/react';
import { Search, Database, Loader2, ChevronDown, ChevronUp } from 'lucide-react';
import { usePlanContext } from '../../contexts/PlanContext';

interface SelectedAnalysisData {
  id: string;
  title: string;
  workflowName: string;
  variables: Array<{ name: string; value: any; confidence?: number }>;
}

const AnalysisNode = memo(({ id, selected, data }: NodeProps) => {
  const { analyses, isLoadingAnalyses } = usePlanContext();
  const { setNodes } = useReactFlow();
  const [isExpanded, setIsExpanded] = useState(true);

  // Type assertions for node data
  const nodeData = data as {
    label?: string;
    selectedAnalysisId?: string;
    selectedAnalysis?: SelectedAnalysisData;
  };

  const selectedAnalysisId = nodeData?.selectedAnalysisId;
  const selectedAnalysis = nodeData?.selectedAnalysis;

  const handleAnalysisChange = (analysisId: string) => {
    const analysis = analyses.find(a => a.id === analysisId);

    if (analysis) {
      // Convert resultData to array of variables
      const variables = Object.entries(analysis.resultData).map(([name, resultItem]: [string, any]) => ({
        name,
        value: resultItem?.value ?? resultItem,
        confidence: resultItem?.confidence,
      }));

      // Update node data
      setNodes(nodes => nodes.map(node => {
        if (node.id === id) {
          return {
            ...node,
            data: {
              ...node.data,
              selectedAnalysisId: analysisId,
              selectedAnalysis: {
                id: analysis.id,
                title: analysis.title,
                workflowName: analysis.workflowName,
                variables,
              },
            },
          };
        }
        return node;
      }));
    } else {
      // Clear selection
      setNodes(nodes => nodes.map(node => {
        if (node.id === id) {
          return {
            ...node,
            data: {
              ...node.data,
              selectedAnalysisId: undefined,
              selectedAnalysis: undefined,
            },
          };
        }
        return node;
      }));
    }
  };

  const variables = selectedAnalysis?.variables || [];

  return (
    <div
      className={`min-w-[240px] max-w-[300px] bg-brutal-cyan border-3 border-brutal-black transition-all ${
        selected ? 'ring-4 ring-brutal-magenta' : ''
      } ${isLoadingAnalyses ? 'node-generating-cyan' : ''}`}
      style={{ boxShadow: isLoadingAnalyses ? undefined : '4px 4px 0px 0px #000000' }}
    >
      {/* Header */}
      <div className="bg-brutal-black text-brutal-white px-3 py-2 flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <Search className="h-4 w-4" />
          <span className="font-bold uppercase text-sm">Analysis</span>
        </div>
        {selectedAnalysis && (
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="p-1 hover:bg-white/20 rounded"
          >
            {isExpanded ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
          </button>
        )}
      </div>

      {/* Content */}
      <div className="p-3 space-y-2">
        <div className="flex items-center space-x-2 text-xs">
          <Database className="h-3 w-3" />
          <span className="font-bold">Load Analysis Results</span>
        </div>

        <div className="text-xs bg-brutal-white/50 p-2 border-2 border-brutal-black">
          <p className="font-bold uppercase text-[10px] text-brutal-black/60 mb-1">
            Select Analysis
          </p>
          {isLoadingAnalyses ? (
            <div className="flex items-center justify-center py-2">
              <Loader2 className="h-4 w-4 animate-spin" />
            </div>
          ) : (
            <select
              value={selectedAnalysisId || ''}
              onChange={(e) => handleAnalysisChange(e.target.value)}
              className="w-full bg-brutal-white border-2 border-brutal-black p-1 text-xs font-bold cursor-pointer"
            >
              <option value="">-- Choose analysis --</option>
              {analyses.map((analysis) => (
                <option key={analysis.id} value={analysis.id}>
                  {analysis.title} ({analysis.workflowName})
                </option>
              ))}
            </select>
          )}
        </div>

        {/* Show selected analysis variables */}
        {selectedAnalysis && isExpanded && (
          <div className="text-xs bg-brutal-white/80 p-2 border-2 border-brutal-black">
            <p className="font-bold uppercase text-[10px] text-brutal-black/60 mb-2">
              Variables ({variables.length})
            </p>
            <div className="space-y-1 max-h-32 overflow-y-auto">
              {variables.map((variable: { name: string; value: any }, idx: number) => (
                <div
                  key={idx}
                  className="flex items-center justify-between p-1.5 bg-brutal-cyan/30 border border-brutal-black/30"
                >
                  <span className="font-bold text-[10px] uppercase truncate flex-1">
                    {variable.name}
                  </span>
                  <span className="text-[9px] text-brutal-black/60 truncate max-w-[80px] ml-1">
                    {typeof variable.value === 'string'
                      ? variable.value.substring(0, 15) + (variable.value.length > 15 ? '...' : '')
                      : JSON.stringify(variable.value).substring(0, 15)}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Collapsed state */}
        {selectedAnalysis && !isExpanded && (
          <div className="text-xs bg-brutal-white/80 p-2 border-2 border-brutal-black">
            <p className="font-bold uppercase text-[10px] text-brutal-black/60">
              {variables.length} variables available
            </p>
          </div>
        )}

        {!selectedAnalysis && (
          <div className="text-[10px] text-brutal-black/70 uppercase font-bold">
            Select an analysis to see variables
          </div>
        )}

        {selectedAnalysis && (
          <div className="text-[10px] text-brutal-black/70 uppercase font-bold flex items-center">
            <div className="w-2 h-2 bg-green-500 rounded-full mr-1"></div>
            Ready to connect
          </div>
        )}
      </div>

      {/* Single Output Handle */}
      <Handle
        type="source"
        position={Position.Right}
        id="data"
        className="!w-4 !h-4 !bg-brutal-black !border-2 !border-brutal-white"
        style={{ right: -8 }}
      />
    </div>
  );
});

AnalysisNode.displayName = 'AnalysisNode';

export default AnalysisNode;
