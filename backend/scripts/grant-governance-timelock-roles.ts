/**
 * One-time on-chain fix: grant ValenGovernance PROPOSER_ROLE + EXECUTOR_ROLE on ValenTimelock.
 * Required for queueAction / executeAction (deploy script omitted this step).
 */
import 'dotenv/config';
import { readFileSync } from 'fs';
import { join } from 'path';
import {
  createPublicClient,
  createWalletClient,
  http,
  parseAbi,
  type Address,
  type Hex,
} from 'viem';
import { privateKeyToAccount } from 'viem/accounts';
import { arbitrumSepolia } from 'viem/chains';

const timelockAbi = parseAbi([
  'function PROPOSER_ROLE() view returns (bytes32)',
  'function EXECUTOR_ROLE() view returns (bytes32)',
  'function hasRole(bytes32 role, address account) view returns (bool)',
  'function grantRole(bytes32 role, address account)',
]);

async function main() {
  const privateKey = process.env.PRIVATE_KEY as Hex | undefined;
  const rpcUrl = process.env.ARBITRUM_SEPOLIA_RPC_URL;
  if (!privateKey || !rpcUrl) {
    throw new Error('PRIVATE_KEY and ARBITRUM_SEPOLIA_RPC_URL required');
  }

  const deployment = JSON.parse(
    readFileSync(
      join(process.cwd(), '..', 'contracts', 'deployments', 'arbitrum-sepolia', 'deployment.json'),
      'utf8',
    ),
  ) as {
    contracts: {
      ValenGovernance: { address: string };
      ValenTimelock: { address: string };
    };
  };

  const governanceAddress = deployment.contracts.ValenGovernance.address as Address;
  const timelockAddress = deployment.contracts.ValenTimelock.address as Address;
  const account = privateKeyToAccount(privateKey);

  const publicClient = createPublicClient({
    chain: arbitrumSepolia,
    transport: http(rpcUrl),
  });
  const walletClient = createWalletClient({
    account,
    chain: arbitrumSepolia,
    transport: http(rpcUrl),
  });

  const [proposerRole, executorRole] = await Promise.all([
    publicClient.readContract({
      address: timelockAddress,
      abi: timelockAbi,
      functionName: 'PROPOSER_ROLE',
    }),
    publicClient.readContract({
      address: timelockAddress,
      abi: timelockAbi,
      functionName: 'EXECUTOR_ROLE',
    }),
  ]);

  const [hasProposer, hasExecutor] = await Promise.all([
    publicClient.readContract({
      address: timelockAddress,
      abi: timelockAbi,
      functionName: 'hasRole',
      args: [proposerRole, governanceAddress],
    }),
    publicClient.readContract({
      address: timelockAddress,
      abi: timelockAbi,
      functionName: 'hasRole',
      args: [executorRole, governanceAddress],
    }),
  ]);

  console.log('GOVERNANCE', governanceAddress);
  console.log('TIMELOCK', timelockAddress);
  console.log('HAS_PROPOSER_ROLE', hasProposer);
  console.log('HAS_EXECUTOR_ROLE', hasExecutor);

  if (!hasProposer) {
    const txHash = await walletClient.writeContract({
      address: timelockAddress,
      abi: timelockAbi,
      functionName: 'grantRole',
      args: [proposerRole, governanceAddress],
    });
    const receipt = await publicClient.waitForTransactionReceipt({ hash: txHash });
    console.log('GRANT_PROPOSER_TX', txHash, 'block', receipt.blockNumber.toString());
  }

  if (!hasExecutor) {
    const txHash = await walletClient.writeContract({
      address: timelockAddress,
      abi: timelockAbi,
      functionName: 'grantRole',
      args: [executorRole, governanceAddress],
    });
    const receipt = await publicClient.waitForTransactionReceipt({ hash: txHash });
    console.log('GRANT_EXECUTOR_TX', txHash, 'block', receipt.blockNumber.toString());
  }

  console.log('DONE');
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
