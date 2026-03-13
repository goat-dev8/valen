'use client';

import { useMemo } from 'react';
import { DitherShader } from '@/components/ui/dither-shader';
import { buildAgentArtDataUrl, getAgentDitherSettings } from '@/lib/agent-art';
import type { AgentVisualIdentity } from '@/lib/agent-visual-identity';

export function AgentDitherPortrait({
  identity,
  agentType,
  className = 'h-full w-full',
}: {
  identity: AgentVisualIdentity;
  agentType: string;
  className?: string;
}) {
  const src = useMemo(
    () => buildAgentArtDataUrl(identity.pattern, identity.seed, identity.glyph, agentType),
    [identity.pattern, identity.seed, identity.glyph, agentType],
  );
  const dither = useMemo(() => getAgentDitherSettings(identity.seed, agentType), [identity.seed, agentType]);

  return (
    <DitherShader
      src={src}
      gridSize={dither.gridSize}
      ditherMode={dither.ditherMode}
      colorMode={dither.colorMode}
      primaryColor={dither.primaryColor}
      secondaryColor={dither.secondaryColor}
      threshold={dither.threshold}
      contrast={dither.contrast}
      invert={false}
      animated={false}
      objectFit="cover"
      backgroundColor="#FAFBFC"
      className={className}
    />
  );
}
