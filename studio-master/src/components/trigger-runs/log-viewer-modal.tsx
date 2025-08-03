'use client';

import React, { useState, useMemo } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { 
  Loader2, Info, CheckCircle2, XCircle, AlertTriangle, 
  Clock, Database, Settings, Play, Pause, Search,
  ChevronDown, ChevronRight, Copy, Filter
} from 'lucide-react';
import { cn } from "@/lib/utils";

// --- INTERFACES ---
interface LogEntry {
  id: string;
  message: string | null;
  status: 'Info' | 'Success' | 'Error';
  timestamp: string;
  node_id?: string;
  details?: {
    [key: string]: any;
  };
}

interface TriggerRunSummary {
  id: string;
  started_at: string;
  workflow_name: string;
  status: string;
}

interface LogViewerModalProps {
  isOpen: boolean;
  onClose: () => void;
  runSummary: TriggerRunSummary | null;
  logs: LogEntry[] | undefined;
  isLoading: boolean;
  isError: boolean;
}

// --- HELPER FUNCTIONS ---
const getLogStatusVariant = (status: LogEntry['status']) => {
  switch (status) {
    case 'Success': return 'default';
    case 'Error': return 'destructive';
    default: return 'secondary';
  }
};

const getLogStatusIcon = (status: LogEntry['status'], className?: string) => {
  const props = { className: cn("h-4 w-4", className) };
  
  switch (status) {
    case 'Success': return <CheckCircle2 {...props} className={cn(props.className, "text-green-500")} />;
    case 'Error': return <XCircle {...props} className={cn(props.className, "text-red-500")} />;
    default: return <Info {...props} className={cn(props.className, "text-blue-500")} />;
  }
};

const getLogCategory = (message: string | null, details?: any): string => {
  if (!message) return 'general';
  
  const msg = message.toLowerCase();
  if (msg.includes('executing node') || msg.includes('execution')) return 'execution';
  if (msg.includes('database') || msg.includes('query') || msg.includes('updated') || msg.includes('record')) return 'database';
  if (msg.includes('delay') || msg.includes('delaying')) return 'timing';
  if (msg.includes('condition') || msg.includes('evaluated')) return 'logic';
  if (msg.includes('task') || msg.includes('human')) return 'task';
  if (msg.includes('workflow')) return 'workflow';
  if (msg.includes('variable') || msg.includes('resolved')) return 'variables';
  
  return 'general';
};

const getCategoryIcon = (category: string) => {
  switch (category) {
    case 'execution': return <Play className="h-4 w-4 text-purple-500" />;
    case 'database': return <Database className="h-4 w-4 text-blue-500" />;
    case 'timing': return <Clock className="h-4 w-4 text-orange-500" />;
    case 'logic': return <Settings className="h-4 w-4 text-green-500" />;
    case 'task': return <Pause className="h-4 w-4 text-red-500" />;
    case 'workflow': return <Play className="h-4 w-4 text-indigo-500" />;
    case 'variables': return <Settings className="h-4 w-4 text-yellow-500" />;
    default: return <Info className="h-4 w-4 text-gray-500" />;
  }
};

