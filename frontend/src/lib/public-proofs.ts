export type PublicProofDto = {
  proofVersion: '1.0';
  id: string;
  kind: 'execution' | 'refusal' | 'payment';
  chainId: number;
  publishedAt: string;
  action?: string;
  asset?: string | null;
  amount?: string | null;
  status: string;
  mandateSigner?: string | null;
  mandateHash?: string | null;
  settlementTx?: string | null;
  evidenceHash?: string | null;
  refusalFactors?: Record<string, unknown> | null;
  agentId?: string;
  identity?: {
    status: string;
    registryAddress: string | null;
    resolverAddress: string | null;
    tokenId: string | null;
    chainId: number;
    ownerAddress: string | null;
    metadataHash: string | null;
    publicSlug: string | null;
  } | null;
};

export type ProofPackDto = {
  proofVersion: '1.0';
  executions: PublicProofDto[];
  refusals: PublicProofDto[];
  payments: PublicProofDto[];
};

const RENDER_API_URL = 'https://valen-api-m3g4.onrender.com';

function apiBase(): string {
  if (typeof window !== 'undefined') {
    return '/api-proxy';
  }
  const apiUrl =
    process.env.NEXT_PUBLIC_API_URL ??
    process.env.NEXT_PUBLIC_BACKEND_URL ??
    RENDER_API_URL;
  if (!apiUrl.startsWith(RENDER_API_URL)) {
    throw new Error(`Frontend API URL must target Render API (${RENDER_API_URL})`);
  }
  return apiUrl;
}

function buildPublicUrl(path: string): string {
  const base = apiBase().replace(/\/$/, '');
  const normalized = path.startsWith('/') ? path : `/${path}`;
  if (typeof window !== 'undefined') {
    return `${base}${normalized}`;
  }
  return `${base}${normalized}`;
}

export async function fetchPublicProof(
  kind: 'executions' | 'refusals' | 'payments',
  id: string,
): Promise<PublicProofDto> {
  const response = await fetch(buildPublicUrl(`/v1/public/proofs/${kind}/${id}`), {
    headers: { Accept: 'application/json' },
    cache: 'no-store',
  });
  if (!response.ok) {
    throw new Error(`Proof fetch failed (${response.status})`);
  }
  return response.json() as Promise<PublicProofDto>;
}

export async function fetchProofPack(): Promise<ProofPackDto> {
  const response = await fetch(buildPublicUrl('/v1/public/proofs/pack'), {
    headers: { Accept: 'application/json' },
    cache: 'no-store',
  });
  if (!response.ok) {
    throw new Error(`Proof pack fetch failed (${response.status})`);
  }
  return response.json() as Promise<ProofPackDto>;
}

export async function fetchPublicAgent(slug: string) {
  const response = await fetch(buildPublicUrl(`/v1/public/agents/${slug}`), {
    headers: { Accept: 'application/json' },
    cache: 'no-store',
  });
  if (!response.ok) {
    throw new Error(`Agent profile fetch failed (${response.status})`);
  }
  return response.json();
}
