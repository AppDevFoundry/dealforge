'use client';

import { AlertCircle, CheckCircle2, Clock, Loader2, XCircle } from 'lucide-react';
import { useEffect, useState } from 'react';

import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';

interface Job {
  id: string;
  type: string;
  status: 'pending' | 'running' | 'completed' | 'failed' | 'cancelled';
  parameters: Record<string, unknown> | null;
  result: Record<string, unknown> | null;
  errorMessage: string | null;
  createdAt: string;
  startedAt: string | null;
  completedAt: string | null;
}

interface JobStatusTableProps {
  limit?: number;
}

const statusConfig = {
  pending: {
    label: 'Pending',
    variant: 'secondary' as const,
    icon: Clock,
  },
  running: {
    label: 'Running',
    variant: 'default' as const,
    icon: Loader2,
  },
  completed: {
    label: 'Completed',
    variant: 'default' as const,
    icon: CheckCircle2,
  },
  failed: {
    label: 'Failed',
    variant: 'destructive' as const,
    icon: XCircle,
  },
  cancelled: {
    label: 'Cancelled',
    variant: 'outline' as const,
    icon: AlertCircle,
  },
};

const typeLabels: Record<string, string> = {
  tdhca_titles_sync: 'TDHCA Titles Sync',
  tdhca_liens_sync: 'TDHCA Liens Sync',
  discover_parks: 'Discover Parks',
  calculate_distress: 'Calculate Distress',
  csv_import: 'CSV Import',
};

function formatDate(dateString: string | null): string {
  if (!dateString) return '-';
  const date = new Date(dateString);
  return date.toLocaleString('en-US', {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function formatDuration(start: string | null, end: string | null): string {
  if (!start) return '-';
  const startDate = new Date(start);
  const endDate = end ? new Date(end) : new Date();
  const diffMs = endDate.getTime() - startDate.getTime();
  const diffSecs = Math.floor(diffMs / 1000);
  if (diffSecs < 60) return `${diffSecs}s`;
  const diffMins = Math.floor(diffSecs / 60);
  return `${diffMins}m ${diffSecs % 60}s`;
}

export function JobStatusTable({ limit = 10 }: JobStatusTableProps) {
  const [jobs, setJobs] = useState<Job[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchJobs() {
      try {
        const response = await fetch(`/api/v1/admin/jobs?limit=${limit}`);
        if (!response.ok) {
          throw new Error('Failed to fetch jobs');
        }
        const data = await response.json();
        setJobs(data.data || []);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load jobs');
      } finally {
        setIsLoading(false);
      }
    }

    fetchJobs();
    // Poll for updates every 10 seconds
    const interval = setInterval(fetchJobs, 10000);
    return () => clearInterval(interval);
  }, [limit]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center gap-2 py-8 text-destructive">
        <AlertCircle className="h-5 w-5" />
        <span>{error}</span>
      </div>
    );
  }

  if (jobs.length === 0) {
    return (
      <div className="py-8 text-center text-muted-foreground">
        No jobs found. Jobs will appear here when you run data sync operations.
      </div>
    );
  }

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Type</TableHead>
          <TableHead>Status</TableHead>
          <TableHead>Created</TableHead>
          <TableHead>Duration</TableHead>
          <TableHead>Details</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {jobs.map((job) => {
          const config = statusConfig[job.status];
          const StatusIcon = config.icon;
          return (
            <TableRow key={job.id}>
              <TableCell className="font-medium">{typeLabels[job.type] || job.type}</TableCell>
              <TableCell>
                <Badge variant={config.variant} className="gap-1">
                  <StatusIcon
                    className={`h-3 w-3 ${job.status === 'running' ? 'animate-spin' : ''}`}
                  />
                  {config.label}
                </Badge>
              </TableCell>
              <TableCell className="text-muted-foreground">{formatDate(job.createdAt)}</TableCell>
              <TableCell className="text-muted-foreground">
                {formatDuration(job.startedAt, job.completedAt)}
              </TableCell>
              <TableCell className="max-w-[200px] truncate text-muted-foreground">
                {job.errorMessage || (job.result ? JSON.stringify(job.result) : '-')}
              </TableCell>
            </TableRow>
          );
        })}
      </TableBody>
    </Table>
  );
}