// --- DETAILED LOG ENTRY COMPONENT ---
const DetailedLogEntry = ({ log, index }: { log: LogEntry; index: number }) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const category = getLogCategory(log.message, log.details);
  const hasDetails = log.details && Object.keys(log.details).length > 0;
  
  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
  };

  return (
    <Card className="mb-3 border-l-4 border-l-blue-200 hover:border-l-blue-400 transition-colors">
      <CardContent className="p-4">
        <div className="flex items-start gap-3">
          {/* Timeline connector */}
          <div className="flex flex-col items-center">
            <div className="flex items-center justify-center w-8 h-8 rounded-full bg-background border-2 border-muted">
              {getLogStatusIcon(log.status, "h-4 w-4")}
            </div>
            {index < 10 && (
              <div className="w-px h-8 bg-border mt-2" />
            )}
          </div>

          <div className="flex-1 min-w-0">
            {/* Header */}
            <div className="flex items-center gap-2 mb-2">
              {getCategoryIcon(category)}
              <Badge variant="outline" className="text-xs">
                {category}
              </Badge>
              <Badge variant={getLogStatusVariant(log.status)} className="text-xs">
                {log.status}
              </Badge>
              <span className="text-xs text-muted-foreground ml-auto">
                {new Date(log.timestamp).toLocaleTimeString()}
              </span>
            </div>

            {/* Message */}
            <div className="mb-2">
              <p className="text-sm font-medium leading-relaxed">
                {log.message || 'No message'}
              </p>
              {log.node_id && (
                <p className="text-xs text-muted-foreground mt-1">
                  Node ID: <code className="bg-muted px-1 rounded">{log.node_id}</code>
                </p>
              )}
            </div>

            {/* Details expansion */}
            {hasDetails && (
              <div className="mt-2">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setIsExpanded(!isExpanded)}
                  className="h-7 px-2 text-xs"
                >
                  {isExpanded ? <ChevronDown className="h-3 w-3 mr-1" /> : <ChevronRight className="h-3 w-3 mr-1" />}
                  {isExpanded ? 'Hide' : 'Show'} Details
                </Button>
                
                {isExpanded && (
                  <div className="mt-2 p-3 bg-muted/50 rounded-lg border">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs font-medium text-muted-foreground">Execution Details</span>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => copyToClipboard(JSON.stringify(log.details, null, 2))}
                        className="h-6 px-2 text-xs"
                      >
                        <Copy className="h-3 w-3" />
                      </Button>
                    </div>
                    <pre className="text-xs bg-background p-2 rounded border overflow-auto max-h-32">
                      {JSON.stringify(log.details, null, 2)}
                    </pre>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

// --- WORKFLOW SUMMARY COMPONENT ---
const WorkflowSummary = ({ runSummary }: { runSummary: TriggerRunSummary }) => {
  const statusColor = {
    'SUCCESS': 'text-green-600 bg-green-50 border-green-200',
    'RUNNING': 'text-blue-600 bg-blue-50 border-blue-200',
    'FAILED': 'text-red-600 bg-red-50 border-red-200',
    'PENDING': 'text-yellow-600 bg-yellow-50 border-yellow-200',
  }[runSummary.status] || 'text-gray-600 bg-gray-50 border-gray-200';

  return (
    <Card className="mb-4">
      <CardContent className="p-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <p className="text-xs text-muted-foreground mb-1">Workflow</p>
            <p className="font-medium">{runSummary.workflow_name}</p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground mb-1">Started</p>
            <p className="font-medium">{new Date(runSummary.started_at).toLocaleString()}</p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground mb-1">Status</p>
            <div className={cn("inline-flex px-2 py-1 rounded-full text-xs font-medium border", statusColor)}>
              {runSummary.status}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

// --- MAIN COMPONENT ---
export function LogViewerModal({ isOpen, onClose, runSummary, logs, isLoading, isError }: LogViewerModalProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');

  const filteredLogs = useMemo(() => {
    if (!logs) return [];
    
    return logs.filter(log => {
      const matchesSearch = !searchTerm || 
        log.message?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        log.node_id?.toLowerCase().includes(searchTerm.toLowerCase());
      
      const matchesStatus = statusFilter === 'all' || log.status === statusFilter;
      
      const category = getLogCategory(log.message, log.details);
      const matchesCategory = categoryFilter === 'all' || category === categoryFilter;
      
      return matchesSearch && matchesStatus && matchesCategory;
    });
  }, [logs, searchTerm, statusFilter, categoryFilter]);

  const logStats = useMemo(() => {
    if (!logs) return { total: 0, success: 0, error: 0, info: 0 };
    
    return logs.reduce((acc, log) => {
      acc.total++;
      const statusKey = log.status.toLowerCase() as 'success' | 'error' | 'info';
      if (statusKey in acc) {
        acc[statusKey]++;
      }
      return acc;
    }, { total: 0, success: 0, error: 0, info: 0 });
  }, [logs]);

  const categories = useMemo(() => {
    if (!logs) return [];
    const categorySet = new Set(logs.map(log => getLogCategory(log.message, log.details)));
    return Array.from(categorySet);
  }, [logs]);

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-5xl h-[80vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Play className="h-5 w-5" />
            Execution Logs: {runSummary?.workflow_name || 'Workflow'}
          </DialogTitle>
          <DialogDescription className="text-sm">
            Run ID: <code className="bg-muted px-1 rounded">{runSummary?.id}</code>
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 flex flex-col overflow-hidden">
          {runSummary && <WorkflowSummary runSummary={runSummary} />}
          
          <Tabs defaultValue="timeline" className="flex-1 flex flex-col">
            <div className="flex items-center justify-between mb-4">
              <TabsList>
                <TabsTrigger value="timeline">Timeline View</TabsTrigger>
                <TabsTrigger value="raw">Raw Logs</TabsTrigger>
                <TabsTrigger value="stats">Statistics</TabsTrigger>
              </TabsList>
              
              <div className="flex items-center gap-2">
                <div className="relative">
                  <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search logs..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-8 w-48"
                  />
                </div>
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger className="w-32">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Status</SelectItem>
                    <SelectItem value="Info">Info</SelectItem>
                    <SelectItem value="Success">Success</SelectItem>
                    <SelectItem value="Error">Error</SelectItem>
                  </SelectContent>
                </Select>
                <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                  <SelectTrigger className="w-36">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Categories</SelectItem>
                    {categories.map(category => (
                      <SelectItem key={category} value={category}>
                        {category.charAt(0).toUpperCase() + category.slice(1)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <TabsContent value="timeline" className="flex-1 overflow-hidden">
              <ScrollArea className="h-96 pr-4">
                {isLoading && (
                  <div className="flex items-center justify-center py-12">
                    <Loader2 className="h-8 w-8 animate-spin mr-3" />
                    <p className="text-lg">Loading execution logs...</p>
                  </div>
                )}
                
                {isError && (
                  <Card className="border-red-200 bg-red-50">
                    <CardContent className="p-6 text-center">
                      <AlertTriangle className="h-8 w-8 text-red-500 mx-auto mb-2" />
                      <p className="text-red-700">Failed to load execution logs</p>
                    </CardContent>
                  </Card>
                )}

                {filteredLogs.length === 0 && !isLoading && !isError && (
                  <Card className="border-yellow-200 bg-yellow-50">
                    <CardContent className="p-6 text-center">
                      <Info className="h-8 w-8 text-yellow-500 mx-auto mb-2" />
                      <p className="text-yellow-700">No logs match your current filters</p>
                    </CardContent>
                  </Card>
                )}

                <div className="space-y-1 pb-2">
                  {filteredLogs.map((log, index) => (
                    <DetailedLogEntry key={log.id} log={log} index={index} />
                  ))}
                </div>
              </ScrollArea>
            </TabsContent>

            <TabsContent value="raw" className="flex-1 overflow-hidden">
              <ScrollArea className="h-96">
                <Card>
                  <CardContent className="p-0">
                    <pre className="text-xs p-4 bg-background overflow-auto max-h-none">
                      {JSON.stringify(filteredLogs, null, 2)}
                    </pre>
                  </CardContent>
                </Card>
              </ScrollArea>
            </TabsContent>

            <TabsContent value="stats" className="flex-1 overflow-hidden">
              <ScrollArea className="h-96 pr-4">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm">Total Logs</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-2xl font-bold">{logStats.total}</p>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm text-green-600">Success</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-2xl font-bold text-green-600">{logStats.success}</p>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm text-red-600">Errors</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-2xl font-bold text-red-600">{logStats.error}</p>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm text-blue-600">Info</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-2xl font-bold text-blue-600">{logStats.info}</p>
                    </CardContent>
                  </Card>
                </div>
                
                <Card className="mb-4">
                  <CardHeader>
                    <CardTitle className="text-sm">Categories Breakdown</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                      {categories.map(category => {
                        const count = filteredLogs.filter(log => getLogCategory(log.message, log.details) === category).length;
                        return (
                          <div key={category} className="flex items-center gap-2 p-2 bg-muted rounded">
                            {getCategoryIcon(category)}
                            <span className="text-sm">{category}: {count}</span>
                          </div>
                        );
                      })}
                    </div>
                  </CardContent>
                </Card>
              </ScrollArea>
            </TabsContent>
          </Tabs>
        </div>
      </DialogContent>
    </Dialog>
  );
} 