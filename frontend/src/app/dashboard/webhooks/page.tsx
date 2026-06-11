'use client';

import { Plus, Play } from 'lucide-react';
import { useState } from 'react';
import { PageHeader } from '@/components/app/page-header';
import { QueryState } from '@/components/app/query-state';
import { useTestWebhook, useWebhooks } from '@/hooks/use-valen-api';

export default function WebhooksPage() {
  const { data, isLoading, error } = useWebhooks();
  const testMutation = useTestWebhook();
  const [testMsg, setTestMsg] = useState<string | null>(null);

  const handleTest = async (webhookId: string) => {
    setTestMsg(null);
    try {
      const result = await testMutation.mutateAsync(webhookId);
      setTestMsg(result.message ?? (result.success ? 'Test sent' : 'Test failed'));
    } catch (err) {
      setTestMsg(err instanceof Error ? err.message : 'Test failed');
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader title="Webhooks" description="Event notifications for execution and compliance events">
        <button type="button" className="app-btn app-btn-primary">
          <Plus className="h-4 w-4" />
          Add Webhook
        </button>
      </PageHeader>

      {testMsg && <p className="text-sm text-[#64748b]">{testMsg}</p>}

      <QueryState isLoading={isLoading} error={error} isEmpty={!data?.length} emptyMessage="No webhooks configured">
        <div className="space-y-4">
          {data?.map((wh) => (
            <div key={wh.id} className="app-card">
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div>
                  <p className="font-semibold text-[#012b54]">{wh.name}</p>
                  <p className="font-mono text-sm text-[#64748b]">{wh.url}</p>
                  <div className="mt-2 flex flex-wrap gap-2">
                    {wh.subscribedEvents.map((e) => (
                      <span key={e} className="app-badge bg-blue-50 font-mono text-xs text-blue-600">{e}</span>
                    ))}
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <span className={`app-badge capitalize ${wh.status === 'active' ? 'bg-emerald-50 text-emerald-600' : 'bg-red-50 text-red-600'}`}>
                    {wh.status}
                  </span>
                  <button type="button" className="app-btn app-btn-outline" onClick={() => handleTest(wh.id)} disabled={testMutation.isPending}>
                    <Play className="h-4 w-4" />
                    Test
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </QueryState>
    </div>
  );
}
