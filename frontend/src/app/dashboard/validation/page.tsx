'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { operatorFetch } from '@/lib/api';

type ValidationStep = { name: string; status: 'pass' | 'fail'; detail: string; durationMs?: number };
type ValidationReport = { status: 'PASS' | 'FAIL'; passed: boolean; steps: ValidationStep[] };

export default function ValidationPage() {
  const [report, setReport] = useState<ValidationReport | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function runValidation() {
    setLoading(true);
    setError(null);
    try {
      const result = await operatorFetch<ValidationReport>('validate/full', { method: 'POST' });
      setReport(result);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">E2E Validation</h1>
        <p className="mt-2 text-neutral-600">Run a live full-stack validation across backend, database, Redis, workers, contracts, Stylus, settlement wiring, governance, treasury, and audit.</p>
      </div>

      <Card>
        <CardHeader><CardTitle>Full validation runner</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          <Button size="lg" disabled={loading} onClick={runValidation}>
            {loading ? 'Running validation…' : 'RUN FULL VALIDATION'}
          </Button>
          {report && (
            <Badge variant={report.passed ? 'success' : 'error'} className="text-sm">
              {report.status}
            </Badge>
          )}
          {error && <p className="text-red-600">{error}</p>}
        </CardContent>
      </Card>

      {report && (
        <Card>
          <CardHeader><CardTitle>Live report</CardTitle></CardHeader>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Step</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Detail</TableHead>
                  <TableHead>Duration</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {report.steps.map((step) => (
                  <TableRow key={step.name}>
                    <TableCell>{step.name}</TableCell>
                    <TableCell>
                      <Badge variant={step.status === 'pass' ? 'success' : 'error'}>{step.status}</Badge>
                    </TableCell>
                    <TableCell>{step.detail}</TableCell>
                    <TableCell>{step.durationMs ?? '—'}ms</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
