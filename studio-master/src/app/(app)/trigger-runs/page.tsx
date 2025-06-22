'use client';

import React, { useState } from "react";
import { useQuery } from '@tanstack/react-query';
import axios from 'axios';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Eye, Loader2, AlertTriangle } from "lucide-react";
import { LogViewerModal } from '@/components/trigger-runs/log-viewer-modal'; // Import the new modal
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

// --- INTERFACES & API ---
interface WorkflowForRun { id: string; name: string; }
interface TriggerRun { id: string; status: 'PENDING' | 'RUNNING' | 'SUCCESS' | 'FAILED'; started_at: string; completed_at: string | null; workflow: WorkflowForRun; }
interface LogEntry { id: string; message: string | null; status: 'Info' | 'Success' | 'Error'; timestamp: string; }

const getTriggerRuns = async (): Promise<TriggerRun[]> => (await axios.get('http://127.0.0.1:8000/api/trigger-runs')).data;
const getLogsForRun = async (runId: string): Promise<LogEntry[]> => (await axios.get(`http://127.0.0.1:8000/api/trigger-runs/${runId}/logs`)).data;

// --- HELPER FUNCTIONS ---
const formatDuration = (start: string, end: string | null) => {
  if (!end) return 'In progress';
  const durationMs = new Date(end).getTime() - new Date(start).getTime();
  const seconds = Math.floor(durationMs / 1000);
  if (seconds < 60) return `${seconds}s`;
  const minutes = Math.floor(seconds / 60);
  return `${minutes}m ${seconds % 60}s`;
};

export default function TriggerRunsPage() {
  const [selectedRun, setSelectedRun] = useState<TriggerRun | null>(null);

  const { data: runs, isLoading, isError, error } = useQuery<TriggerRun[], Error>({ queryKey: ['triggerRuns'], queryFn: getTriggerRuns });

  // Query for the logs of the selected run, only runs when a run is selected
  const { data: logs, isLoading: isLoadingLogs, isError: isLogsError } = useQuery<LogEntry[], Error>({
    queryKey: ['triggerRunLogs', selectedRun?.id],
    queryFn: () => getLogsForRun(selectedRun!.id),
    enabled: !!selectedRun, // Only fetch if a run is selected
  });

  const getStatusBadgeVariant = (status: TriggerRun['status']): "default" | "secondary" | "destructive" | "outline" => {
    switch (status) {
      case 'SUCCESS': return 'default';
      case 'RUNNING': return 'secondary';
      case 'FAILED': return 'destructive';
      case 'PENDING': return 'outline';
      default: return 'outline';
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Trigger Runs</h1>
        <p className="text-muted-foreground">Monitor the execution status and logs of your triggered workflows.</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>All Workflow Executions</CardTitle>
          <CardDescription>A chronological list of all workflow instances that have been triggered.</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Workflow Name</TableHead>
                <TableHead>Triggered By</TableHead>
                <TableHead>Timestamp</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Duration</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? <TableRow><TableCell colSpan={6} className="text-center">Loading runs...</TableCell></TableRow> : null}
              {isError ? <TableRow><TableCell colSpan={6} className="text-center text-destructive">Failed to load runs.</TableCell></TableRow> : null}
              {runs && runs.length === 0 ? <TableRow><TableCell colSpan={6} className="text-center">No trigger runs found.</TableCell></TableRow> : null}
              {runs?.map((run) => (
                <TableRow key={run.id}>
                  <TableCell className="font-medium">{run.workflow.name}</TableCell>
                  <TableCell>Form Submission</TableCell>
                  <TableCell>{new Date(run.started_at).toLocaleString()}</TableCell>
                  <TableCell><Badge variant={getStatusBadgeVariant(run.status)}>{run.status}</Badge></TableCell>
                  <TableCell>{formatDuration(run.started_at, run.completed_at)}</TableCell>
                  <TableCell className="text-right">
                    <Button variant="ghost" size="sm" onClick={() => setSelectedRun(run)}>
                      <Eye className="mr-2 h-4 w-4" /> View Logs
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <LogViewerModal
        isOpen={!!selectedRun}
        onClose={() => setSelectedRun(null)}
        runSummary={selectedRun ? { id: selectedRun.id, status: selectedRun.status, started_at: selectedRun.started_at, workflow_name: selectedRun.workflow.name } : null}
        logs={logs}
        isLoading={isLoadingLogs}
        isError={isLogsError}
      />
    </div>
  );
}

    