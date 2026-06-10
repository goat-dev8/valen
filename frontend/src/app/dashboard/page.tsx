'use client';

import { useQuery } from '@tanstack/react-query';
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { operatorFetch } from '@/lib/api';

type HealthResponse = {
  status: string;
  checks: Record<string, { status?: string; count?: number; latencyMs?: number; blockNumber?: string; waiting?: number; failed?: number; queues?: Array<{ name: string; waiting: number; failed: number }> }>;
};

function statusVariant(status?: string): 'success' | 'error' | 'warning' | 'secondary' {
  if (status === 'ok') return 'success';
  if (status === 'degraded') return 'warning';
  if (status === 'error') return 'error';
  return 'secondary';
}

export default function SystemHealthPage() {
  const { data, error, isLoading } = useQuery({
    queryKey: ['operator-health'],
    queryFn: () => operatorFetch<HealthResponse>('health'),
  });

  if (isLoading) return <p>Loading live health checks…</p>;
  if (error) return <p className="text-red-600">{(error as Error).message}</p>;

  const queueChart =
    data?.checks.queueDepth?.queues?.map((q) => ({
      name: q.name.replace('valen-', ''),
      waiting: q.waiting,
      failed: q.failed,
    })) ?? [];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">System Health</h1>
        <p className="mt-2 text-neutral-600">Live status from backend, Supabase, Redis, workers, RPCs, and Stylus.</p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {Object.entries(data?.checks ?? {}).map(([name, check]) => (
          <Card key={name}>
            <CardHeader>
              <CardTitle className="capitalize">{name.replace(/([A-Z])/g, ' $1')}</CardTitle>
              <CardDescription>
                <Badge variant={statusVariant(check.status)}>{check.status ?? 'unknown'}</Badge>
              </CardDescription>
            </CardHeader>
            <CardContent className="text-sm text-neutral-600">
              {'count' in check && check.count !== undefined && <p>Workers: {check.count}</p>}
              {'latencyMs' in check && check.latencyMs !== undefined && <p>Latency: {check.latencyMs}ms</p>}
              {'blockNumber' in check && check.blockNumber && <p>Block: {check.blockNumber}</p>}
              {'waiting' in check && check.waiting !== undefined && <p>Waiting jobs: {check.waiting}</p>}
              {'failed' in check && check.failed !== undefined && <p>Failed jobs: {check.failed}</p>}
            </CardContent>
          </Card>
        ))}
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Queue Depth</CardTitle>
          <CardDescription>Live BullMQ counts by queue</CardDescription>
        </CardHeader>
        <CardContent className="h-80">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={queueChart}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip />
              <Bar dataKey="waiting" fill="#171717" name="Waiting" />
              <Bar dataKey="failed" fill="#dc2626" name="Failed" />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
    </div>
  );
}
