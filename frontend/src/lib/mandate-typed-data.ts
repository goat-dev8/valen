import { getAddress } from 'viem';

const EIP712_DOMAIN_TYPES = [
  { name: 'name', type: 'string' },
  { name: 'version', type: 'string' },
  { name: 'chainId', type: 'uint256' },
] as const;

type ApiTypedData = {
  domain: Record<string, unknown>;
  types: Record<string, Array<{ name: string; type: string }>>;
  primaryType: string;
  message: Record<string, unknown>;
};

export function prepareMandateTypedDataForSigning(apiTypedData: ApiTypedData) {
  const message = { ...apiTypedData.message };
  if (typeof message.signer === 'string') {
    message.signer = getAddress(message.signer);
  }
  if (message.chainId !== undefined) {
    message.chainId = Number(message.chainId);
  }

  const domain = { ...apiTypedData.domain };
  if (domain.chainId !== undefined) {
    domain.chainId = Number(domain.chainId);
  }

  return {
    domain,
    types: {
      EIP712Domain: [...EIP712_DOMAIN_TYPES],
      ...apiTypedData.types,
    },
    primaryType: apiTypedData.primaryType,
    message,
  };
}
