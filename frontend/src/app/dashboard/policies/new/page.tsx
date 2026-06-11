'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ArrowLeft } from 'lucide-react';
import { useState } from 'react';
import { PageHeader } from '@/components/app/page-header';
import { useCreatePolicy } from '@/hooks/use-valen-api';

export default function CreatePolicyPage() {
  const router = useRouter();
  const createMutation = useCreatePolicy();
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);
    const form = new FormData(e.currentTarget);
    try {
      const policy = await createMutation.mutateAsync({
        name: String(form.get('name')),
        description: String(form.get('description') || '') || undefined,
      });
      router.push(`/dashboard/policies/${policy.id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create policy');
    }
  };

  return (
    <div className="space-y-6">
      <Link href="/dashboard/policies" className="app-back-link">
        <ArrowLeft className="h-4 w-4" />
        Back to Policies
      </Link>

      <PageHeader title="Create Policy" description="Define compliance and risk rules for agent intents" />

      <div className="app-card max-w-2xl">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="app-form-group">
            <label htmlFor="name">Policy Name</label>
            <input id="name" name="name" className="app-input" placeholder="Default settlement policy" required />
          </div>
          <div className="app-form-group">
            <label htmlFor="description">Description</label>
            <textarea id="description" name="description" className="app-input min-h-[100px]" placeholder="What this policy governs..." />
          </div>
          {error && <p className="text-sm text-red-600">{error}</p>}
          <button type="submit" className="app-btn app-btn-primary" disabled={createMutation.isPending}>
            {createMutation.isPending ? 'Creating...' : 'Create Policy'}
          </button>
        </form>
      </div>
    </div>
  );
}
