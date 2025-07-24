'use client';

import React, { useMemo, useState } from "react";
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import axios, { AxiosError } from 'axios';
import { LayoutGrid, List, Filter, CalendarDays, MoreHorizontal, User } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
  useDroppable,
} from '@dnd-kit/core';
import {
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import {
  useSortable,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

// --- INTERFACES & API CALLS ---

interface Assignee {
  id: string;
  name: string;
  email: string;
}

interface WorkflowOrigin {
  id: string;
  name: string;
}

interface Task {
  id: string;
  title: string;
  status: 'Pending' | 'In Progress' | 'Completed' | 'Blocked';
  priority: 'High' | 'Medium' | 'Low';
  due_date: string | null;
  assignee: Assignee | null;
  origin_workflow: WorkflowOrigin | null;
}

const getTasks = async (): Promise<Task[]> => {
  const { data } = await axios.get('http://127.0.0.1:8000/api/tasks');
  return data;
};

const updateTaskStatusAPI = async ({ taskId, status }: { taskId: string; status: Task['status'] }) => {
  const { data } = await axios.put(`http://127.0.0.1:8000/api/tasks/${taskId}`, { status });
  return data;
};

const completeTaskAndResumeWorkflowAPI = async (taskId: string) => {
  const { data } = await axios.post(`http://127.0.0.1:8000/api/tasks/${taskId}/complete`);
  return data;
};

// --- TASK CARD COMPONENT ---

interface TaskCardProps {
  task: Task;
  onCompleteTask: (taskId: string) => void;
  isCompleting: boolean;
}

function TaskCard({ task, onCompleteTask, isCompleting }: TaskCardProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: task.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  const getPriorityVariant = (priority: Task['priority']): "default" | "secondary" | "destructive" => {
    switch (priority) {
      case 'High': return 'destructive';
      case 'Medium': return 'secondary';
      case 'Low': return 'default';
      default: return 'default';
    }
  };

  const getInitials = (name: string) => {
    return name.split(' ').map(n => n[0]).join('').toUpperCase();
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      className="bg-card rounded-lg border p-3 shadow-md cursor-pointer hover:shadow-lg transition-shadow"
    >
      <div className="flex items-start justify-between mb-3">
        <h3 className="font-medium text-sm leading-5 flex-1 pr-2">{task.title}</h3>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="h-6 w-6 p-0 hover:bg-muted">
              <MoreHorizontal className="h-3 w-3" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuLabel>Actions</DropdownMenuLabel>
            <DropdownMenuItem>View Details</DropdownMenuItem>
            <DropdownMenuItem>Edit Task</DropdownMenuItem>
            <DropdownMenuItem
              onClick={() => onCompleteTask(task.id)}
              disabled={task.status === 'Completed' || isCompleting}
            >
              Mark as Completed & Resume
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      <div className="flex items-center gap-2 mb-3">
        <Badge variant={getPriorityVariant(task.priority)} className="text-xs">
          {task.priority}
        </Badge>
        {task.origin_workflow && (
          <Badge variant="outline" className="text-xs">
            {task.origin_workflow.name}
          </Badge>
        )}
      </div>

      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          {task.assignee ? (
            <>
              <Avatar className="h-6 w-6">
                <AvatarFallback className="text-xs">
                  {getInitials(task.assignee.name)}
                </AvatarFallback>
              </Avatar>
              <span className="text-xs text-muted-foreground">{task.assignee.name}</span>
            </>
          ) : (
            <div className="flex items-center gap-2">
              <Avatar className="h-6 w-6">
                <AvatarFallback className="text-xs">
                  <User className="h-3 w-3" />
                </AvatarFallback>
              </Avatar>
              <span className="text-xs text-muted-foreground">Unassigned</span>
            </div>
          )}
        </div>
        
        {task.due_date && (
          <div className="flex items-center gap-1 text-xs text-muted-foreground">
            <CalendarDays className="h-3 w-3" />
            {new Date(task.due_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
          </div>
        )}
      </div>
    </div>
  );
}

// --- KANBAN COLUMN COMPONENT ---

interface KanbanColumnProps {
  title: string;
  tasks: Task[];
  onCompleteTask: (taskId: string) => void;
  isCompleting: boolean;
}

function KanbanColumn({ title, tasks, onCompleteTask, isCompleting }: KanbanColumnProps) {
  const { isOver, setNodeRef } = useDroppable({
    id: title,
  });

  return (
    <div className="flex-1 min-w-[280px]">
      <div className="bg-muted/50 rounded-lg shadow-sm border-2 border-transparent transition-colors">
        <div className="p-3">
          <h2 className="font-semibold text-foreground mb-1">
            {title} <span className="text-muted-foreground">({tasks.length})</span>
          </h2>
        </div>
        <div 
          ref={setNodeRef}
          className={`p-3 pt-0 min-h-[400px] transition-all duration-200 ${
            isOver ? 'bg-primary/5 border-primary' : ''
          }`}
        >
          <div className="space-y-3">
            <SortableContext items={tasks.map(t => t.id)} strategy={verticalListSortingStrategy}>
              {tasks.length > 0 ? (
                tasks.map((task) => (
                  <TaskCard
                    key={task.id}
                    task={task}
                    onCompleteTask={onCompleteTask}
                    isCompleting={isCompleting}
                  />
                ))
              ) : (
                <div className="text-center text-muted-foreground text-sm py-8">
                  {title === 'Pending' && 'No pending tasks'}
                  {title === 'In Progress' && 'No tasks in progress'}
                  {title === 'Completed' && 'No completed tasks'}
                  {title === 'Blocked' && 'No blocked tasks'}
                </div>
              )}
            </SortableContext>
          </div>
        </div>
      </div>
    </div>
  );
}

// --- MAIN COMPONENT ---

export default function TasksPage() {
  const [statusFilter, setStatusFilter] = useState('All');
  const [priorityFilter, setPriorityFilter] = useState('All');
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const { data: tasks, isLoading, isError } = useQuery<Task[], Error>({
    queryKey: ['tasks'],
    queryFn: getTasks,
  });

  const updateTaskStatus = useMutation({
    mutationFn: updateTaskStatusAPI,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
    },
  });

  const completeTaskMutation = useMutation({
    mutationFn: completeTaskAndResumeWorkflowAPI,
    onSuccess: () => {
      toast({ title: "Task Completed!", description: "The workflow has been resumed." });
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
      queryClient.invalidateQueries({ queryKey: ['triggerRuns'] });
    },
    onError: (error: AxiosError) => {
      toast({ variant: "destructive", title: "Error", description: "Could not complete task or resume workflow." });
    }
  });

  const filteredTasks = useMemo(() => {
    return tasks?.filter(task => {
      const statusMatch = statusFilter === 'All' || task.status === statusFilter;
      const priorityMatch = priorityFilter === 'All' || task.priority === priorityFilter;
      return statusMatch && priorityMatch;
    }) || [];
  }, [tasks, statusFilter, priorityFilter]);

  const tasksByStatus = useMemo(() => {
    const groups = {
      'Pending': [] as Task[],
      'In Progress': [] as Task[],
      'Completed': [] as Task[],
      'Blocked': [] as Task[],
    };
    
    filteredTasks.forEach(task => {
      groups[task.status].push(task);
    });
    
    return groups;
  }, [filteredTasks]);

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    
    if (!over) return;
    
    const taskId = active.id as string;
    const newStatus = over.id as Task['status'];
    
    const task = filteredTasks.find(t => t.id === taskId);
    if (!task || task.status === newStatus) return;

    // If moving to completed, use the special complete API
    if (newStatus === 'Completed') {
      completeTaskMutation.mutate(taskId);
    } else {
      updateTaskStatus.mutate({ taskId, status: newStatus });
    }
  };

  const getTaskStatusVariant = (status: Task['status']): "default" | "secondary" | "destructive" | "outline" => {
    switch (status) {
      case 'Completed': return 'default';
      case 'In Progress': return 'secondary';
      case 'Blocked': return 'destructive';
      case 'Pending': return 'outline';
      default: return 'outline';
    }
  };

  const getPriorityBadgeVariant = (priority: Task['priority']): "default" | "secondary" | "destructive" => {
    switch (priority) {
      case 'High': return 'destructive';
      case 'Medium': return 'secondary';
      case 'Low': return 'default';
      default: return 'secondary';
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-8">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold tracking-tight">Manage Tasks</h1>
        </div>
        <div className="flex items-center justify-center h-64">
          <div className="text-center text-muted-foreground">Loading tasks...</div>
        </div>
      </div>
    );
  }

  if (isError) {
    return (
      <div className="space-y-8">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold tracking-tight">Manage Tasks</h1>
        </div>
        <div className="flex items-center justify-center h-64">
          <div className="text-center text-destructive">Failed to load tasks.</div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold tracking-tight">Manage Tasks</h1>
        
        <div className="flex items-center gap-4">
          {/* Filters */}
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-[140px]">
              <Filter className="h-4 w-4 mr-2" />
              <SelectValue placeholder="Status: All" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="All">Status: All</SelectItem>
              <SelectItem value="Pending">Pending</SelectItem>
              <SelectItem value="In Progress">In Progress</SelectItem>
              <SelectItem value="Completed">Completed</SelectItem>
              <SelectItem value="Blocked">Blocked</SelectItem>
            </SelectContent>
          </Select>

          <Select value={priorityFilter} onValueChange={setPriorityFilter}>
            <SelectTrigger className="w-[140px]">
              <Filter className="h-4 w-4 mr-2" />
              <SelectValue placeholder="Priority: All" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="All">Priority: All</SelectItem>
              <SelectItem value="High">High</SelectItem>
              <SelectItem value="Medium">Medium</SelectItem>
              <SelectItem value="Low">Low</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Task List</CardTitle>
          <CardDescription>
            Overview of tasks generated by your workflows or assigned manually.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Title</TableHead>
                <TableHead>Assigned To</TableHead>
                <TableHead>Due Date</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Priority</TableHead>
                <TableHead>Origin</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredTasks.length > 0 ? (
                filteredTasks.map((task) => (
                  <TableRow key={task.id}>
                    <TableCell className="font-medium">{task.title}</TableCell>
                    <TableCell>{task.assignee?.name || 'Unassigned'}</TableCell>
                    <TableCell>{task.due_date ? new Date(task.due_date).toLocaleDateString() : 'N/A'}</TableCell>
                    <TableCell><Badge variant={getTaskStatusVariant(task.status)}>{task.status}</Badge></TableCell>
                    <TableCell><Badge variant={getPriorityBadgeVariant(task.priority)}>{task.priority}</Badge></TableCell>
                    <TableCell>{task.origin_workflow?.name || 'Manual'}</TableCell>
                    <TableCell className="text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" className="h-8 w-8 p-0">
                            <span className="sr-only">Open menu</span>
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuLabel>Actions</DropdownMenuLabel>
                          <DropdownMenuItem>View Details</DropdownMenuItem>
                          <DropdownMenuItem>Edit Task</DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() => completeTaskMutation.mutate(task.id)}
                            disabled={task.status === 'Completed' || completeTaskMutation.isPending}
                          >
                            Mark as Completed & Resume
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow><TableCell colSpan={7} className="text-center">No tasks found.</TableCell></TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
} 