"use client";

import { useState, useEffect, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import axios, { AxiosError } from 'axios';

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { PlusCircle, Edit3, Trash2, PlayCircle, ListTree, Sparkles, Network, ArrowLeft, Loader2 } from "lucide-react";
import { useToast } from '@/hooks/use-toast';
import { ConfirmDeleteDialog } from '@/components/shared/confirm-delete-dialog';
import WorkflowBuilder from '@/components/workflows/workflow-builder';
import type { Node, Edge } from 'reactflow';
import { Position } from 'reactflow';

// Define the shape of a single workflow from our API
interface Workflow {
  id: string; // FastAPI sends UUID as string
  name: string;
  status: 'Active' | 'Paused' | 'Draft'; // Match the backend Enum
  is_template: boolean;
  created_at: string; // FastAPI sends datetime as ISO string
  updated_at: string; // FastAPI sends datetime as ISO string
  definition: { nodes: Node[]; edges: Edge[] }; // Definition is now always included
}

type ViewMode = 'list' | 'builder';
interface InitialWorkflowData {
  nodes: Node[];
  edges: Edge[];
}

// This is the function that will fetch the data from the FastAPI application
const getWorkflows = async (): Promise<Workflow[]> => {
  const API_BASE_URL = 'http://127.0.0.1:8000/api'; // Local FastAPI application
  const response = await axios.get(`${API_BASE_URL}/workflows`);
  return response.data;
};

// Function to fetch a single workflow by ID
const getWorkflowById = async (id: string): Promise<Workflow> => {
  const API_BASE_URL = 'http://127.0.0.1:8000/api';
  const response = await axios.get(`${API_BASE_URL}/workflows/${id}`);
  return response.data;
};

// NEW: API function for deleting a workflow
const deleteWorkflowAPI = async (workflowId: string): Promise<void> => {
  const API_BASE_URL = 'http://127.0.0.1:8000/api';
  await axios.delete(`${API_BASE_URL}/workflows/${workflowId}`);
};

function WorkflowsPageContent() {
  const [viewMode, setViewMode] = useState<ViewMode>('list');
  const [initialWorkflowForBuilder, setInitialWorkflowForBuilder] = useState<InitialWorkflowData | null>(null);
  const [currentWorkflowForEditing, setCurrentWorkflowForEditing] = useState<Workflow | null>(null);
  
  // NEW: State to manage the confirmation dialog
  const [workflowToDelete, setWorkflowToDelete] = useState<Workflow | null>(null);
  
  const searchParams = useSearchParams();
  const router = useRouter();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Extract the specific search parameter value outside useEffect
  const fromAIParam = searchParams.get('fromAI');

  // --- React Query Implementation ---
  const { data: workflows, isLoading, isError, error } = useQuery<Workflow[], Error>({
    queryKey: ['workflows'], // A unique key for this query
    queryFn: getWorkflows, // The function that fetches the data
  });

  // NEW: Mutation for deleting a workflow
  const { mutate: deleteWorkflow, isPending: isDeleting } = useMutation({
    mutationFn: deleteWorkflowAPI,
    onSuccess: () => {
      toast({ 
        title: "Workflow Deleted", 
        description: `"${workflowToDelete?.name}" was successfully deleted.` 
      });
      queryClient.invalidateQueries({ queryKey: ['workflows'] }); // Refetch the list
      setWorkflowToDelete(null); // Close the dialog
    },
    onError: (error: AxiosError) => {
      toast({ 
        variant: "destructive", 
        title: "Error Deleting Workflow", 
        description: (error.response?.data as any)?.detail || "An unknown error occurred." 
      });
      setWorkflowToDelete(null); // Close the dialog on error too
    },
  });

  useEffect(() => {
    // Use the extracted 'fromAIParam'
    if (fromAIParam === 'true') {
      const workflowJsonString = sessionStorage.getItem('aiGeneratedWorkflow');
      if (workflowJsonString) {
        try {
          const parsedWorkflowData = JSON.parse(workflowJsonString);
          if (parsedWorkflowData && Array.isArray(parsedWorkflowData.nodes) && Array.isArray(parsedWorkflowData.edges)) {
            
            const styledNodes = parsedWorkflowData.nodes.map((node: any) => ({
              ...node,
              position: node.position || { x: Math.random() * 400, y: Math.random() * 400 }, 
              data: node.data || { label: 'Untitled Node' }, 
              sourcePosition: node.sourcePosition || Position.Right,
              targetPosition: node.targetPosition || Position.Left,
              style: {
                background: 'hsl(var(--card))',
                border: '1px solid hsl(var(--border))',
                borderRadius: 'var(--radius)',
                boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)',
                width: 150,
                ...(node.style || {}),
                ...(node.type === 'input' && {
                  background: 'hsl(var(--primary))',
                  color: 'hsl(var(--primary-foreground))',
                  border: '1px solid hsl(var(--primary))',
                }),
                ...(node.type === 'output' && {
                  background: 'hsl(var(--destructive))',
                  color: 'hsl(var(--destructive-foreground))',
                  border: '1px solid hsl(var(--destructive))',
                }),
              }
            }));

            setInitialWorkflowForBuilder({ nodes: styledNodes, edges: parsedWorkflowData.edges });
            setViewMode('builder');
          } else {
            console.error("Invalid workflow structure from AI: nodes or edges are not arrays or missing.");
          }
        } catch (e) {
          console.error("Failed to parse AI generated workflow JSON:", e);
        } finally {
          sessionStorage.removeItem('aiGeneratedWorkflow');
          router.replace('/workflows');
        }
      } else {
        // If fromAI is true but no workflow in session storage, still clear the param from URL
        router.replace('/workflows');
      }
    }
  }, [fromAIParam, router]); 

  const handleBackToList = () => {
    setViewMode('list');
    setInitialWorkflowForBuilder(null);
    setCurrentWorkflowForEditing(null);
  };

  // Function to handle editing an existing workflow
  const handleEditWorkflow = async (workflowId: string) => {
    try {
      const workflow = await getWorkflowById(workflowId);
      setCurrentWorkflowForEditing(workflow);
      
      // Set up initial data for the builder
      setInitialWorkflowForBuilder({
        nodes: workflow.definition.nodes || [],
        edges: workflow.definition.edges || []
      });
      
      setViewMode('builder');
    } catch (error) {
      console.error('Error loading workflow for editing:', error);
      toast({
        variant: "destructive",
        title: "Error Loading Workflow",
        description: "Failed to load workflow for editing. Please try again.",
      });
    }
  };

  if (viewMode === 'builder') {
    return (
      <div className="space-y-8">
        <div className="flex items-center justify-between">
           <Button variant="outline" onClick={handleBackToList} className="rounded-lg">
            <ArrowLeft className="mr-2 h-5 w-5" />
            Back to Workflows
          </Button>
          <h1 className="text-3xl font-bold tracking-tight font-headline">Workflow Builder</h1>
        </div>
        <Card className="shadow-lg rounded-lg">
          <CardHeader>
            <CardTitle>Design Your Process</CardTitle>
            <CardDescription>
              Visually design your processes. Drag nodes from the left panel onto the canvas, connect them, and configure their actions to build your custom workflows.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <WorkflowBuilder 
              initialNodesData={initialWorkflowForBuilder?.nodes}
              initialEdgesData={initialWorkflowForBuilder?.edges}
              initialWorkflowData={currentWorkflowForEditing || undefined}
              onSaveSuccess={(workflow) => {
                console.log('Workflow saved successfully:', workflow);
                // Optionally go back to list view after save
                // handleBackToList();
              }}
            />
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold tracking-tight font-headline">Workflows</h1>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button className="rounded-lg">
              <PlusCircle className="mr-2 h-5 w-5" />
              Create New Workflow
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56 rounded-lg">
            <Link href="/ai-generator" passHref legacyBehavior>
              <DropdownMenuItem className="rounded-lg">
                <Sparkles className="mr-2 h-4 w-4" />
                Create with AI
              </DropdownMenuItem>
            </Link>
            <DropdownMenuItem onClick={() => { setInitialWorkflowForBuilder(null); setViewMode('builder');}} className="rounded-lg">
              <Network className="mr-2 h-4 w-4" />
              Start from Scratch
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
      
      <div className="space-y-4">
        <h2 className="text-2xl font-semibold font-headline">Existing Workflows</h2>
        
        {/* --- Handle Loading and Error States --- */}
        {isLoading && (
          <div className="flex justify-center items-center py-16">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            <p className="ml-4 text-muted-foreground">Loading workflows...</p>
          </div>
        )}

        {isError && (
          <Card className="shadow-md rounded-lg border-destructive">
            <CardContent className="pt-6">
              <p className="text-destructive text-center py-8">
                Error loading workflows: {error?.message || 'Unknown error occurred'}
              </p>
            </CardContent>
          </Card>
        )}

        {/* --- Display Data When Loaded Successfully --- */}
        {workflows && workflows.length > 0 && (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {workflows.map((workflow) => (
              <Card key={workflow.id} className="shadow-lg rounded-lg">
                <CardHeader>
                  <CardTitle>{workflow.name}</CardTitle>
                  <CardDescription>
                    Status: <span className={workflow.status === 'Active' ? 'font-semibold text-primary' : 'italic text-muted-foreground'}>{workflow.status}</span>
                    {workflow.updated_at && ` | Updated: ${new Date(workflow.updated_at).toLocaleDateString()}`}
                  </CardDescription>
                </CardHeader>
                <CardFooter className="flex justify-end gap-2">
                  <Button variant="outline" size="sm" className="rounded-lg"><PlayCircle className="mr-1 h-4 w-4" /> Run</Button>
                  <Button variant="outline" size="sm" className="rounded-lg"><ListTree className="mr-1 h-4 w-4" /> Logs</Button>
                  <Button variant="outline" size="sm" className="rounded-lg" onClick={() => handleEditWorkflow(workflow.id)}>
                    <Edit3 className="mr-1 h-4 w-4" /> Edit
                  </Button>
                  <Button 
                    variant="destructive" 
                    size="sm" 
                    className="rounded-lg" 
                    onClick={() => setWorkflowToDelete(workflow)}
                    disabled={isDeleting}
                  >
                    <Trash2 className="mr-1 h-4 w-4" /> Delete
                  </Button>
                </CardFooter>
              </Card>
            ))}
          </div>
        )}

        {workflows && workflows.length === 0 && (
          <Card className="shadow-md rounded-lg">
            <CardContent className="pt-6">
              <p className="text-muted-foreground text-center py-8">
                No workflows found. Click "Create New Workflow" to get started.
              </p>
            </CardContent>
          </Card>
        )}
      </div>

      {/* NEW: Render the confirmation dialog */}
      <ConfirmDeleteDialog
        isOpen={!!workflowToDelete}
        onClose={() => setWorkflowToDelete(null)}
        onConfirm={() => {
          if (workflowToDelete) {
            deleteWorkflow(workflowToDelete.id);
          }
        }}
        title={`Delete "${workflowToDelete?.name}"?`}
        description="This will permanently delete the workflow and all its associated data. This action cannot be undone."
      />
    </div>
  );
}

export default function WorkflowsPage() {
  return (
    <Suspense fallback={<div className="flex justify-center items-center py-16"><Loader2 className="h-8 w-8 animate-spin" /></div>}>
      <WorkflowsPageContent />
    </Suspense>
  );
}

