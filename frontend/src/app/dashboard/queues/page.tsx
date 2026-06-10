'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { operatorFetch } from '@/lib/api';

type QueueStats = { name: string; waiting: number; active: number; delayed: number; completed: number; failed: number; workers: number };
type Job = { id: string; name: string; state: string; failedReason?: string; data: unknown };

export default function QueuesPage() {
  const [queueName, setQueueName] = useState('valen-settlement');
  const [jobState, setJobState] = useState<'failed' | 'waiting' | 'active' | 'completed'>('failed');
  const [selectedJob, setSelectedJob] = useState<Job | null>(null);

  const { data: queues } = useQuery({
    queryKey: ['operator-queues'],
    queryFn: () => operatorFetch<QueueStats[]>('queues'),
  });

  const { data: jobs, refetch } = useQuery({
    queryKey: ['operator-jobs', queueName, jobState],
    queryFn: () => operatorFetch<Job[]>(`queues/${queueName}/jobs?state=${jobState}`),
  });

  async function retryJob(jobId: string) {
    await operatorFetch(`queues/${queueName}/jobs/${jobId}/retry`, { method: 'POST' });
    refetch();
  }

  async function clearJob(jobId: string) {
    await operatorFetch(`queues/${queueName}/jobs/${jobId}`, { method: 'DELETE' });
    refetch();
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Queue Panel</h1>
        <p className="mt-2 text-neutral-600">Live BullMQ queue depths, job inspection, retry, and failed job removal.</p>
      </div>

      <Card>
        <CardHeader><CardTitle>All queues</CardTitle></CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Queue</TableHead>
                <TableHead>Waiting</TableHead>
                <TableHead>Active</TableHead>
                <TableHead>Failed</TableHead>
                <TableHead>Workers</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {(queues ?? []).map((q) => (
                <TableRow key={q.name} className="cursor-pointer" onClick={() => setQueueName(q.name)}>
                  <TableCell>{q.name}</TableCell>
                  <TableCell>{q.waiting}</TableCell>
                  <TableCell>{q.active}</TableCell>
                  <TableCell>{q.failed}</TableCell>
                  <TableCell>{q.workers}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle>Jobs in {queueName}</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          <Select value={jobState} onValueChange={(v) => setJobState(v as typeof jobState)}>
            <SelectTrigger className="w-48"><SelectValue /></SelectTrigger>
            <SelectContent>
              {['failed', 'waiting', 'active', 'completed'].map((s) => (
                <SelectItem key={s} value={s}>{s}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>ID</TableHead>
                <TableHead>Name</TableHead>
                <TableHead>Reason</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {(jobs ?? []).map((job) => (
                <TableRow key={job.id}>
                  <TableCell>{job.id}</TableCell>
                  <TableCell>{job.name}</TableCell>
                  <TableCell className="max-w-xs truncate">{job.failedReason ?? '—'}</TableCell>
                  <TableCell className="space-x-2">
                    <Button size="sm" variant="outline" onClick={() => setSelectedJob(job)}>Inspect</Button>
                    {jobState === 'failed' && (
                      <>
                        <Button size="sm" onClick={() => retryJob(job.id!)}>Retry</Button>
                        <Button size="sm" variant="destructive" onClick={() => clearJob(job.id!)}>Clear</Button>
                      </>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {selectedJob && (
        <Card>
          <CardHeader><CardTitle>Job payload</CardTitle></CardHeader>
          <CardContent>
            <pre className="overflow-auto rounded bg-neutral-950 p-4 text-xs text-neutral-100">{JSON.stringify(selectedJob, null, 2)}</pre>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
