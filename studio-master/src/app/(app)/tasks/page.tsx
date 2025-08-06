'use client';

import React, { useMemo, useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useSearchParams } from 'next/navigation';
import { AxiosError } from 'axios';
import { LayoutGrid, List, Filter, CalendarDays, MoreHorizontal, User, Plus, Clock, AlertCircle, CheckCircle2, FileText, WorkflowIcon } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Separator } from "@/components/ui/separator";
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
  const { api } = await import('@/lib/api');
  return await api.get('/tasks');
};

const updateTaskStatusAPI = async ({ taskId, status }: { taskId: string; status: Task['status'] }) => {
  const { api } = await import('@/lib/api');
  console.log('Updating task:', { taskId, status });
  
  const response = await api.put(`/tasks/${taskId}`, { status });
  console.log('Update response:', response);
  return response;
};

const completeTaskAndResumeWorkflowAPI = async (taskId: string) => {
  const { api } = await import('@/lib/api');
  return await api.post(`/tasks/${taskId}/complete`, {});
};

// --- MODERN TASK CARD COMPONENT ---

interface TaskCardProps {
  task: Task;
  onCompleteTask: (taskId: string) => void;
  isCompleting: boolean;
  onOpenTaskModal: (task: Task) => void;
  isDragging?: boolean;
  onDragStart?: (taskId: string) => void;
  onDragEnd?: () => void;
}

