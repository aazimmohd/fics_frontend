'use client';

import React from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import axios from 'axios';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ArrowLeft, CheckCircle2, XCircle, Info, Loader2 } from 'lucide-react';

// --- INTERFACE & API CALL ---

interface LogEntry {
  id: string;
  node_id: string | null;
  message: string | null;
  status: 'Info' | 'Success' | 'Error';
  timestamp: string;
}

const getLogsForRun = async (runId: string): Promise<LogEntry[]> => {
  const { data } = await axios.get(`http://127.0.0.1:8000/api/trigger-runs/${runId}/logs`, {
    headers: { 'Authorization': `Bearer ${localStorage.getItem('access_token')}` }
  });
  return data;
};

const LogStatusIcon = ({ status }: { status: LogEntry['status'] }) => {
  switch (status) {
    case 'Success':
      return <CheckCircle2 className="h-5 w-5 text-green-500" />;
    case 'Error':
      return <XCircle className="h-5 w-5 text-red-500" />;
    default:
      return <Info className="h-5 w-5 text-blue-500" />;
  }
};

export default function TriggerRunDetailPage() {
  const params = useParams();
  const router = useRouter();
  const runId = params.runId as string;

  const { data: logs, isLoading, isError } = useQuery<LogEntry[], Error>({
    queryKey: ['triggerRunLogs', runId],
    queryFn: () => getLogsForRun(runId),
    enabled: !!runId,
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="outline" size="icon" onClick={() => router.back()}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Workflow Log</h1>
          <p className="text-sm text-muted-foreground">Run ID: {runId}</p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Execution Steps</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading && <div className="flex items-center justify-center py-8"><Loader2 className="h-6 w-6 animate-spin" /><p className="ml-4">Loading logs...</p></div>}
          {isError && <p className="text-destructive">Failed to load logs.</p>}
          <div className="space-y-4">
            {logs?.map((log) => (
              <div key={log.id} className="flex items-start gap-4">
                <div className="mt-1">
                  <LogStatusIcon status={log.status} />
                </div>
                <div className="flex-grow">
                  <p className="font-medium">{log.message}</p>
                  <p className="text-sm text-muted-foreground">
                    {new Date(log.timestamp).toLocaleString()}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
} 