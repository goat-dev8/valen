import type { AgentTypeValue } from '@/lib/agent-types';
import type { AgentVisualPattern } from '@/lib/agent-visual-identity';

const VALEN_NAVY = '#012b54';
const VALEN_BLUE = '#0066FF';
const VALEN_MINT = '#EBF2FF';
const VALEN_LIME = '#84CC16';

function neuralMotif(seed: number): string {
  const cx = 160;
  const cy = 72;
  const nodes = Array.from({ length: 6 }, (_, i) => {
    const angle = (i / 6) * Math.PI * 2 + seed * 0.01;
    const radius = 38 + (seed % 12);
    return { x: cx + Math.cos(angle) * radius, y: cy + Math.sin(angle) * radius };
  });

  const edges = nodes
    .map(
      (node, i) =>
        `<line x1="${cx}" y1="${cy}" x2="${node.x}" y2="${node.y}" stroke="${VALEN_BLUE}" stroke-width="2" opacity="0.55"/>`,
    )
    .join('');

  const peerEdges = nodes
    .map((node, i) => {
      const next = nodes[(i + 1) % nodes.length];
      return `<line x1="${node.x}" y1="${node.y}" x2="${next.x}" y2="${next.y}" stroke="${VALEN_NAVY}" stroke-width="1.2" opacity="0.35"/>`;
    })
    .join('');

  const nodeDots = nodes
    .map(
      (node) =>
        `<circle cx="${node.x}" cy="${node.y}" r="7" fill="${VALEN_NAVY}"/><circle cx="${node.x}" cy="${node.y}" r="3" fill="${VALEN_MINT}"/>`,
    )
    .join('');

  return `
    ${edges}${peerEdges}
    <polygon points="${hexPoints(cx, cy, 22)}" fill="${VALEN_BLUE}" opacity="0.85"/>
    <circle cx="${cx}" cy="${cy}" r="10" fill="${VALEN_MINT}"/>
    <circle cx="${cx}" cy="${cy}" r="4" fill="${VALEN_NAVY}"/>
    ${nodeDots}
  `;
}

function orbitMotif(seed: number): string {
  const cx = 160;
  const cy = 72;
  const rings = [28, 46, 62];
  const ringsSvg = rings
    .map(
      (r, i) =>
        `<ellipse cx="${cx}" cy="${cy}" rx="${r + (seed % 5)}" ry="${r * 0.55}" fill="none" stroke="${i === 1 ? VALEN_BLUE : VALEN_NAVY}" stroke-width="${i === 1 ? 2 : 1.2}" opacity="${0.35 + i * 0.15}"/>`,
    )
    .join('');

  const satellites = Array.from({ length: 4 }, (_, i) => {
    const angle = (i / 4) * Math.PI * 2 + seed * 0.02;
    const r = 46 + (i % 2) * 16;
    const x = cx + Math.cos(angle) * r;
    const y = cy + Math.sin(angle) * r * 0.55;
    return `<rect x="${x - 5}" y="${y - 5}" width="10" height="10" rx="2" fill="${VALEN_NAVY}" transform="rotate(${angle * 57}, ${x}, ${y})"/>`;
  }).join('');

  return `
    ${ringsSvg}
    <circle cx="${cx}" cy="${cy}" r="18" fill="${VALEN_BLUE}" opacity="0.9"/>
    <rect x="${cx - 8}" y="${cy - 6}" width="16" height="12" rx="3" fill="${VALEN_MINT}"/>
    <circle cx="${cx - 3}" cy="${cy - 1}" r="1.5" fill="${VALEN_NAVY}"/>
    <circle cx="${cx + 3}" cy="${cy - 1}" r="1.5" fill="${VALEN_NAVY}"/>
    ${satellites}
  `;
}

function gridMotif(seed: number): string {
  const cx = 160;
  const cy = 72;
  const w = 88 + (seed % 16);
  const h = 56 + (seed % 10);
  const x = cx - w / 2;
  const y = cy - h / 2;

  const pins = Array.from({ length: 6 }, (_, i) => {
    const px = x + (i + 1) * (w / 7);
    return `<line x1="${px}" y1="${y - 8}" x2="${px}" y2="${y}" stroke="${VALEN_NAVY}" stroke-width="2"/>
            <line x1="${px}" y1="${y + h}" x2="${px}" y2="${y + h + 8}" stroke="${VALEN_NAVY}" stroke-width="2"/>`;
  }).join('');

  const gridLines = Array.from({ length: 5 }, (_, i) => {
    const gy = y + 10 + i * 9;
    return `<line x1="${x + 8}" y1="${gy}" x2="${x + w - 8}" y2="${gy}" stroke="${VALEN_BLUE}" stroke-width="0.8" opacity="0.4"/>`;
  }).join('');

  return `
    ${pins}
    <rect x="${x}" y="${y}" width="${w}" height="${h}" rx="8" fill="${VALEN_NAVY}" opacity="0.92"/>
    <rect x="${x + 6}" y="${y + 6}" width="${w - 12}" height="${h - 12}" rx="4" fill="${VALEN_MINT}" opacity="0.15"/>
    ${gridLines}
    <circle cx="${cx}" cy="${cy}" r="12" fill="${VALEN_BLUE}"/>
    <path d="M${cx - 5} ${cy} L${cx + 5} ${cy} M${cx} ${cy - 5} L${cx} ${cy + 5}" stroke="${VALEN_MINT}" stroke-width="2"/>
  `;
}