function TaskCard({ task, onCompleteTask, isCompleting, onOpenTaskModal, isDragging, onDragStart, onDragEnd }: TaskCardProps) {
  const getPriorityColor = (priority: Task['priority']) => {
    switch (priority) {
      case 'High': return 'border-l-red-500 bg-red-50/50';
      case 'Medium': return 'border-l-amber-500 bg-amber-50/50';
      case 'Low': return 'border-l-green-500 bg-green-50/50';
      default: return 'border-l-gray-500 bg-gray-50/50';
    }
  };

  const getPriorityDot = (priority: Task['priority']) => {
    switch (priority) {
      case 'High': return 'bg-red-500';
      case 'Medium': return 'bg-amber-500';
      case 'Low': return 'bg-green-500';
      default: return 'bg-gray-500';
    }
  };

  const getInitials = (name: string | null | undefined) => {
    if (!name) return '?';
    return name.split(' ').map(n => n[0]).join('').toUpperCase();
  };

  const getDaysUntilDue = (dueDate: string) => {
    const today = new Date();
    const due = new Date(dueDate);
    const diffTime = due.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  const formatDueDate = (dueDate: string) => {
    const days = getDaysUntilDue(dueDate);
    if (days === 0) return 'Due today';
    if (days === 1) return 'Due tomorrow';
    if (days < 0) return `${Math.abs(days)} days overdue`;
    if (days <= 7) return `${days} days left`;
    return new Date(dueDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  const getDueDateColor = (dueDate: string) => {
    const days = getDaysUntilDue(dueDate);
    if (days < 0) return 'text-red-600 bg-red-50';
    if (days <= 1) return 'text-orange-600 bg-orange-50';
    if (days <= 3) return 'text-amber-600 bg-amber-50';
    return 'text-slate-600 bg-slate-50';
  };

  return (
    <div
      draggable="true"
      onDragStart={(e) => {
        e.dataTransfer.setData('text/plain', task.id);
        e.dataTransfer.effectAllowed = 'move';
        onDragStart?.(task.id);
      }}
      onDragEnd={() => {
        onDragEnd?.();
      }}
      onClick={(e) => {
        if (!e.defaultPrevented) {
          onOpenTaskModal(task);
        }
      }}
      className={`group relative bg-white rounded-xl border-l-4 ${getPriorityColor(task.priority)} border-r border-t border-b border-slate-200 shadow-sm hover:shadow-lg transition-all duration-200 cursor-pointer p-4 space-y-3 hover:scale-[1.02] hover:-translate-y-1 ${
        isDragging ? 'opacity-50 scale-95 rotate-2' : ''
      }`}
    >
      {/* Header with title and menu */}
      <div className="flex items-start justify-between gap-3">
        <h3 className="font-medium text-slate-900 text-sm leading-5 flex-1 group-hover:text-slate-700">
          {task.title}
        </h3>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button 
              variant="ghost" 
              className="h-6 w-6 p-0 opacity-0 group-hover:opacity-100 transition-opacity hover:bg-slate-100"
              onDragStart={(e) => e.stopPropagation()}
              onClick={(e) => e.stopPropagation()}
              draggable="false"
            >
              <MoreHorizontal className="h-3 w-3" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-48">
            <DropdownMenuLabel>Actions</DropdownMenuLabel>
            <DropdownMenuItem>
              <CheckCircle2 className="h-4 w-4 mr-2" />
              View Details
            </DropdownMenuItem>
            <DropdownMenuItem>
              <AlertCircle className="h-4 w-4 mr-2" />
              Edit Task
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={() => onCompleteTask(task.id)}
              disabled={task.status === 'Completed' || isCompleting}
              className="text-green-600"
            >
              <CheckCircle2 className="h-4 w-4 mr-2" />
              Mark as Completed
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* Priority and workflow badges */}
      <div className="flex items-center gap-2 flex-wrap">
        <div className="flex items-center gap-1.5">
          <div className={`w-2 h-2 rounded-full ${getPriorityDot(task.priority)}`}></div>
          <span className="text-xs font-medium text-slate-600">{task.priority}</span>
        </div>
        {task.origin_workflow && (
          <Badge variant="outline" className="text-xs px-2 py-0.5 bg-blue-50 text-blue-700 border-blue-200">
            {task.origin_workflow.name}
          </Badge>
        )}
      </div>

      {/* Due date */}
      {task.due_date && (
        <div className={`flex items-center gap-1.5 text-xs px-2 py-1 rounded-md ${getDueDateColor(task.due_date)}`}>
          <Clock className="h-3 w-3" />
          <span className="font-medium">{formatDueDate(task.due_date)}</span>
        </div>
      )}

      {/* Assignee */}
      <div className="flex items-center justify-between pt-1">
        <div className="flex items-center gap-2">
          {task.assignee ? (
            <>
              <Avatar className="h-6 w-6 ring-2 ring-white shadow-sm">
                <AvatarFallback className="text-xs bg-gradient-to-br from-blue-500 to-purple-600 text-white font-medium">
                  {getInitials(task.assignee.name)}
                </AvatarFallback>
              </Avatar>
              <span className="text-xs text-slate-600 font-medium">{task.assignee.name}</span>
            </>
          ) : (
            <div className="flex items-center gap-2 text-slate-400">
              <Avatar className="h-6 w-6 ring-2 ring-slate-100">
                <AvatarFallback className="bg-slate-100">
                  <User className="h-3 w-3 text-slate-400" />
                </AvatarFallback>
              </Avatar>
              <span className="text-xs">Unassigned</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// --- MODERN KANBAN COLUMN COMPONENT ---

interface KanbanColumnProps {
  title: string;
  tasks: Task[];
  onCompleteTask: (taskId: string) => void;
  isCompleting: boolean;
  onOpenTaskModal: (task: Task) => void;
  draggingTaskId: string | null;
  onDragStart: (taskId: string) => void;
  onDragEnd: () => void;
}

function KanbanColumn({ title, tasks, onCompleteTask, isCompleting, onOpenTaskModal, draggingTaskId, onDragStart, onDragEnd }: KanbanColumnProps) {
  const [dragOver, setDragOver] = useState(false);

  const getColumnIcon = (title: string) => {
    switch (title) {
      case 'Pending': return <Clock className="h-4 w-4 text-slate-500" />;
      case 'In Progress': return <div className="h-4 w-4 rounded-full bg-blue-500 animate-pulse" />;
      case 'Completed': return <CheckCircle2 className="h-4 w-4 text-green-500" />;
      case 'Blocked': return <AlertCircle className="h-4 w-4 text-red-500" />;
      default: return null;
    }
  };

  const getColumnColor = (title: string) => {
    switch (title) {
      case 'Pending': return 'border-slate-200 bg-slate-50/50';
      case 'In Progress': return 'border-blue-200 bg-blue-50/50';
      case 'Completed': return 'border-green-200 bg-green-50/50';
      case 'Blocked': return 'border-red-200 bg-red-50/50';
      default: return 'border-slate-200 bg-slate-50/50';
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const taskId = e.dataTransfer.getData('text/plain');
    
    const event = new CustomEvent('taskDrop', {
      detail: { taskId, newStatus: title }
    });
    window.dispatchEvent(event);
  };

  return (
    <div className="flex flex-col h-full">
      {/* Column Header */}
      <div className={`flex items-center justify-between p-4 bg-white rounded-t-xl border-t border-l border-r ${getColumnColor(title)}`}>
        <div className="flex items-center gap-2">
          {getColumnIcon(title)}
          <h2 className="font-semibold text-slate-800">{title}</h2>
          <div className="flex items-center justify-center h-5 w-5 bg-slate-200 rounded-full">
            <span className="text-xs font-medium text-slate-600">{tasks.length}</span>
          </div>
        </div>
        <Button variant="ghost" size="sm" className="h-6 w-6 p-0 opacity-70 hover:opacity-100">
          <Plus className="h-3 w-3" />
        </Button>
      </div>

      {/* Column Content */}
      <div 
        className={`flex-1 p-3 bg-white border-l border-r border-b rounded-b-xl min-h-[600px] transition-all duration-200 ${
          dragOver ? 'ring-2 ring-blue-400 ring-opacity-50 bg-blue-50/30' : ''
        }`}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
      >
        <div className="space-y-3">
          {tasks.length > 0 ? (
            tasks.map((task, index) => (
              <div key={task.id} style={{ animationDelay: `${index * 50}ms` }} className="animate-in fade-in slide-in-from-top-2">
                <TaskCard
                  task={task}
                  onCompleteTask={onCompleteTask}
                  isCompleting={isCompleting}
                  onOpenTaskModal={onOpenTaskModal}
                  isDragging={draggingTaskId === task.id}
                  onDragStart={onDragStart}
                  onDragEnd={onDragEnd}
                />
              </div>
            ))
          ) : (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <div className="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center mb-3">
                {getColumnIcon(title)}
              </div>
              <p className="text-sm text-slate-500 font-medium">No {title.toLowerCase()} tasks</p>
              <p className="text-xs text-slate-400 mt-1">Drag tasks here or create new ones</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// --- TASK DETAIL MODAL COMPONENT ---

interface TaskDetailModalProps {
  task: Task | null;
  isOpen: boolean;
  onClose: () => void;
  onSave: (updatedTask: Partial<Task>) => void;
  onDelete?: (taskId: string) => void;
}

function TaskDetailModal({ task, isOpen, onClose, onSave, onDelete }: TaskDetailModalProps) {
  const [editMode, setEditMode] = useState(false);
  const [formData, setFormData] = useState<Partial<Task>>({});
  const { toast } = useToast();

  React.useEffect(() => {
    if (task) {
      setFormData({
        title: task.title,
        status: task.status,
        priority: task.priority,
        due_date: task.due_date,
      });
    }
  }, [task]);

  const handleSave = () => {
    if (task) {
      onSave({ ...formData, id: task.id });
      setEditMode(false);
      toast({ title: "Task updated successfully!" });
    }
  };

  const handleInputChange = (field: keyof Task, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const getPriorityColor = (priority: Task['priority']) => {
    switch (priority) {
      case 'High': return 'destructive';
      case 'Medium': return 'secondary';
      case 'Low': return 'default';
      default: return 'secondary';
    }
  };

  const getStatusColor = (status: Task['status']) => {
    switch (status) {
      case 'Completed': return 'default';
      case 'In Progress': return 'secondary';
      case 'Blocked': return 'destructive';
      case 'Pending': return 'outline';
      default: return 'outline';
    }
  };

  if (!task) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-3xl">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold flex items-center gap-2">
            {editMode ? (
              <Input
                value={formData.title || ''}
                onChange={(e) => handleInputChange('title', e.target.value)}
                className="text-2xl font-bold"
                placeholder="Task title"
              />
            ) : (
              <>
                <WorkflowIcon className="h-5 w-5" />
                {task.title}
              </>
            )}
          </DialogTitle>
          <div className="flex items-center gap-4 text-sm text-muted-foreground">
            {task.origin_workflow && (
              <div className="flex items-center gap-1">
                <WorkflowIcon className="h-4 w-4" />
                {task.origin_workflow.name}
              </div>
            )}
            <div className="flex items-center gap-1">
              <Clock className="h-4 w-4" />
              Created on {new Date().toLocaleDateString()}
            </div>
          </div>
        </DialogHeader>

        <div className="grid md:grid-cols-3 gap-x-8 gap-y-6 py-4">
          {/* Left Column - Description */}
          <div className="md:col-span-2 space-y-4">
            <Separator />
            
            <div>
              <h3 className="flex items-center gap-2 text-lg font-medium mb-3">
                <FileText className="h-4 w-4" />
                Description
              </h3>
              {editMode ? (
                <Textarea
                  placeholder="Add a detailed description of this task..."
                  rows={8}
                  className="resize-none"
                />
              ) : (
                <div className="prose text-sm text-muted-foreground">
                  {task.title?.includes('review') ? 
                    "Client has uploaded the initial contract and statement of work. Please review for accuracy and completeness before moving to the 'Kick-off' stage." :
                    "No description provided"
                  }
                </div>
              )}
            </div>
          </div>

          {/* Right Column - Details */}
          <div className="space-y-4 md:border-l md:pl-8">
            <h3 className="text-lg font-medium">Details</h3>
            
            {/* Status */}
            <div>
              <Label className="text-xs text-muted-foreground">Status</Label>
              {editMode ? (
                <Select
                  value={formData.status || task.status}
                  onValueChange={(value) => handleInputChange('status', value as Task['status'])}
                >
                  <SelectTrigger className="w-full mt-1">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Pending">Pending</SelectItem>
                    <SelectItem value="In Progress">In Progress</SelectItem>
                    <SelectItem value="Completed">Completed</SelectItem>
                    <SelectItem value="Blocked">Blocked</SelectItem>
                  </SelectContent>
                </Select>
              ) : (
                <Badge variant={getStatusColor(task.status)} className="mt-1">
                  {task.status}
                </Badge>
              )}
            </div>

            <Separator />

            {/* Priority */}
            <div>
              <Label className="text-xs text-muted-foreground">Priority</Label>
              {editMode ? (
                <Select
                  value={formData.priority || task.priority}
                  onValueChange={(value) => handleInputChange('priority', value as Task['priority'])}
                >
                  <SelectTrigger className="w-full mt-1">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="High">High</SelectItem>
                    <SelectItem value="Medium">Medium</SelectItem>
                    <SelectItem value="Low">Low</SelectItem>
                  </SelectContent>
                </Select>
              ) : (
                <Badge variant={getPriorityColor(task.priority)} className="mt-1">
                  {task.priority}
                </Badge>
              )}
            </div>

            <Separator />

            {/* Due Date */}
            <div>
              <Label className="text-xs text-muted-foreground flex items-center gap-1">
                <CalendarDays className="h-3 w-3" />
                Due Date
              </Label>
              {editMode ? (
                <Input
                  type="date"
                  value={formData.due_date || task.due_date || ''}
                  onChange={(e) => handleInputChange('due_date', e.target.value)}
                  className="mt-1"
                />
              ) : (
                <div className="text-sm mt-1">
                  {task.due_date 
                    ? new Date(task.due_date).toLocaleDateString('en-US', { 
                        weekday: 'long', 
                        year: 'numeric', 
                        month: 'long', 
                        day: 'numeric' 
                      })
                    : 'No due date set'
                  }
                </div>
              )}
            </div>

            <Separator />

            {/* Assignee */}
            <div>
              <Label className="text-xs text-muted-foreground">Assigned To</Label>
              <div className="flex items-center gap-2 mt-2">
                {task.assignee ? (
                  <>
                    <Avatar className="h-6 w-6">
                      <AvatarFallback className="text-xs">
                        {task.assignee.name.split(' ').map(n => n[0]).join('').toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <span className="text-sm">{task.assignee.name}</span>
                  </>
                ) : (
                  <>
                    <Avatar className="h-6 w-6">
                      <AvatarFallback>
                        <User className="h-3 w-3" />
                      </AvatarFallback>
                    </Avatar>
                    <span className="text-sm text-muted-foreground">Unassigned</span>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>

        <DialogFooter className="border-t pt-4">
          <div className="flex justify-between w-full">
            <div>
              {onDelete && (
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={() => {
                    onDelete(task.id);
                    onClose();
                  }}
                >
                  Delete Task
                </Button>
              )}
            </div>
            <div className="flex gap-2">
              <Button variant="outline" onClick={onClose}>
                Close
              </Button>
              <Button
                onClick={() => setEditMode(!editMode)}
                variant={editMode ? "outline" : "default"}
              >
                {editMode ? 'Cancel' : 'Edit Task'}
              </Button>
              {editMode && (
                <Button onClick={handleSave}>
                  Save Changes
                </Button>
              )}
            </div>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// --- MAIN COMPONENT ---

export default function TasksPage() {
  const [viewMode, setViewMode] = useState<'board' | 'list'>('list');
  const [statusFilter, setStatusFilter] = useState('All');
  const [priorityFilter, setPriorityFilter] = useState('All');
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [draggingTaskId, setDraggingTaskId] = useState<string | null>(null);
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const searchParams = useSearchParams();

  const handleOpenTaskModal = (task: Task) => {
    setSelectedTask(task);
  };

  const handleCloseTaskModal = () => {
    setSelectedTask(null);
  };

  const handleSaveTask = (updatedTask: Partial<Task>) => {
    updateTaskStatus.mutate({ 
      taskId: updatedTask.id!, 
      status: updatedTask.status as Task['status'] 
    });
    handleCloseTaskModal();
  };

  const handleDeleteTask = (taskId: string) => {
    toast({ 
      title: "Delete functionality", 
      description: "Delete task feature would be implemented here" 
    });
  };

  const handleDragStart = (taskId: string) => {
    setDraggingTaskId(taskId);
  };

  const handleDragEnd = () => {
    setDraggingTaskId(null);
  };

  const { data: tasks, isLoading, isError } = useQuery<Task[], Error>({
    queryKey: ['tasks'],
    queryFn: getTasks,
  });

  // Handle taskId from query parameter (for notification navigation)
  useEffect(() => {
    const taskId = searchParams.get('taskId');
    if (taskId && tasks) {
      const task = tasks.find(t => t.id === taskId);
      if (task) {
        setSelectedTask(task);
        // Remove the query parameter from URL
        const url = new URL(window.location.href);
        url.searchParams.delete('taskId');
        window.history.replaceState({}, '', url.toString());
      }
    }
  }, [searchParams, tasks]);

  const updateTaskStatus = useMutation({
    mutationFn: updateTaskStatusAPI,
    onMutate: async ({ taskId, status }) => {
      // Cancel any outgoing refetches
      await queryClient.cancelQueries({ queryKey: ['tasks'] });

      // Snapshot the previous value
      const previousTasks = queryClient.getQueryData(['tasks']);

      // Optimistically update to the new value
      queryClient.setQueryData(['tasks'], (old: Task[] | undefined) => {
        if (!old) return old;
        return old.map(task => 
          task.id === taskId 
            ? { ...task, status } 
            : task
        );
      });

      // Return a context object with the snapshotted value
      return { previousTasks };
    },
    onSuccess: () => {
      // Visual feedback is sufficient - no need for toast
    },
    onError: (err: any, variables, context) => {
      console.error('Task update error:', err);
      console.error('Error details:', {
        message: err.message,
        response: err.response?.data,
        status: err.response?.status,
        variables
      });

      // If the mutation fails, use the context returned from onMutate to roll back
      if (context?.previousTasks) {
        queryClient.setQueryData(['tasks'], context.previousTasks);
      }

      // Check if it's actually a success but with unexpected response format
      if (err.response?.status === 200 || err.response?.status === 204) {
        toast({ 
          title: "Task Updated", 
          description: "Task status updated successfully." 
        });
        return; // Don't show error for successful requests
      }

      toast({ 
        variant: "destructive", 
        title: "Update Failed", 
        description: `Failed to update task status: ${err.response?.data?.detail || err.message || 'Unknown error'}` 
      });
    },
    onSettled: () => {
      // Always refetch after error or success to ensure we have the latest data
      setTimeout(() => {
        queryClient.invalidateQueries({ queryKey: ['tasks'] });
      }, 1000); // Small delay to let the API settle
    },
  });

  const completeTaskMutation = useMutation({
    mutationFn: completeTaskAndResumeWorkflowAPI,
    onMutate: async (taskId) => {
      // Cancel any outgoing refetches
      await queryClient.cancelQueries({ queryKey: ['tasks'] });

      // Snapshot the previous value
      const previousTasks = queryClient.getQueryData(['tasks']);

      // Optimistically update to completed status
      queryClient.setQueryData(['tasks'], (old: Task[] | undefined) => {
        if (!old) return old;
        return old.map(task => 
          task.id === taskId 
            ? { ...task, status: 'Completed' as Task['status'] } 
            : task
        );
      });

      // Return a context object with the snapshotted value
      return { previousTasks };
    },
    onSuccess: () => {
      toast({ title: "Task Completed!", description: "The workflow has been resumed." });
    },
    onError: (error: AxiosError, taskId, context) => {
      // If the mutation fails, use the context returned from onMutate to roll back
      if (context?.previousTasks) {
        queryClient.setQueryData(['tasks'], context.previousTasks);
      }
      toast({ variant: "destructive", title: "Error", description: "Could not complete task or resume workflow." });
    },
    onSettled: () => {
      // Always refetch after error or success to ensure we have the latest data
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
      queryClient.invalidateQueries({ queryKey: ['triggerRuns'] });
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

  const handleTaskDrop = React.useCallback((taskId: string, newStatus: Task['status']) => {
    const task = filteredTasks.find(t => t.id === taskId);
    if (!task || task.status === newStatus) {
      setDraggingTaskId(null); // Clear dragging state even if no change
      return;
    }

    if (newStatus === 'Completed') {
      completeTaskMutation.mutate(taskId);
    } else {
      updateTaskStatus.mutate({ taskId, status: newStatus });
    }
    
    setDraggingTaskId(null); // Clear dragging state
  }, [filteredTasks, completeTaskMutation, updateTaskStatus]);

  // Listen for task drop events
  React.useEffect(() => {
    const handleCustomDrop = (event: any) => {
      const { taskId, newStatus } = event.detail;
      handleTaskDrop(taskId, newStatus);
    };

    window.addEventListener('taskDrop', handleCustomDrop);
    return () => window.removeEventListener('taskDrop', handleCustomDrop);
  }, [handleTaskDrop]);

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
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-white p-6">
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-3xl font-bold tracking-tight bg-gradient-to-r from-slate-900 to-slate-600 bg-clip-text text-transparent">Manage Tasks</h1>
        </div>
        <div className="flex items-center justify-center h-64">
          <div className="text-center text-muted-foreground">Loading tasks...</div>
        </div>
      </div>
    );
  }

  if (isError) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-white p-6">
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-3xl font-bold tracking-tight bg-gradient-to-r from-slate-900 to-slate-600 bg-clip-text text-transparent">Manage Tasks</h1>
        </div>
        <div className="flex items-center justify-center h-64">
          <div className="text-center text-destructive">Failed to load tasks.</div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-white p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold tracking-tight bg-gradient-to-r from-slate-900 to-slate-600 bg-clip-text text-transparent">
            Manage Tasks
          </h1>
          
          <div className="flex items-center gap-3">
            {/* View Toggle */}
            <div className="flex items-center bg-white rounded-lg border border-slate-200 p-1">
              <Button
                variant={viewMode === 'board' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setViewMode('board')}
                className="flex items-center gap-2 h-8"
              >
                <LayoutGrid className="h-4 w-4" />
                Board
              </Button>
              <Button
                variant={viewMode === 'list' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setViewMode('list')}
                className="flex items-center gap-2 h-8"
              >
                <List className="h-4 w-4" />
                List
              </Button>
            </div>

            {/* Filters */}
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[140px] bg-white">
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
              <SelectTrigger className="w-[140px] bg-white">
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

        {/* Content */}
        {viewMode === 'board' ? (
          // Modern Kanban Board View
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                      <KanbanColumn
            title="Pending"
            tasks={tasksByStatus['Pending']}
            onCompleteTask={(taskId) => completeTaskMutation.mutate(taskId)}
            isCompleting={completeTaskMutation.isPending}
            onOpenTaskModal={handleOpenTaskModal}
            draggingTaskId={draggingTaskId}
            onDragStart={handleDragStart}
            onDragEnd={handleDragEnd}
          />
          <KanbanColumn
            title="In Progress"
            tasks={tasksByStatus['In Progress']}
            onCompleteTask={(taskId) => completeTaskMutation.mutate(taskId)}
            isCompleting={completeTaskMutation.isPending}
            onOpenTaskModal={handleOpenTaskModal}
            draggingTaskId={draggingTaskId}
            onDragStart={handleDragStart}
            onDragEnd={handleDragEnd}
          />
          <KanbanColumn
            title="Completed"
            tasks={tasksByStatus['Completed']}
            onCompleteTask={(taskId) => completeTaskMutation.mutate(taskId)}
            isCompleting={completeTaskMutation.isPending}
            onOpenTaskModal={handleOpenTaskModal}
            draggingTaskId={draggingTaskId}
            onDragStart={handleDragStart}
            onDragEnd={handleDragEnd}
          />
          <KanbanColumn
            title="Blocked"
            tasks={tasksByStatus['Blocked']}
            onCompleteTask={(taskId) => completeTaskMutation.mutate(taskId)}
            isCompleting={completeTaskMutation.isPending}
            onOpenTaskModal={handleOpenTaskModal}
            draggingTaskId={draggingTaskId}
            onDragStart={handleDragStart}
            onDragEnd={handleDragEnd}
          />
          </div>
        ) : (
          // Table List View
          <Card className="bg-white/80 backdrop-blur-sm border-slate-200">
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
        )}

        {/* Task Detail Modal */}
        <TaskDetailModal
          task={selectedTask}
          isOpen={selectedTask !== null}
          onClose={handleCloseTaskModal}
          onSave={handleSaveTask}
          onDelete={handleDeleteTask}
        />
      </div>
    </div>
  );
} 