'use client';

import { useQuery } from '@tanstack/react-query';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { operatorFetch } from '@/lib/api';

type EnvResponse = {
  files: Record<string, { present: boolean; keys: Array<{ key: string; status: string }> }>;
  backendRuntime: { valid: boolean; issues: string[] };
};

export default function EnvironmentPage() {
  const { data, error, isLoading } = useQuery({
    queryKey: ['operator-env'],
    queryFn: () => operatorFetch<EnvResponse>('env'),
  });

  if (isLoading) return <p>Validating environment files…</p>;
  if (error) return <p className="text-red-600">{(error as Error).message}</p>;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Environment Validation</h1>
        <p className="mt-2 text-neutral-600">backend/.env, contracts/.env, stylus/.env — secrets never displayed.</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Backend runtime env</CardTitle>
        </CardHeader>
        <CardContent>
          <Badge variant={data?.backendRuntime.valid ? 'success' : 'error'}>
            {data?.backendRuntime.valid ? 'Valid' : 'Invalid'}
          </Badge>
          {!data?.backendRuntime.valid && (
            <pre className="mt-3 overflow-auto rounded bg-neutral-100 p-3 text-xs">{data?.backendRuntime.issues.join('\n')}</pre>
          )}
        </CardContent>
      </Card>

      {Object.entries(data?.files ?? {}).map(([file, info]) => (
        <Card key={file}>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              {file}/.env
              <Badge variant={info.present ? 'success' : 'error'}>{info.present ? 'Present' : 'Missing'}</Badge>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Key</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {info.keys.map((key) => (
                  <TableRow key={key.key}>
                    <TableCell>{key.key}</TableCell>
                    <TableCell>
                      <Badge
                        variant={
                          key.status === 'present' ? 'success' : key.status === 'invalid' ? 'warning' : 'error'
                        }
                      >
                        {key.status}
                      </Badge>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
