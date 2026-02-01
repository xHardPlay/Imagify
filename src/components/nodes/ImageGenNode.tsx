import { memo, useState, useRef } from 'react';
import { Handle, Position, NodeProps, useReactFlow } from '@xyflow/react';
import { Image, Wand2, Plus } from 'lucide-react';

interface ConnectedVariable {
  name: string;
  value: any;
}

const ImageGenNode = memo(({ id, selected }: NodeProps) => {
  const { getNodes, getEdges, setNodes } = useReactFlow();
  const [prompt, setPrompt] = useState('');
  const textareaRef = useRef<HTMLTextAreaElement>(null);

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

    // Update node data
    setNodes(nodes => nodes.map(node => {
      if (node.id === id) {
        return {
          ...node,
          data: {
            ...node.data,
            prompt: newPrompt,
          },
        };
      }
      return node;
    }));

    // Focus and set cursor position after the inserted variable
    setTimeout(() => {
      textarea.focus();
      const newPosition = start + variableTag.length;
      textarea.setSelectionRange(newPosition, newPosition);
    }, 0);
  };

  const handlePromptChange = (value: string) => {
    setPrompt(value);
    setNodes(nodes => nodes.map(node => {
      if (node.id === id) {
        return {
          ...node,
          data: {
            ...node.data,
            prompt: value,
          },
        };
      }
      return node;
    }));
  };

  return (
    <div
      className={`min-w-[260px] max-w-[320px] bg-brutal-magenta border-3 border-brutal-black ${
        selected ? 'ring-4 ring-brutal-cyan' : ''
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
        <Image className="h-4 w-4" />
        <span className="font-bold uppercase text-sm">Image Gen</span>
      </div>

      {/* Content */}
      <div className="p-3 space-y-2">
        <div className="flex items-center space-x-2 text-xs text-brutal-white">
          <Wand2 className="h-3 w-3" />
          <span className="font-bold">AI Image Generation</span>
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
            Prompt Template
          </p>
          <textarea
            ref={textareaRef}
            value={prompt}
            onChange={(e) => handlePromptChange(e.target.value)}
            placeholder="A delicious {FOOD NAME} on a plate..."
            className="w-full bg-brutal-white border-2 border-brutal-black p-2 text-xs font-mono resize-none h-20"
          />
        </div>

        <div className="text-xs bg-brutal-white/90 p-2 border-2 border-brutal-black">
          <p className="font-bold uppercase text-[10px] text-brutal-black/60 mb-1">
            Model
          </p>
          <select className="w-full bg-brutal-white border-2 border-brutal-black p-1 text-xs font-bold">
            <option>FLUX.1</option>
            <option>Stable Diffusion XL</option>
            <option>DALL-E 3</option>
          </select>
        </div>

        <div className="text-[10px] text-brutal-white/70 uppercase font-bold">
          Outputs generated image
        </div>
      </div>

      {/* Output Handle */}
      <Handle
        type="source"
        position={Position.Right}
        id="image"
        className="!w-4 !h-4 !bg-brutal-black !border-2 !border-brutal-white"
        style={{ right: -8 }}
      />
    </div>
  );
});

ImageGenNode.displayName = 'ImageGenNode';

export default ImageGenNode;