function waveMotif(seed: number): string {
  const offset = seed % 20;
  const waveA = `M0 ${80 + offset % 8} C60 ${40 + offset % 12}, 120 ${110 - offset % 10}, 200 ${70 + offset % 6} S300 ${50}, 320 ${90}`;
  const waveB = `M0 ${100 - offset % 6} C80 ${130}, 160 ${60}, 240 ${95} S310 ${120}, 320 ${85}`;

  const packets = Array.from({ length: 5 }, (_, i) => {
    const px = 40 + i * 55 + (seed % 15);
    const py = 58 + (i % 2) * 28;
    return `<rect x="${px}" y="${py}" width="14" height="14" rx="3" fill="${VALEN_NAVY}" opacity="0.85"/>
            <path d="M${px + 3} ${py + 7} L${px + 7} ${py + 7} L${px + 7} ${py + 4} L${px + 11} ${py + 7} L${px + 7} ${py + 10} L${px + 7} ${py + 7} Z" fill="${VALEN_MINT}"/>`;
  }).join('');

  return `
    <path d="${waveA}" fill="none" stroke="${VALEN_BLUE}" stroke-width="3" opacity="0.7"/>
    <path d="${waveB}" fill="none" stroke="${VALEN_NAVY}" stroke-width="2" opacity="0.45"/>
    ${packets}
    <circle cx="280" cy="52" r="16" fill="${VALEN_BLUE}" opacity="0.8"/>
    <polygon points="274,52 286,46 286,58" fill="${VALEN_MINT}"/>
  `;
}

function hexPoints(cx: number, cy: number, r: number): string {
  return Array.from({ length: 6 }, (_, i) => {
    const angle = (Math.PI / 3) * i - Math.PI / 6;
    return `${cx + Math.cos(angle) * r},${cy + Math.sin(angle) * r}`;
  }).join(' ');
}

function typeOverlay(agentType: AgentTypeValue): string {
  switch (agentType) {
    case 'external':
      return `<text x="24" y="128" font-family="monospace" font-size="22" font-weight="700" fill="${VALEN_NAVY}" opacity="0.25">{ API }</text>`;
    case 'service':
      return `<circle cx="290" cy="118" r="14" fill="none" stroke="${VALEN_NAVY}" stroke-width="2" opacity="0.35"/>
              <circle cx="290" cy="118" r="5" fill="${VALEN_BLUE}" opacity="0.5"/>`;
    case 'experimental':
      return `<polygon points="24,118 38,96 52,118" fill="${VALEN_LIME}" opacity="0.35"/>`;
    default:
      return `<path d="M24 118 L24 100 L32 94 L40 100 L40 118 Z" fill="${VALEN_BLUE}" opacity="0.2"/>`;
  }
}

export function buildAgentArtSvg(
  pattern: AgentVisualPattern,
  seed: number,
  glyph: string,
  agentType: string,
): string {
  const motif =
    pattern === 'orbit'
      ? orbitMotif(seed)
      : pattern === 'grid'
        ? gridMotif(seed)
        : pattern === 'wave'
          ? waveMotif(seed)
          : neuralMotif(seed);

  const typeKey = (agentType ?? 'hosted') as AgentTypeValue;

  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 320 144" width="320" height="144">
    <defs>
      <linearGradient id="bg" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stop-color="#FAFBFC"/>
        <stop offset="45%" stop-color="${VALEN_MINT}"/>
        <stop offset="100%" stop-color="#D6E8FF"/>
      </linearGradient>
      <radialGradient id="glow" cx="70%" cy="30%" r="60%">
        <stop offset="0%" stop-color="${VALEN_BLUE}" stop-opacity="0.18"/>
        <stop offset="100%" stop-color="${VALEN_MINT}" stop-opacity="0"/>
      </radialGradient>
    </defs>
    <rect width="320" height="144" fill="url(#bg)"/>
    <rect width="320" height="144" fill="url(#glow)"/>
    ${motif}
    ${typeOverlay(typeKey)}
    <text x="268" y="36" font-family="system-ui,sans-serif" font-size="28" font-weight="800" fill="${VALEN_NAVY}" opacity="0.08">${glyph}</text>
  </svg>`;
}

export function buildAgentArtDataUrl(
  pattern: AgentVisualPattern,
  seed: number,
  glyph: string,
  agentType: string,
): string {
  return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(buildAgentArtSvg(pattern, seed, glyph, agentType))}`;
}

export type AgentDitherSettings = {
  gridSize: number;
  ditherMode: 'bayer' | 'crosshatch' | 'halftone';
  colorMode: 'duotone';
  primaryColor: string;
  secondaryColor: string;
  threshold: number;
  contrast: number;
};

export function getAgentDitherSettings(seed: number, agentType: string): AgentDitherSettings {
  const modes: AgentDitherSettings['ditherMode'][] = ['bayer', 'crosshatch', 'halftone'];
  const typeKey = (agentType ?? 'hosted') as AgentTypeValue;

  let primaryColor = VALEN_NAVY;
  let secondaryColor = VALEN_MINT;

  if (typeKey === 'experimental') {
    primaryColor = '#1A3D0A';
    secondaryColor = '#EEFAE0';
  } else if (typeKey === 'external') {
    primaryColor = '#003D99';
    secondaryColor = '#E0EEFF';
  } else if (seed % 5 === 0) {
    primaryColor = VALEN_BLUE;
    secondaryColor = '#FAFBFC';
  }

  return {
    gridSize: seed % 3 === 0 ? 2 : 3,
    ditherMode: modes[seed % modes.length],
    colorMode: 'duotone',
    primaryColor,
    secondaryColor,
    threshold: 0.42 + (seed % 12) / 100,
    contrast: 1.08 + (seed % 5) * 0.04,
  };
}
