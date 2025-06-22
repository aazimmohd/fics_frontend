'use client';

import React, { useCallback, useState, useEffect, useRef, DragEvent } from 'react';
import ReactFlow, {
  Controls,
  Background,
  applyNodeChanges,
  applyEdgeChanges,
  addEdge,
  Node,
  Edge,
  OnNodesChange,
  OnEdgesChange,
  OnConnect,
  Position,
  MarkerType,
  ReactFlowProvider,
  ReactFlowInstance,
  NodeChange,
  EdgeChange,
  Connection,
} from 'reactflow';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import axios, { AxiosError } from 'axios';
import { Save, Undo, RotateCcw, Settings2, Sparkles } from "lucide-react";
import { Button } from '@/components/ui/button';
import { WorkflowNodeConfigPanel } from './workflow-node-config-panel';
import { WorkflowAIAssistantPanel } from './workflow-ai-assistant-panel';
import { NameWorkflowModal } from './name-workflow-modal';
import { useToast } from '@/hooks/use-toast';
import { nodeDefinitions, getInitialDataForNodeType, getIconForNodeType } from './node-definitions';
import IconNode from './custom-nodes/IconNode';
import type { WorkflowCreate, WorkflowUpdate, Workflow } from '@/types/workflow';


const getNodeStyle = (type: string | undefined) => {
  const baseStyle = {
    border: '1px solid hsl(var(--border))',
    borderRadius: 'var(--radius)',
    boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)',
    width: 200, // Increased width for icons
    padding: 0, // Padding will be handled by IconNode internal structure
  };

  switch (type) {
    case 'input':
    case 'input_form':
      return {
        ...baseStyle,
        background: 'hsl(var(--primary))',
        color: 'hsl(var(--primary-foreground))',
        border: '1px solid hsl(var(--primary))',
      };
    case 'output':
      return {
        ...baseStyle,
        background: 'hsl(var(--destructive))',
        color: 'hsl(var(--destructive-foreground))',
        border: '1px solid hsl(var(--destructive))',
      };
    default:
      return {
        ...baseStyle,
        background: 'hsl(var(--card))',
        color: 'hsl(var(--card-foreground))',
      };
  }
};


const defaultInitialNodes: Node[] = [
  {
    id: '1',
    type: 'input',
    data: { label: 'Start Trigger' },
    position: { x: 50, y: 150 },
    sourcePosition: Position.Right,
    style: getNodeStyle('input'),
  },
  {
    id: '2',
    type: 'default', 
    data: { label: 'Action Task' },
    position: { x: 350, y: 150 }, // Adjusted x for new width
    targetPosition: Position.Left,
    sourcePosition: Position.Right,
    style: getNodeStyle('default'),
  },
  {
    id: '3',
    type: 'output',
    data: { label: 'End Event' },
    position: { x: 650, y: 150 }, // Adjusted x for new width
    targetPosition: Position.Left,
    style: getNodeStyle('output'),
  },
];

const defaultInitialEdges: Edge[] = [
  { 
    id: 'e1-2', 
    source: '1', 
    target: '2', 
    animated: true, 
    markerEnd: { type: MarkerType.ArrowClosed, color: 'hsl(var(--primary))' },
    style: { stroke: 'hsl(var(--primary))', strokeWidth: 2 }
  },
  { 
    id: 'e2-3', 
    source: '2', 
    target: '3', 
    animated: true, 
    markerEnd: { type: MarkerType.ArrowClosed, color: 'hsl(var(--primary))' },
    style: { stroke: 'hsl(var(--primary))', strokeWidth: 2 }
  },
];

let globalNodeIdCounter = 0; 
const getDndId = () => `dndnode_${++globalNodeIdCounter}`;

// Prepare nodeTypes for React Flow
const AllNodeTypes = nodeDefinitions.reduce((acc, def) => {
  acc[def.type] = IconNode;
  return acc;
}, {} as Record<string, typeof IconNode>);
// Ensure 'input', 'output', 'default' are also mapped if not explicitly in nodeDefinitions with those exact type keys for custom rendering
if (!AllNodeTypes['input']) AllNodeTypes['input'] = IconNode;
if (!AllNodeTypes['output']) AllNodeTypes['output'] = IconNode;
if (!AllNodeTypes['default']) AllNodeTypes['default'] = IconNode;


