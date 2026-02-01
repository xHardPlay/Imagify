import React, { useCallback, useState } from 'react';
import {
  ReactFlow,
  Controls,
  Background,
  useNodesState,
  useEdgesState,
  addEdge,
  Connection,
  Edge,
  Node,
  BackgroundVariant,
  Panel,
  ReactFlowProvider,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import { Search, Image, BookOpen, Sparkles, Plus, Trash2 } from 'lucide-react';
import AnalysisNode from '../components/nodes/AnalysisNode';
import ImageGenNode from '../components/nodes/ImageGenNode';
import StoryGenNode from '../components/nodes/StoryGenNode';
import OutputNode from '../components/nodes/OutputNode';
import { PlanProvider } from '../contexts/PlanContext';

// Define custom node types
const nodeTypes = {
  analysis: AnalysisNode,
  imageGen: ImageGenNode,
  storyGen: StoryGenNode,
  output: OutputNode,
};

// Initial nodes for demo
const initialNodes: Node[] = [];
const initialEdges: Edge[] = [];

// Node templates for the sidebar
const nodeTemplates = [
  {
    type: 'analysis',
    label: 'Analysis',
    description: 'Load analysis results',
    icon: Search,
    color: 'brutal-cyan',
  },
  {
    type: 'imageGen',
    label: 'Image Gen',
    description: 'Generate images with AI',
    icon: Image,
    color: 'brutal-magenta',
  },
  {
    type: 'storyGen',
    label: 'Story Gen',
    description: 'Generate stories/text',
    icon: BookOpen,
    color: 'brutal-yellow',
  },
  {
    type: 'output',
    label: 'Output',
    description: 'Final output node',
    icon: Sparkles,
    color: 'brutal-lime',
  },
];

const PlanPageInner: React.FC = () => {
  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);
  const [selectedNode, setSelectedNode] = useState<Node | null>(null);

  const onConnect = useCallback(
    (params: Connection) => setEdges((eds) => addEdge({ ...params, animated: true }, eds)),
    [setEdges]
  );

  const onNodeClick = useCallback((_: React.MouseEvent, node: Node) => {
    setSelectedNode(node);
  }, []);

  const onPaneClick = useCallback(() => {
    setSelectedNode(null);
  }, []);

  // Keep selectedNode in sync with nodes state (for data updates)
  const currentSelectedNode = selectedNode
    ? nodes.find(n => n.id === selectedNode.id) || selectedNode
    : null;

  const addNode = (type: string) => {
    const template = nodeTemplates.find(t => t.type === type);
    if (!template) return;

    const newNode: Node = {
      id: `${type}-${Date.now()}`,
      type,
      position: { x: 250 + Math.random() * 200, y: 150 + Math.random() * 200 },
      data: { label: template.label },
    };

    setNodes((nds) => [...nds, newNode]);
  };

  const deleteSelectedNode = () => {
    if (!selectedNode) return;
    setNodes((nds) => nds.filter((n) => n.id !== selectedNode.id));
    setEdges((eds) => eds.filter((e) => e.source !== selectedNode.id && e.target !== selectedNode.id));
    setSelectedNode(null);
  };

  const clearCanvas = () => {
    if (!window.confirm('Clear all nodes? This cannot be undone.')) return;
    setNodes([]);
    setEdges([]);
    setSelectedNode(null);
  };

  // Get selected analysis data for display in properties panel
  const getSelectedNodeAnalysis = () => {
    if (!currentSelectedNode || currentSelectedNode.type !== 'analysis') return null;
    return (currentSelectedNode.data as any)?.selectedAnalysis;
  };

  const selectedAnalysis = getSelectedNodeAnalysis();

  return (
    <div className="flex h-[calc(100vh-12rem)]">
      {/* Left Sidebar - Node Palette */}
      <div className="w-64 bg-brutal-white border-r-4 border-brutal-black p-4 overflow-y-auto">
        <h2 className="font-bold uppercase text-lg mb-4 flex items-center">
          <Plus className="h-5 w-5 mr-2" />
          ADD NODES
        </h2>

        <div className="space-y-3">
          {nodeTemplates.map((template) => {
            const Icon = template.icon;
            return (
              <button
                key={template.type}
                onClick={() => addNode(template.type)}
                className={`w-full p-3 border-3 border-brutal-black bg-${template.color} hover:translate-x-0.5 hover:translate-y-0.5 transition-transform text-left`}
                style={{ boxShadow: '3px 3px 0px 0px #000000' }}
              >
                <div className="flex items-center space-x-2 mb-1">
                  <Icon className="h-5 w-5" />
                  <span className="font-bold uppercase text-sm">{template.label}</span>
                </div>
                <p className="text-xs opacity-80">{template.description}</p>
              </button>
            );
          })}
        </div>

        <div className="mt-6 pt-4 border-t-2 border-brutal-black">
          <h3 className="font-bold uppercase text-sm mb-3">CANVAS ACTIONS</h3>
          <div className="space-y-2">
            <button
              onClick={deleteSelectedNode}
              disabled={!selectedNode}
              className={`w-full p-2 border-2 border-brutal-black flex items-center justify-center space-x-2 text-sm font-bold uppercase transition-colors ${
                selectedNode
                  ? 'bg-brutal-red text-brutal-white hover:bg-red-700'
                  : 'bg-gray-200 text-gray-400 cursor-not-allowed'
              }`}
              style={{ boxShadow: selectedNode ? '2px 2px 0px 0px #000000' : 'none' }}
            >
              <Trash2 className="h-4 w-4" />
              <span>Delete Selected</span>
            </button>
            <button
              onClick={clearCanvas}
              className="w-full p-2 border-2 border-brutal-black bg-brutal-white hover:bg-gray-100 flex items-center justify-center space-x-2 text-sm font-bold uppercase"
              style={{ boxShadow: '2px 2px 0px 0px #000000' }}
            >
              <Trash2 className="h-4 w-4" />
              <span>Clear All</span>
            </button>
          </div>
        </div>

        {/* Instructions */}
        <div className="mt-6 p-3 bg-brutal-lime/20 border-2 border-brutal-black text-xs">
          <p className="font-bold uppercase mb-2">How to use:</p>
          <ul className="space-y-1 list-disc list-inside">
            <li>Click buttons above to add nodes</li>
            <li>Drag nodes to reposition</li>
            <li>Connect outputs to inputs</li>
            <li>Click a node to select it</li>
          </ul>
        </div>
      </div>

      {/* Main Canvas */}
      <div className="flex-1 bg-gray-100">
        <ReactFlow
          nodes={nodes}
          edges={edges}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          onConnect={onConnect}
          onNodeClick={onNodeClick}
          onPaneClick={onPaneClick}
          nodeTypes={nodeTypes}
          fitView
          className="bg-gray-50"
        >
          <Background variant={BackgroundVariant.Dots} gap={20} size={2} color="#000" />
          <Controls className="!border-3 !border-brutal-black !bg-brutal-white !shadow-none" style={{ boxShadow: '3px 3px 0px 0px #000000' }} />

          <Panel position="top-center" className="bg-brutal-yellow border-3 border-brutal-black p-2 font-bold uppercase text-sm" style={{ boxShadow: '3px 3px 0px 0px #000000' }}>
            WORKFLOW CANVAS - Connect nodes to create your AI pipeline
          </Panel>

          {nodes.length === 0 && (
            <Panel position="top-center" className="mt-20">
              <div className="text-center p-8 bg-brutal-white border-3 border-brutal-black" style={{ boxShadow: '4px 4px 0px 0px #000000' }}>
                <Sparkles className="h-12 w-12 mx-auto mb-4 text-brutal-magenta" />
                <h3 className="font-bold uppercase text-xl mb-2">Start Building</h3>
                <p className="text-sm text-gray-600 mb-4">
                  Add nodes from the sidebar to start creating your AI workflow
                </p>
                <button
                  onClick={() => addNode('analysis')}
                  className="btn btn-primary btn-md"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Add First Node
                </button>
              </div>
            </Panel>
          )}
        </ReactFlow>
      </div>

      {/* Right Sidebar - Node Properties (when selected) */}
      {currentSelectedNode && (
        <div className="w-72 bg-brutal-white border-l-4 border-brutal-black p-4 overflow-y-auto">
          <h2 className="font-bold uppercase text-lg mb-4">NODE PROPERTIES</h2>

          <div className="space-y-4">
            <div>
              <label className="block text-xs font-bold uppercase text-gray-500 mb-1">
                Node Type
              </label>
              <div className="p-2 bg-gray-100 border-2 border-brutal-black font-mono text-sm">
                {currentSelectedNode.type}
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold uppercase text-gray-500 mb-1">
                Node ID
              </label>
              <div className="p-2 bg-gray-100 border-2 border-brutal-black font-mono text-xs break-all">
                {currentSelectedNode.id}
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold uppercase text-gray-500 mb-1">
                Position
              </label>
              <div className="p-2 bg-gray-100 border-2 border-brutal-black font-mono text-sm">
                X: {Math.round(currentSelectedNode.position.x)}, Y: {Math.round(currentSelectedNode.position.y)}
              </div>
            </div>

            {/* Show analysis details if this is an analysis node */}
            {currentSelectedNode.type === 'analysis' && selectedAnalysis && (
              <>
                <div className="border-t-2 border-brutal-black pt-4">
                  <label className="block text-xs font-bold uppercase text-gray-500 mb-1">
                    Selected Analysis
                  </label>
                  <div className="p-2 bg-brutal-cyan/20 border-2 border-brutal-black">
                    <p className="font-bold text-sm">{selectedAnalysis.title}</p>
                    <p className="text-xs text-gray-600">{selectedAnalysis.workflowName}</p>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase text-gray-500 mb-1">
                    Available Variables ({selectedAnalysis.variables.length})
                  </label>
                  <div className="max-h-48 overflow-y-auto space-y-1">
                    {selectedAnalysis.variables.map((v: any, idx: number) => (
                      <div
                        key={idx}
                        className="p-2 bg-gray-100 border-2 border-brutal-black text-xs"
                      >
                        <span className="font-bold uppercase">{v.name}</span>
                        <span className="text-gray-600 block truncate">
                          {typeof v.value === 'string' ? v.value : JSON.stringify(v.value)}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </>
            )}

            {currentSelectedNode.type === 'analysis' && !selectedAnalysis && (
              <div className="p-3 bg-brutal-yellow/20 border-2 border-brutal-black text-xs">
                <p className="font-bold uppercase mb-1">No Analysis Selected</p>
                <p>Select an analysis from the dropdown in the node to see its variables.</p>
              </div>
            )}

            {currentSelectedNode.type !== 'analysis' && (
              <div className="p-3 bg-brutal-cyan/20 border-2 border-brutal-black text-xs">
                <p className="font-bold uppercase mb-1">Coming Soon:</p>
                <p>Node configuration, parameter editing, and more!</p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

// Wrap with providers
const PlanPage: React.FC = () => {
  return (
    <ReactFlowProvider>
      <PlanProvider>
        <PlanPageInner />
      </PlanProvider>
    </ReactFlowProvider>
  );
};

export default PlanPage;
