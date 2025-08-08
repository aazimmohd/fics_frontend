"use client";

import { useState, useEffect, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import axios, { AxiosError } from 'axios';

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { PlusCircle, Edit3, Trash2, PlayCircle, ListTree, Sparkles, Network, ArrowLeft, Loader2, Search, Filter, Grid3X3, List, MoreVertical, Clock, Calendar, Activity, Zap, Users, Eye, Copy, Archive } from "lucide-react";
import { useToast } from '@/hooks/use-toast';
import { ConfirmDeleteDialog } from '@/components/shared/confirm-delete-dialog';
import WorkflowBuilder from '@/components/workflows/workflow-builder';
import type { Node, Edge } from 'reactflow';
import { Position } from 'reactflow';

// Define the shape of a single workflow from our API
interface Workflow {
  id: string; // FastAPI sends UUID as string
  name: string;
  status: 'Active' | 'Paused' | 'Draft'; // Keep Draft for existing workflows in database
  is_template: boolean;
  created_at: string; // FastAPI sends datetime as ISO string
  updated_at: string; // FastAPI sends datetime as ISO string
  definition: { nodes: Node[]; edges: Edge[] }; // Definition is now always included
}

type ViewMode = 'list' | 'builder' | 'grid';
interface InitialWorkflowData {
  nodes: Node[];
  edges: Edge[];
}

// This is the function that will fetch the data from the FastAPI application
const getWorkflows = async (): Promise<Workflow[]> => {
  const { api } = await import('@/lib/api');
  return await api.get('/workflows');
};

// Function to fetch a single workflow by ID
const getWorkflowById = async (id: string): Promise<Workflow> => {
  const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api';
  const response = await axios.get(`${API_BASE_URL}/workflows/${id}`, {
    headers: {
      'Authorization': `Bearer ${localStorage.getItem('access_token')}`,
    },
  });
  return response.data;
};

// NEW: API function for deleting a workflow
const deleteWorkflowAPI = async (workflowId: string): Promise<void> => {
  const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api';
  await axios.delete(`${API_BASE_URL}/workflows/${workflowId}`, {
    headers: {
      'Authorization': `Bearer ${localStorage.getItem('access_token')}`,
    },
  });
};

// Status badge component with enhanced styling
const StatusBadge = ({ status }: { status: Workflow['status'] }) => {
  const statusConfig = {
    Active: { variant: 'default' as const, icon: Activity, className: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
    Paused: { variant: 'secondary' as const, icon: Clock, className: 'bg-amber-50 text-amber-700 border-amber-200' },
    Draft: { variant: 'outline' as const, icon: Edit3, className: 'bg-slate-50 text-slate-600 border-slate-200' }, // Fallback for existing Draft workflows
  };

  const config = statusConfig[status] || statusConfig.Draft; // Fallback to Draft if status not found
  const Icon = config.icon;

  return (
    <Badge variant={config.variant} className={`${config.className} gap-1.5 px-3 py-1.5 text-xs font-medium`}>
      <Icon className="h-3 w-3" />
      {status}
    </Badge>
  );
};

// Enhanced workflow card component
const WorkflowCard = ({ 
  workflow, 
  onEdit, 
  onDelete, 
  onViewLogs,
  viewMode 
}: { 
  workflow: Workflow; 
  onEdit: (id: string) => void; 
  onDelete: (workflow: Workflow) => void; 
  onViewLogs: (id: string) => void;
  viewMode: 'grid' | 'list';
}) => {
  const [isHovered, setIsHovered] = useState(false);

  if (viewMode === 'list') {
    return (
      <Card 
        className="group transition-all duration-200 hover:shadow-lg hover:border-primary/20 cursor-pointer"
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
      >
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4 flex-1">
              <div className="flex-shrink-0">
                <div className="w-12 h-12 bg-gradient-to-br from-primary/10 to-primary/20 rounded-xl flex items-center justify-center">
                  <Network className="h-6 w-6 text-primary" />
                </div>
              </div>
              
              <div className="flex-1 min-w-0">
                <div className="flex items-center space-x-3 mb-2">
                  <h3 className="text-lg font-semibold text-gray-900 truncate">{workflow.name}</h3>
                  <StatusBadge status={workflow.status} />
                </div>
                
                <div className="flex items-center space-x-4 text-sm text-gray-500">
                  <div className="flex items-center space-x-1">
                    <Calendar className="h-4 w-4" />
                    <span>Updated {new Date(workflow.updated_at).toLocaleDateString()}</span>
                  </div>
                  <div className="flex items-center space-x-1">
                    <Users className="h-4 w-4" />
                    <span>{workflow.definition.nodes.length} nodes</span>
                  </div>
                </div>
              </div>
            </div>

                         <div className="flex items-center space-x-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
               <Button variant="ghost" size="sm" onClick={() => onViewLogs(workflow.id)} className="h-8 w-8 p-0">
                 <ListTree className="h-4 w-4" />
               </Button>
               <Button variant="ghost" size="sm" onClick={() => onEdit(workflow.id)} className="h-8 w-8 p-0">
                 <Edit3 className="h-4 w-4" />
               </Button>
               <DropdownMenu>
                 <DropdownMenuTrigger asChild>
                   <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                     <MoreVertical className="h-4 w-4" />
                   </Button>
                 </DropdownMenuTrigger>
                 <DropdownMenuContent align="end" className="w-48">
                   <DropdownMenuItem onClick={() => onViewLogs(workflow.id)}>
                     <ListTree className="mr-2 h-4 w-4" />
                     View Logs
                   </DropdownMenuItem>
                   <DropdownMenuItem onClick={() => onEdit(workflow.id)}>
                     <Edit3 className="mr-2 h-4 w-4" />
                     Edit Workflow
                   </DropdownMenuItem>
                   <DropdownMenuItem>
                     <Copy className="mr-2 h-4 w-4" />
                     Duplicate
                   </DropdownMenuItem>
                   <DropdownMenuItem>
                     <Archive className="mr-2 h-4 w-4" />
                     Archive
                   </DropdownMenuItem>
                   <DropdownMenuItem 
                     onClick={() => onDelete(workflow)}
                     className="text-red-600 focus:text-red-600"
                   >
                     <Trash2 className="mr-2 h-4 w-4" />
                     Delete
                   </DropdownMenuItem>
                 </DropdownMenuContent>
               </DropdownMenu>
             </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Grid view
  return (
    <Card 
      className="group transition-all duration-200 hover:shadow-xl hover:scale-[1.02] hover:border-primary/30 cursor-pointer relative overflow-hidden"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Gradient overlay on hover */}
      <div className={`absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300`} />
      
      <CardHeader className="relative">
        <div className="flex items-start justify-between mb-3">
          <div className="w-12 h-12 bg-gradient-to-br from-primary/10 to-primary/20 rounded-xl flex items-center justify-center">
            <Network className="h-6 w-6 text-primary" />
          </div>
          <StatusBadge status={workflow.status} />
        </div>
        
        <CardTitle className="text-lg font-semibold text-gray-900 mb-2 line-clamp-2">
          {workflow.name}
        </CardTitle>
        
        <CardDescription className="text-sm text-gray-600">
          <div className="flex items-center space-x-1 mb-1">
            <Calendar className="h-3 w-3" />
            <span>Updated {new Date(workflow.updated_at).toLocaleDateString()}</span>
          </div>
          <div className="flex items-center space-x-1">
            <Users className="h-3 w-3" />
            <span>{workflow.definition.nodes.length} nodes</span>
          </div>
        </CardDescription>
      </CardHeader>

      <CardFooter className="relative">
                 <div className="flex items-center justify-between w-full">
           <div className="flex items-center space-x-1">
             <Users className="h-4 w-4 text-blue-500" />
             <span className="text-xs text-gray-500">{workflow.definition.nodes.length} nodes</span>
           </div>
          
                     <div className={`flex items-center space-x-1 transition-all duration-200 ${isHovered ? 'opacity-100' : 'opacity-0'}`}>
             <Button variant="ghost" size="sm" onClick={() => onEdit(workflow.id)} className="h-8 w-8 p-0">
               <Edit3 className="h-4 w-4" />
             </Button>
             <DropdownMenu>
               <DropdownMenuTrigger asChild>
                 <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                   <MoreVertical className="h-4 w-4" />
                 </Button>
               </DropdownMenuTrigger>
               <DropdownMenuContent align="end" className="w-48">
                 <DropdownMenuItem onClick={() => onViewLogs(workflow.id)}>
                   <ListTree className="mr-2 h-4 w-4" />
                   View Logs
                 </DropdownMenuItem>
                 <DropdownMenuItem onClick={() => onEdit(workflow.id)}>
                   <Edit3 className="mr-2 h-4 w-4" />
                   Edit Workflow
                 </DropdownMenuItem>
                 <DropdownMenuItem>
                   <Copy className="mr-2 h-4 w-4" />
                   Duplicate
                 </DropdownMenuItem>
                 <DropdownMenuItem>
                   <Archive className="mr-2 h-4 w-4" />
                   Archive
                 </DropdownMenuItem>
                 <DropdownMenuItem 
                   onClick={() => onDelete(workflow)}
                   className="text-red-600 focus:text-red-600"
                 >
                   <Trash2 className="mr-2 h-4 w-4" />
                   Delete
                 </DropdownMenuItem>
               </DropdownMenuContent>
             </DropdownMenu>
           </div>
        </div>
      </CardFooter>
    </Card>
  );
};

function WorkflowsPageContent() {
  const [viewMode, setViewMode] = useState<ViewMode>('grid');
  const [initialWorkflowForBuilder, setInitialWorkflowForBuilder] = useState<InitialWorkflowData | null>(null);
  const [currentWorkflowForEditing, setCurrentWorkflowForEditing] = useState<Workflow | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'Active' | 'Paused' | 'Draft' | 'all'>('all');
  
  // NEW: State to manage the confirmation dialog
  const [workflowToDelete, setWorkflowToDelete] = useState<Workflow | null>(null);
  
  const searchParams = useSearchParams();
  const router = useRouter();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Extract the specific search parameter value outside useEffect
  const fromAIParam = searchParams.get('fromAI');
  const workflowIdParam = searchParams.get('workflowId');

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

  // Filter workflows based on search and status
  const filteredWorkflows = workflows?.filter(workflow => {
    const matchesSearch = workflow.name.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === 'all' || workflow.status === statusFilter;
    return matchesSearch && matchesStatus;
  }) || [];

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

  // Handle workflowId from query parameter (for notification navigation)
  useEffect(() => {
    if (workflowIdParam && workflows) {
      const workflow = workflows.find(w => w.id === workflowIdParam);
      if (workflow) {
        handleEditWorkflow(workflowIdParam);
        // Remove the query parameter from URL
        const url = new URL(window.location.href);
        url.searchParams.delete('workflowId');
        window.history.replaceState({}, '', url.toString());
      }
    }
  }, [workflowIdParam, workflows]);

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



  const handleViewLogs = (workflowId: string) => {
    router.push(`/trigger-runs/${workflowId}`);
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
      {/* Enhanced Header Section */}
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-4xl font-bold tracking-tight text-gray-900 mb-2">Workflows</h1>
            <p className="text-lg text-gray-600">Design, manage, and execute your automated processes</p>
          </div>
          
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button size="lg" className="rounded-xl shadow-lg hover:shadow-xl transition-shadow duration-200">
                <PlusCircle className="mr-2 h-5 w-5" />
                Create New Workflow
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56 rounded-xl">
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

        {/* Enhanced Search and Filter Section */}
        <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
          <div className="flex items-center space-x-4 flex-1 max-w-md">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search workflows..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary/20 focus:border-primary transition-colors duration-200"
              />
            </div>
            
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" className="rounded-xl">
                  <Filter className="mr-2 h-4 w-4" />
                  {statusFilter === 'all' ? 'All Status' : statusFilter}
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start" className="w-48 rounded-xl">
                <DropdownMenuItem onClick={() => setStatusFilter('all')}>
                  All Status
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setStatusFilter('Active')}>
                  <StatusBadge status="Active" />
                </DropdownMenuItem>
                                 <DropdownMenuItem onClick={() => setStatusFilter('Paused')}>
                   <StatusBadge status="Paused" />
                 </DropdownMenuItem>
                 <DropdownMenuItem onClick={() => setStatusFilter('Draft')}>
                   <StatusBadge status="Draft" />
                 </DropdownMenuItem>
               </DropdownMenuContent>
            </DropdownMenu>
          </div>

          <div className="flex items-center space-x-2">
            <Button
              variant={viewMode === 'grid' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setViewMode('grid')}
              className="rounded-lg"
            >
              <Grid3X3 className="h-4 w-4" />
            </Button>
            <Button
              variant={viewMode === 'list' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setViewMode('list')}
              className="rounded-lg"
            >
              <List className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>
      
      {/* Enhanced Content Section */}
      <div className="space-y-6">
        {/* Stats Section */}
        {workflows && workflows.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Card className="bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-blue-700">Total Workflows</p>
                    <p className="text-2xl font-bold text-blue-900">{workflows.length}</p>
                  </div>
                  <Network className="h-8 w-8 text-blue-600" />
                </div>
              </CardContent>
            </Card>
            
            <Card className="bg-gradient-to-br from-emerald-50 to-emerald-100 border-emerald-200">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-emerald-700">Active</p>
                    <p className="text-2xl font-bold text-emerald-900">
                      {workflows.filter(w => w.status === 'Active').length}
                    </p>
                  </div>
                  <Activity className="h-8 w-8 text-emerald-600" />
                </div>
              </CardContent>
            </Card>
            
            <Card className="bg-gradient-to-br from-amber-50 to-amber-100 border-amber-200">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-amber-700">Paused</p>
                    <p className="text-2xl font-bold text-amber-900">
                      {workflows.filter(w => w.status === 'Paused').length}
                    </p>
                  </div>
                  <Clock className="h-8 w-8 text-amber-600" />
                </div>
              </CardContent>
            </Card>
            
            <Card className="bg-gradient-to-br from-slate-50 to-slate-100 border-slate-200">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-slate-700">Drafts</p>
                                         <p className="text-2xl font-bold text-slate-900">
                       {workflows.filter(w => w.status === 'Draft').length}
                     </p>
                  </div>
                  <Edit3 className="h-8 w-8 text-slate-600" />
                </div>
              </CardContent>
            </Card>
          </div>
        )}
        
        {/* --- Handle Loading and Error States --- */}
        {isLoading && (
          <div className="flex flex-col justify-center items-center py-16 space-y-4">
            <div className="relative">
              <Loader2 className="h-12 w-12 animate-spin text-primary" />
              <div className="absolute inset-0 rounded-full border-4 border-primary/20"></div>
            </div>
            <p className="text-lg text-gray-600 font-medium">Loading your workflows...</p>
            <p className="text-sm text-gray-500">This won't take long</p>
          </div>
        )}

        {isError && (
          <Card className="shadow-lg rounded-xl border-red-200 bg-red-50">
            <CardContent className="pt-6">
              <div className="text-center py-8">
                <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Activity className="h-8 w-8 text-red-600" />
                </div>
                <h3 className="text-lg font-semibold text-red-900 mb-2">Error Loading Workflows</h3>
                <p className="text-red-700 mb-4">{error?.message || 'An unknown error occurred'}</p>
                <Button variant="outline" onClick={() => window.location.reload()}>
                  Try Again
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* --- Display Data When Loaded Successfully --- */}
        {filteredWorkflows.length > 0 && (
          <div className={viewMode === 'list' ? 'space-y-4' : 'grid gap-6 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4'}>
            {filteredWorkflows.map((workflow) => (
                             <WorkflowCard
                 key={workflow.id}
                 workflow={workflow}
                 onEdit={handleEditWorkflow}
                 onDelete={setWorkflowToDelete}
                 onViewLogs={handleViewLogs}
                 viewMode={viewMode}
               />
            ))}
          </div>
        )}

        {filteredWorkflows.length === 0 && workflows && workflows.length > 0 && (
          <Card className="shadow-lg rounded-xl border-gray-200 bg-gray-50">
            <CardContent className="pt-6">
              <div className="text-center py-12">
                <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Search className="h-8 w-8 text-gray-600" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">No workflows found</h3>
                <p className="text-gray-600 mb-4">Try adjusting your search or filter criteria</p>
                <Button variant="outline" onClick={() => { setSearchQuery(''); setStatusFilter('all'); }}>
                  Clear Filters
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {workflows && workflows.length === 0 && (
          <Card className="shadow-lg rounded-xl border-gray-200 bg-gradient-to-br from-gray-50 to-gray-100">
            <CardContent className="pt-6">
              <div className="text-center py-16">
                <div className="w-20 h-20 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-6">
                  <Network className="h-10 w-10 text-primary" />
                </div>
                <h3 className="text-2xl font-bold text-gray-900 mb-3">Create Your First Workflow</h3>
                <p className="text-gray-600 mb-6 max-w-md mx-auto">
                  Start automating your processes by creating your first workflow. You can build from scratch or use AI to generate one for you.
                </p>
                <div className="flex flex-col sm:flex-row gap-3 justify-center">
                  <Button size="lg" className="rounded-xl">
                    <PlusCircle className="mr-2 h-5 w-5" />
                    Create New Workflow
                  </Button>
                  <Link href="/ai-generator">
                    <Button variant="outline" size="lg" className="rounded-xl">
                      <Sparkles className="mr-2 h-5 w-5" />
                      Generate with AI
                    </Button>
                  </Link>
                </div>
              </div>
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
    <Suspense fallback={
      <div className="flex flex-col justify-center items-center py-16 space-y-4">
        <div className="relative">
          <Loader2 className="h-12 w-12 animate-spin text-primary" />
          <div className="absolute inset-0 rounded-full border-4 border-primary/20"></div>
        </div>
        <p className="text-lg text-gray-600 font-medium">Loading...</p>
      </div>
    }>
      <WorkflowsPageContent />
    </Suspense>
  );
}

