import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  Address,
  Hex,
  createPublicClient,
  createWalletClient,
  hexToSignature,
  http,
  parseAbi,
} from 'viem';
import { privateKeyToAccount } from 'viem/accounts';
import { AppConfig } from '../../config/config.types';

const USDC_SEPOLIA = '0x75faf114eafb1BDbe2F0316DF893fd58CE46AA4d' as Address;

const usdcAbi = parseAbi([
  'function transferWithAuthorization(address from, address to, uint256 value, uint256 validAfter, uint256 validBefore, bytes32 nonce, uint8 v, bytes32 r, bytes32 s) external returns (bool)',
  'function balanceOf(address account) view returns (uint256)',
]);

@Injectable()
export class X402ChainService {
  constructor(private readonly configService: ConfigService<AppConfig, true>) {}

  async settleWithAuthorization(input: {
    recipient: Address;
    amount: bigint;
    nonce: Hex;
  }): Promise<{ txHash: Hex; from: Address; nonce: Hex }> {
    const privateKey = this.configService.get('settlementPrivateKey', { infer: true });
    const account = privateKeyToAccount(privateKey);
    const rpcUrl = this.configService.get('arbitrumSepoliaRpcUrl', { infer: true });
    const publicClient = createPublicClient({ transport: http(rpcUrl) });
    const walletClient = createWalletClient({
      account,
      transport: http(rpcUrl),
    });

    const balance = await publicClient.readContract({
      address: USDC_SEPOLIA,
      abi: usdcAbi,
      functionName: 'balanceOf',
      args: [account.address],
    });
    if (balance < input.amount) {
      throw new Error(`Insufficient USDC for x402 settlement: have ${balance}, need ${input.amount}`);
    }

    const validAfter = 0n;
    const validBefore = BigInt(Math.floor(Date.now() / 1000) + 3600);
    const signature = await account.signTypedData({
      domain: {
        name: 'USD Coin',
        version: '2',
        chainId: 421614,
        verifyingContract: USDC_SEPOLIA,
      },
      types: {
        TransferWithAuthorization: [
          { name: 'from', type: 'address' },
          { name: 'to', type: 'address' },
          { name: 'value', type: 'uint256' },
          { name: 'validAfter', type: 'uint256' },
          { name: 'validBefore', type: 'uint256' },
          { name: 'nonce', type: 'bytes32' },
        ],
      },
      primaryType: 'TransferWithAuthorization',
      message: {
        from: account.address,
        to: input.recipient,
        value: input.amount,
        validAfter,
        validBefore,
        nonce: input.nonce,
      },
    });

    const { v, r, s } = hexToSignature(signature);
    const txHash = await walletClient.writeContract({
      address: USDC_SEPOLIA,
      abi: usdcAbi,
      functionName: 'transferWithAuthorization',
      args: [
        account.address,
        input.recipient,
        input.amount,
        validAfter,
        validBefore,
        input.nonce,
        Number(v),
        r,
        s,
      ],
      chain: null,
    });
    const receipt = await publicClient.waitForTransactionReceipt({ hash: txHash });
    if (receipt.status !== 'success') {
      throw new Error(`x402 USDC settlement reverted: ${txHash}`);
    }

    return { txHash, from: account.address, nonce: input.nonce };
  }
}
