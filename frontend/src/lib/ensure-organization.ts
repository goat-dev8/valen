import { api } from '@/lib/api';
import type { MeResponseDto } from '@/types/api';

function buildOrgSlug(email?: string | null, userId?: string): string {
  const base =
    (email?.split('@')[0] ?? `workspace-${userId?.slice(0, 8) ?? 'user'}`)
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '') || 'workspace';
  return base;
}

/** Ensure the user has at least one organization (works against live Render API today). */
export async function ensureOrganization(
  token: string,
  profile: MeResponseDto,
): Promise<MeResponseDto> {
  if (profile.organizations?.length) {
    return profile;
  }

  const slug = `${buildOrgSlug(profile.user.email, profile.user.id)}-${Date.now().toString(36)}`;
  const name = profile.user.displayName ?? profile.user.email?.split('@')[0] ?? 'My Organization';

  await api.organizations.create(token, {
    name,
    slug,
    defaultChainId: 421614,
  });

  return api.auth.me(token);
}
