'use client';

import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Loader2, Info, CheckCircle2, XCircle, AlertTriangle } from 'lucide-react';

// --- INTERFACES ---
interface LogEntry {
  id: string;
  message: string | null;
  status: 'Info' | 'Success' | 'Error';
  timestamp: string;
}

interface TriggerRunSummary {
  id: string;
  status: string;
  started_at: string;
  workflow_name: string;
}

interface LogViewerModalProps {
  isOpen: boolean;
  onClose: () => void;
  runSummary: TriggerRunSummary | null;
  logs: LogEntry[] | undefined;
  isLoading: boolean;
  isError: boolean;
}

// --- HELPER COMPONENTS ---
const getLogStatusVariant = (status: LogEntry['status']) => {
  switch (status) {
    case 'Success': return 'default';
    case 'Error': return 'destructive';
    default: return 'outline';
  }
};

const getLogStatusIcon = (status: LogEntry['status']) => {
  const props = { className: "h-4 w-4 mt-0.5" };
  switch (status) {
    case 'Success': return <CheckCircle2 {...props} />;
    case 'Error': return <XCircle {...props} />;
    default: return <Info {...props} />;
  }
};

// --- MAIN COMPONENT ---
export function LogViewerModal({ isOpen, onClose, runSummary, logs, isLoading, isError }: LogViewerModalProps) {
  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-3xl h-[70vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>Logs for: {runSummary?.workflow_name || 'Workflow'}</DialogTitle>
          <DialogDescription className="text-xs">
            Run ID: {runSummary?.id} | Triggered: {runSummary ? new Date(runSummary.started_at).toLocaleString() : ''} | Status: {runSummary?.status}
          </DialogDescription>
        </DialogHeader>

        <div className="flex-grow overflow-hidden">
          <ScrollArea className="h-full pr-6">
            <div className="space-y-3 text-sm">
              {isLoading && <div className="flex items-center justify-center py-8"><Loader2 className="h-6 w-6 animate-spin" /><p className="ml-4">Loading logs...</p></div>}
              {isError && <div className="text-destructive flex items-center justify-center py-8"><AlertTriangle className="mr-2 h-4 w-4"/>Failed to load logs.</div>}

              {logs?.map((log) => (
                <div key={log.id} className="grid grid-cols-[auto_1fr] gap-x-3 items-start">
                  <div className="text-xs text-muted-foreground whitespace-nowrap pt-0.5">
                    {new Date(log.timestamp).toLocaleTimeString()}
                  </div>
                  <div className="space-y-0.5">
                    <div className="flex items-center gap-2">
                      {getLogStatusIcon(log.status)}
                      <span className="font-semibold">{log.message}</span>
                      <Badge variant={getLogStatusVariant(log.status)} className="px-1.5 py-0.5 text-xs rounded-sm">
                        {log.status}
                      </Badge>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </ScrollArea>
        </div>

        <DialogFooter>
          <Button onClick={onClose}>Close</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
} 