const DndSidebar = ({ onDragStart }: { onDragStart: (event: React.DragEvent<HTMLDivElement>, nodeType: string) => void }) => (
  <aside className="w-72 p-4 border-r bg-card space-y-3 overflow-y-auto">
    <h3 className="text-lg font-semibold flex items-center">
      <Settings2 className="mr-2 h-5 w-5 text-primary" /> Nodes
    </h3>
    {nodeDefinitions.map((nodeDef) => (
      <div
        key={nodeDef.type}
        className="p-3 border rounded-lg bg-background hover:shadow-lg transition-shadow cursor-grab"
        onDragStart={(event) => onDragStart(event, nodeDef.type)}
        draggable
      >
        <nodeDef.icon className="h-5 w-5 text-primary mb-2" />
        <p className="font-medium text-sm">{nodeDef.label}</p>
        <p className="text-xs text-muted-foreground">{nodeDef.description}</p>
      </div>
    ))}
  </aside>
);

interface WorkflowBuilderProps {
  initialNodesData?: Node[];
  initialEdgesData?: Edge[];
  initialWorkflowData?: Workflow;
  onSaveSuccess?: (workflow: Workflow) => void;
}

const WorkflowBuilder: React.FC<WorkflowBuilderProps> = ({ 
  initialNodesData, 
  initialEdgesData, 
  initialWorkflowData, 
  onSaveSuccess 
}) => {
  const reactFlowWrapper = useRef<HTMLDivElement>(null);
  const [nodes, setNodes] = useState<Node[]>([]);
  const [edges, setEdges] = useState<Edge[]>([]);
  const [reactFlowInstance, setReactFlowInstance] = useState<ReactFlowInstance | null>(null);
  const [isClient, setIsClient] = useState(false);

  const [currentWorkflowId, setCurrentWorkflowId] = useState<string | null>(
    initialWorkflowData?.id || null
  );
  const [currentWorkflowName, setCurrentWorkflowName] = useState<string>(
    initialWorkflowData?.name || ""
  );

  const [history, setHistory] = useState<{ nodes: Node[], edges: Edge[] }[]>([]);
  const [historyIndex, setHistoryIndex] = useState(-1);
  const isRestoringFromHistory = useRef(false);
  
  const [selectedNodeForConfig, setSelectedNodeForConfig] = useState<Node | null>(null);
  const [isAIAssistantVisible, setIsAIAssistantVisible] = useState(false);
  const [isNameModalOpen, setIsNameModalOpen] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // --- CREATE MUTATION (for POST) ---
  const createWorkflowAPI = async (workflowData: WorkflowCreate): Promise<Workflow> => {
    const API_BASE_URL = 'http://127.0.0.1:8000/api';
    const { data } = await axios.post(`${API_BASE_URL}/workflows`, workflowData);
    return data;
  };

  const { mutate: createWorkflow, isPending: isCreating } = useMutation({
    mutationFn: createWorkflowAPI,
    onSuccess: (savedWorkflow) => {
      toast({
        title: "Workflow Created!",
        description: `"${savedWorkflow.name}" has been successfully saved.`,
      });
      queryClient.invalidateQueries({ queryKey: ['workflows'] });
      setIsNameModalOpen(false);
      // NEW: Store the ID of the newly created workflow
      setCurrentWorkflowId(savedWorkflow.id);
      setCurrentWorkflowName(savedWorkflow.name);
      if (onSaveSuccess) onSaveSuccess(savedWorkflow);
    },
    onError: (error: AxiosError) => {
      toast({
        variant: "destructive",
        title: "Error Creating Workflow",
        description: (error.response?.data as any)?.detail || "An unknown error occurred.",
      });
    },
  });

  // --- UPDATE MUTATION (for PUT) ---
  const updateWorkflowAPI = async ({ id, data }: { id: string, data: WorkflowUpdate }): Promise<Workflow> => {
    const API_BASE_URL = 'http://127.0.0.1:8000/api';
    const response = await axios.put(`${API_BASE_URL}/workflows/${id}`, data);
    return response.data;
  };

  const { mutate: updateWorkflow, isPending: isUpdating } = useMutation({
    mutationFn: updateWorkflowAPI,
    onSuccess: (savedWorkflow) => {
      toast({
        title: "Workflow Updated!",
        description: `"${savedWorkflow.name}" has been successfully updated.`,
      });
      queryClient.invalidateQueries({ queryKey: ['workflows'] });
      // Update the current workflow name in case it was changed
      setCurrentWorkflowName(savedWorkflow.name);
      if (onSaveSuccess) onSaveSuccess(savedWorkflow);
    },
    onError: (error: AxiosError) => {
      toast({
        variant: "destructive",
        title: "Error Updating Workflow",
        description: (error.response?.data as any)?.detail || "An unknown error occurred.",
      });
    },
  });

  useEffect(() => {
    setIsClient(true);
    const initialNds = (initialNodesData || []).map(node => ({
      ...node,
      style: { ...getNodeStyle(node.type), ...node.style } // Ensure consistent styling
    }));
    const initialEds = initialEdgesData || [];
    setNodes(initialNds);
    setEdges(initialEds);
    setHistory([{ nodes: initialNds, edges: initialEds }]);
    setHistoryIndex(0);
    
    let maxDndId = 0;
    initialNds.forEach(node => {
      if (node.id.startsWith('dndnode_')) {
        const num = parseInt(node.id.split('_')[1]);
        if (!isNaN(num) && num > maxDndId) {
          maxDndId = num;
        }
      }
    });
    globalNodeIdCounter = maxDndId;
  }, [initialNodesData, initialEdgesData]);


  useEffect(() => {
    if (isRestoringFromHistory.current) {
      isRestoringFromHistory.current = false;
      return;
    }
    
    if (history.length === 0 && historyIndex === -1 && (nodes.length > 0 || edges.length > 0) ) {
        const currentInitialState = { nodes, edges };
        setHistory([currentInitialState]);
        setHistoryIndex(0);
        return;
    }
    
    const currentHistoryState = history[historyIndex];
    if (currentHistoryState && 
        JSON.stringify(currentHistoryState.nodes) === JSON.stringify(nodes) && 
        JSON.stringify(currentHistoryState.edges) === JSON.stringify(edges)) {
      return;
    }
    
    const newHistorySlice = history.slice(0, historyIndex + 1);
    const newHistoryState = { nodes, edges };
    setHistory([...newHistorySlice, newHistoryState]);
    setHistoryIndex(newHistorySlice.length);
  }, [nodes, edges, history, historyIndex]);


  const onNodesChange: OnNodesChange = useCallback(
    (changes: NodeChange[]) => {
      setNodes((nds) => applyNodeChanges(changes, nds));
      const FocussedNode = changes.find(change => change.type === 'remove' && change.id === selectedNodeForConfig?.id)
      if(FocussedNode){
        setSelectedNodeForConfig(null);
      }
    },
    [setNodes, selectedNodeForConfig] 
  );

  const onEdgesChange: OnEdgesChange = useCallback(
    (changes: EdgeChange[]) => setEdges((eds) => applyEdgeChanges(changes, eds)),
    [setEdges]
  );

  const onConnect: OnConnect = useCallback(
    (connection: Connection) => setEdges((eds) => addEdge({ ...connection, animated: true, style: { stroke: 'hsl(var(--primary))', strokeWidth: 2 }, markerEnd: { type: MarkerType.ArrowClosed, color: 'hsl(var(--primary))' } }, eds)),
    [setEdges]
  );

  const onDragStart = (event: React.DragEvent<HTMLDivElement>, nodeType: string) => {
    event.dataTransfer.setData('application/reactflow-type', nodeType);
    event.dataTransfer.effectAllowed = 'move';
  };

  const onDragOver = useCallback((event: DragEvent) => {
    event.preventDefault();
    event.dataTransfer.dropEffect = 'move';
  }, []);

  const onDrop = useCallback(
    (event: DragEvent) => {
      event.preventDefault();

      if (!reactFlowInstance || !reactFlowWrapper.current) {
        return;
      }

      const reactFlowBounds = reactFlowWrapper.current.getBoundingClientRect();
      const type = event.dataTransfer.getData('application/reactflow-type');


      if (typeof type === 'undefined' || !type) {
        return;
      }

      const position = reactFlowInstance.project({
        x: event.clientX - reactFlowBounds.left,
        y: event.clientY - reactFlowBounds.top,
      });
      
      const initialNodeData = getInitialDataForNodeType(type, type);

      const newNode: Node = {
        id: getDndId(),
        type,
        position,
        data: initialNodeData,
        sourcePosition: Position.Right, 
        targetPosition: Position.Left,  
        style: getNodeStyle(type)
      };
      
      setNodes((nds) => nds.concat(newNode));
    },
    [reactFlowInstance, setNodes]
  );



  // Updated save workflow handler - opens the naming modal
  const handleSaveWorkflow = useCallback(() => {
    const nodesForApi = nodes.map(node => ({
      id: node.id,
      type: node.type,
      position: node.position,
      data: { ...node.data },
      ...node.width && { width: node.width },
      ...node.height && { height: node.height },
      ...node.sourcePosition && { sourcePosition: node.sourcePosition },
      ...node.targetPosition && { targetPosition: node.targetPosition },
    }));

    const edgesForApi = edges.map(edge => ({
      id: edge.id,
      source: edge.source,
      target: edge.target,
      animated: edge.animated,
      markerEnd: edge.markerEnd,
      style: edge.style,
    }));

    const definition = { nodes: nodesForApi, edges: edgesForApi };

    if (currentWorkflowId) {
      // If we have an ID, it's an update - save immediately
      const workflowPayload: WorkflowUpdate = {
        name: currentWorkflowName, // Keep current name unless user wants to change it
        definition: definition,
      };
      updateWorkflow({ id: currentWorkflowId, data: workflowPayload });
    } else {
      // If there's no ID, it's a new workflow - prompt for a name
      setIsNameModalOpen(true);
    }
  }, [nodes, edges, currentWorkflowId, currentWorkflowName, updateWorkflow]);

  // Function called when user submits the workflow name
  const handleNameAndSave = useCallback((name: string) => {
    const nodesForApi = nodes.map(node => ({
      id: node.id,
      type: node.type,
      position: node.position,
      data: { ...node.data },
      ...node.width && { width: node.width },
      ...node.height && { height: node.height },
      ...node.sourcePosition && { sourcePosition: node.sourcePosition },
      ...node.targetPosition && { targetPosition: node.targetPosition },
    }));

    const edgesForApi = edges.map(edge => ({
      id: edge.id,
      source: edge.source,
      target: edge.target,
      animated: edge.animated,
      markerEnd: edge.markerEnd,
      style: edge.style,
    }));

    const definition = { nodes: nodesForApi, edges: edgesForApi };

    const workflowPayload: WorkflowCreate = {
      name: name,
      definition: definition,
    };
    createWorkflow(workflowPayload);
  }, [nodes, edges, createWorkflow]);

  const handleUndo = useCallback(() => {
    if (historyIndex > 0) {
      isRestoringFromHistory.current = true;
      const prevIndex = historyIndex - 1;
      const prevState = history[prevIndex];
      setNodes(prevState.nodes);
      setEdges(prevState.edges);
      setHistoryIndex(prevIndex);
      setSelectedNodeForConfig(null);
      toast({ title: "Undo Successful", description: "Reverted to the previous state." });
    } else {
       toast({ title: "Cannot Undo", description: "No previous actions to undo.", variant: "destructive" });
    }
  }, [history, historyIndex, toast]);

  const handleResetWorkflow = useCallback(() => {
    const confirmReset = window.confirm("Are you sure you want to reset the workflow to its initial state? This cannot be undone.");
    if (confirmReset) {
      isRestoringFromHistory.current = true;
      const initialNds = (initialNodesData || []).map(node => ({
        ...node,
        style: { ...getNodeStyle(node.type), ...node.style }
      }));
      const initialEds = initialEdgesData || [];
      
      setNodes(initialNds);
      setEdges(initialEds);
      
      setHistory([{ nodes: initialNds, edges: initialEds }]);
      setHistoryIndex(0);
      globalNodeIdCounter = 0;
      initialNds.forEach(node => {
        if (node.id.startsWith('dndnode_')) {
          const num = parseInt(node.id.split('_')[1]);
          if (!isNaN(num) && num > globalNodeIdCounter) {
            globalNodeIdCounter = num;
          }
        }
      });
      setSelectedNodeForConfig(null);
      setIsAIAssistantVisible(false);
      toast({ title: "Workflow Reset", description: "Workflow has been reset to its initial state." });
    }
  }, [initialNodesData, initialEdgesData, toast]);

  const onNodeClick = useCallback((event: React.MouseEvent, node: Node) => {
    setSelectedNodeForConfig(node);
    setIsAIAssistantVisible(false); 
  }, []);

  const handleCloseConfigPanel = useCallback(() => {
    setSelectedNodeForConfig(null);
  }, []);

  const handleUpdateNodeData = useCallback((nodeId: string, newData: Partial<Node['data']>) => {
    setNodes((prevNodes) =>
      prevNodes.map((n) =>
        n.id === nodeId
          ? { ...n, data: { ...n.data, ...newData } }
          : n
      )
    );
    setSelectedNodeForConfig(prevNode => 
      prevNode && prevNode.id === nodeId 
        ? { ...prevNode, data: { ...prevNode.data, ...newData } } 
        : prevNode
    );
    toast({ title: "Node Updated", description: `Configuration for node '${newData.label || nodeId}' applied.` });
  }, [setNodes, toast]);

  const onPaneClick = useCallback(() => {
    setSelectedNodeForConfig(null);
  }, []);

  const toggleAIAssistant = () => {
    setIsAIAssistantVisible(prev => !prev);
    setSelectedNodeForConfig(null); 
  };
  
 const handleApplyAIChanges = (newNodesFromAI: Node[], newEdgesFromAI: Edge[], explanation: string) => {
    isRestoringFromHistory.current = true; 

    const processedNodes = newNodesFromAI.map(node => ({
      ...node,
      style: { ...getNodeStyle(node.type), ...(node.style || {}) } 
    }));

    setNodes(processedNodes);
    setEdges(newEdgesFromAI);
    
    const newHistoryState = { nodes: processedNodes, edges: newEdgesFromAI };
    setHistory(prevHistory => {
      const newSlice = prevHistory.slice(0, historyIndex + 1);
      return [...newSlice, newHistoryState];
    });
    setHistoryIndex(prevIndex => prevIndex + 1);


    toast({
      title: "AI Changes Applied",
      description: explanation,
    });
  };
  
  if (!isClient) {
    return (
      <div className="h-[calc(100vh-200px)] min-h-[600px] w-full flex items-center justify-center border-2 border-dashed rounded-lg border-border p-8">
        <p className="text-muted-foreground">Loading Workflow Builder...</p>
      </div>
    );
  }

  console.log("WorkflowBuilder is rendering. The current value of isNameModalOpen is:", isNameModalOpen);

  return (
    <div className="flex h-[calc(100vh-200px)] min-h-[600px] w-full rounded-lg overflow-hidden border shadow-inner bg-background">
      <ReactFlowProvider>
        <DndSidebar onDragStart={onDragStart} />
        <div className="flex-grow h-full flex flex-col" ref={reactFlowWrapper}>
          <div className="p-2 border-b border-l border-border flex items-center justify-end gap-2 bg-card">
            <Button variant="outline" size="sm" onClick={toggleAIAssistant} className="rounded-lg">
              <Sparkles className="mr-2 h-4 w-4" /> AI Assistant
            </Button>
            <Button variant="outline" size="sm" onClick={handleUndo} disabled={historyIndex <= 0} className="rounded-lg">
              <Undo className="mr-2 h-4 w-4" /> Undo
            </Button>
            <Button variant="outline" size="sm" onClick={handleResetWorkflow} className="rounded-lg">
              <RotateCcw className="mr-2 h-4 w-4" /> Reset
            </Button>
            <Button size="sm" onClick={handleSaveWorkflow} className="rounded-lg bg-primary text-primary-foreground hover:bg-primary/90">
              <Save className="mr-2 h-4 w-4" /> {currentWorkflowId ? 'Update Workflow' : 'Save Workflow'}
            </Button>
          </div>
          <div className="flex-grow relative border-l border-border">
              <ReactFlow
                nodes={nodes}
                edges={edges}
                onNodesChange={onNodesChange}
                onEdgesChange={onEdgesChange}
                onConnect={onConnect}
                onInit={setReactFlowInstance}
                onDrop={onDrop}
                onDragOver={onDragOver}
                onNodeClick={onNodeClick}
                onPaneClick={onPaneClick}
                fitView
                nodeTypes={AllNodeTypes} // Use custom node types
                className="bg-background"
                proOptions={{ hideAttribution: true }}
              >
                <Controls className="[&_button]:bg-card [&_button]:border-border [&_button:hover]:bg-accent [&_svg]:fill-foreground" />
                <Background gap={16} size={1} color="hsl(var(--border))" />
              </ReactFlow>
            </div>
        </div>
        {selectedNodeForConfig && !isAIAssistantVisible && (
          <WorkflowNodeConfigPanel
            node={selectedNodeForConfig}
            onClose={handleCloseConfigPanel}
            onUpdateNodeData={handleUpdateNodeData}
          />
        )}
        <WorkflowAIAssistantPanel
          currentNodes={nodes}
          currentEdges={edges}
          onClose={() => setIsAIAssistantVisible(false)}
          onApplyAIChanges={handleApplyAIChanges}
          isVisible={isAIAssistantVisible}
        />
        <NameWorkflowModal
          isOpen={isNameModalOpen}
          onClose={() => setIsNameModalOpen(false)}
          onSave={handleNameAndSave}
          isLoading={isCreating || isUpdating}
        />
      </ReactFlowProvider>
    </div>
  );
};

export default WorkflowBuilder;
