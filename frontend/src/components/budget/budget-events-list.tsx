'use client';

import Link from 'next/link';
import { useMemo, useState } from 'react';
import { ChevronDown, ChevronUp, ExternalLink } from 'lucide-react';
import type { BudgetEventDto } from '@/types/api';
import { formatUsdcBaseUnits } from '@/lib/token-amount';

function formatUsdc(baseUnits: string): string {
  return formatUsdcBaseUnits(baseUnits);
}

function eventTone(kind: string): 'spend' | 'topup' | 'refusal' | 'other' {
  const k = kind.toLowerCase();
  if (k.includes('refus') || k.includes('deny') || k.includes('fail')) return 'refusal';
  if (k.includes('top') || k.includes('reset') || k.includes('cap')) return 'topup';
  if (k.includes('spend') || k.includes('debit') || k.includes('deduct')) return 'spend';
  return 'other';
}

function EventCard({ event }: { event: BudgetEventDto }) {
  const tone = eventTone(event.kind);

  return (
    <article className={`budget-event-card budget-event-card--${tone}`}>
      <div className="budget-event-card__header">
        <p className="budget-event-card__kind">{event.kind.replace(/_/g, ' ')}</p>
        <time className="budget-event-card__time" dateTime={event.created_at}>
          {new Date(event.created_at).toLocaleString()}
        </time>
      </div>
      <dl className="budget-event-card__metrics">
        <div>
          <dt>Amount</dt>
          <dd>{formatUsdc(event.amount)} USDC</dd>
        </div>
        <div>
          <dt>Remaining</dt>
          <dd>{formatUsdc(event.remaining)} USDC</dd>
        </div>
      </dl>
      {event.execution_id && (
        <Link href={`/dashboard/executions/${event.execution_id}`} className="budget-event-card__link">
          View execution
          <ExternalLink className="h-3.5 w-3.5" />
        </Link>
      )}
    </article>
  );
}

type BudgetEventsListProps = {
  events: BudgetEventDto[];
  initialVisible?: number;
};

export function BudgetEventsList({ events, initialVisible = 3 }: BudgetEventsListProps) {
  const [expanded, setExpanded] = useState(false);

  const sorted = useMemo(
    () => [...events].sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()),
    [events],
  );

  if (!sorted.length) {
    return (
      <div className="budget-events-empty">
        <p>No budget activity yet. Set a cap or run a governed payment to populate this ledger.</p>
      </div>
    );
  }

  const hiddenCount = Math.max(0, sorted.length - initialVisible);
  const visible = expanded ? sorted : sorted.slice(0, initialVisible);

  return (
    <section className="budget-events-section" aria-label="Budget activity">
      <div className="budget-events-section__header">
        <h2 className="budget-events-section__title">Budget activity</h2>
        <span className="budget-events-section__count">{sorted.length} events</span>
      </div>

      <div className="budget-events-list">
        {visible.map((event) => (
          <EventCard key={event.id} event={event} />
        ))}
      </div>

      {hiddenCount > 0 && (
        <button type="button" className="budget-events-section__toggle" onClick={() => setExpanded((v) => !v)}>
          {expanded ? (
            <>
              <ChevronUp className="h-4 w-4" aria-hidden />
              Show recent only
            </>
          ) : (
            <>
              <ChevronDown className="h-4 w-4" aria-hidden />
              Show {hiddenCount} older event{hiddenCount === 1 ? '' : 's'}
            </>
          )}
        </button>
      )}
    </section>
  );
}
