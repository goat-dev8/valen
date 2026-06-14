/** Short agent id for disambiguation (first 8 chars). */
export function shortAgentId(agentId: string): string {
  return agentId.slice(0, 8);
}

/** Display agent name with short id — e.g. bot 3 (d7316122). */
export function formatAgentDisplayName(name: string, agentId: string): string {
  return `${name} (${shortAgentId(agentId)})`;
}
