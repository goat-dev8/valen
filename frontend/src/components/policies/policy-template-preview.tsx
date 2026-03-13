'use client';

import type { PolicyTemplate } from '@/lib/policy-templates';
import { summarizePolicyRules } from '@/lib/policy-rules-summary';

type PolicyTemplatePreviewProps = {
  template: PolicyTemplate;
};

export function PolicyTemplatePreview({ template }: PolicyTemplatePreviewProps) {
  const permissions = (template.rules.permissions as Record<string, unknown> | undefined) ?? null;
  const sentences = summarizePolicyRules(permissions);

  return (
    <div className="policy-template-preview">
      <p className="policy-template-preview__desc">{template.description}</p>
      <ul className="policy-template-preview__rules">
        {sentences.map((sentence) => (
          <li key={sentence}>{sentence}</li>
        ))}
      </ul>
      <details className="policy-template-preview__technical">
        <summary>View raw rules JSON</summary>
        <pre>{JSON.stringify(template.rules, null, 2)}</pre>
      </details>
    </div>
  );
}
