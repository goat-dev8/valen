import { Hex, keccak256, stringToHex } from 'viem';

/** Matches ethers.id(agentUuid) used in contract deploy scripts. */
export function agentKeyFromId(agentId: string): Hex {
  return keccak256(stringToHex(agentId.trim()));
}
