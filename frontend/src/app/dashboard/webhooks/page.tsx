'use client';

import { Plus, Play, Trash2 } from 'lucide-react';
import { useState } from 'react';
import { PageHeader } from '@/components/app/page-header';
import { QueryState } from '@/components/app/query-state';
import {
  useCreateWebhook,
  useDeleteWebhook,
  useTestWebhook,
  useUpdateWebhook,
  useWebhooks,
} from '@/hooks/use-valen-api';

const WEBHOOK_EVENTS = [
  'execution.created',
  'execution.completed',
  'execution.failed',
  'settlement.confirmed',
  'agent.suspended',
];

export default function WebhooksPage() {
  const { data, isLoading, error } = useWebhooks();
  const testMutation = useTestWebhook();
  const createMutation = useCreateWebhook();
  const updateMutation = useUpdateWebhook();
  const deleteMutation = useDeleteWebhook();
  const [testMsg, setTestMsg] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [selectedEvents, setSelectedEvents] = useState<string[]>(['execution.completed']);

  const handleTest = async (webhookId: string) => {
    setTestMsg(null);
    try {
      const result = await testMutation.mutateAsync(webhookId);
      setTestMsg(`Delivery ${result.deliveryId}: ${result.status}${result.statusCode ? ` (${result.statusCode})` : ''}`);
    } catch (err) {
      setTestMsg(err instanceof Error ? err.message : 'Test failed');
    }
  };

  const handleCreate = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setFormError(null);
    const form = new FormData(e.currentTarget);
    try {
      await createMutation.mutateAsync({
        name: String(form.get('name')),
        url: String(form.get('url')),
        subscribedEvents: selectedEvents,
      });
      setShowForm(false);
      e.currentTarget.reset();
    } catch (err) {
      setFormError(err instanceof Error ? err.message : 'Failed to create webhook');
    }
  };

  const handleDisable = async (webhookId: string) => {
    if (!window.confirm('Disable this webhook?')) return;
    try {
      await deleteMutation.mutateAsync(webhookId);
    } catch (err) {
      setFormError(err instanceof Error ? err.message : 'Failed to disable webhook');
    }
  };

  const toggleEvent = (event: string) => {
    setSelectedEvents((prev) =>
      prev.includes(event) ? prev.filter((e) => e !== event) : [...prev, event],
    );
  };

  return (
    <div className="space-y-6">
      <PageHeader title="Webhooks" description="Event notifications for execution and compliance events">
        <button type="button" className="app-btn app-btn-primary" onClick={() => setShowForm((v) => !v)}>
          <Plus className="h-4 w-4" />
          Add Webhook
        </button>
      </PageHeader>

      {testMsg && <p className="text-sm text-[#64748b]">{testMsg}</p>}
      {formError && <p className="text-sm text-red-600">{formError}</p>}

      {showForm && (
        <div className="app-card max-w-2xl">
          <h3 className="app-card-title mb-4">New Webhook</h3>
          <form onSubmit={handleCreate} className="space-y-4">
            <div className="app-form-group">
              <label htmlFor="name">Name</label>
              <input id="name" name="name" className="app-input" required />
            </div>
            <div className="app-form-group">
              <label htmlFor="url">HTTPS URL</label>
              <input id="url" name="url" type="url" className="app-input font-mono" placeholder="https://..." required />
            </div>
            <div className="app-form-group">
              <label>Subscribed Events</label>
              <div className="mt-2 flex flex-wrap gap-2">
                {WEBHOOK_EVENTS.map((event) => (
                  <label key={event} className="flex items-center gap-2 text-sm">
                    <input
                      type="checkbox"
                      checked={selectedEvents.includes(event)}
                      onChange={() => toggleEvent(event)}
                    />
                    <span className="font-mono text-xs">{event}</span>
                  </label>
                ))}
              </div>
            </div>
            <div className="flex gap-2">
              <button type="submit" className="app-btn app-btn-primary" disabled={createMutation.isPending || !selectedEvents.length}>
                {createMutation.isPending ? 'Saving...' : 'Save Webhook'}
              </button>
              <button type="button" className="app-btn app-btn-outline" onClick={() => setShowForm(false)}>
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

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
                  {wh.status === 'active' && (
                    <button
                      type="button"
                      className="app-btn app-btn-outline"
                      onClick={() => updateMutation.mutate({ webhookId: wh.id, body: { status: 'disabled' } })}
                      disabled={updateMutation.isPending}
                    >
                      Disable
                    </button>
                  )}
                  <button type="button" className="app-btn app-btn-danger" onClick={() => handleDisable(wh.id)} disabled={deleteMutation.isPending}>
                    <Trash2 className="h-4 w-4" />
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
