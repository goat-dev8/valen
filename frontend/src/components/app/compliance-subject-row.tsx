'use client';

import { useComplianceSubject } from '@/hooks/use-valen-api';

export function ComplianceSubjectRow({
  subjectRef,
  name,
  type,
}: {
  subjectRef: string;
  name: string;
  type: string;
}) {
  const { data, isLoading, error } = useComplianceSubject(subjectRef);

  if (isLoading) {
    return (
      <tr>
        <td className="font-medium text-[#012b54]">{name}</td>
        <td colSpan={3} className="text-sm text-[#64748b]">Loading...</td>
      </tr>
    );
  }

  if (error || !data) {
    return (
      <tr>
        <td className="font-medium text-[#012b54]">{name}</td>
        <td className="capitalize">{type}</td>
        <td colSpan={2} className="text-sm text-[#64748b]">No compliance data</td>
      </tr>
    );
  }

  const latestAttestation = data.attestations[0];

  return (
    <tr>
      <td className="font-medium text-[#012b54]">{name}</td>
      <td className="capitalize">{type}</td>
      <td>
        {latestAttestation ? (
          <span className={`app-badge capitalize ${latestAttestation.status === 'active' ? 'bg-emerald-50 text-emerald-600' : 'bg-amber-50 text-amber-700'}`}>
            {latestAttestation.status}
          </span>
        ) : (
          '—'
        )}
      </td>
      <td className="text-[#64748b]">{data.recentChecks.length} checks</td>
    </tr>
  );
}
