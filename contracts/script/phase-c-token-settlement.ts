import { readFileSync, writeFileSync } from "fs";
import { join } from "path";
import { ethers, network } from "hardhat";

type DeploymentRecord = {
  network: string;
  chainId: string;
  contracts: Record<string, { address: string; txHash?: string; implementation?: string }>;
  phaseC?: {
    tokenSettlementConfiguredAt: string;
    tokenAsset: string;
    tokenSymbol: string;
    allowanceTxHash?: string;
    upgradeTxHash?: string;
    adapterTxHash?: string;
    configureTxHashes: string[];
  };
};

const TOKEN_BY_CHAIN: Record<
  string,
  { symbol: string; address: string; approveAmount: bigint }
> = {
  "421614": {
    symbol: "USDC",
    address: "0x75faf114eafb1BDbe2F0316DF893fd58CE46AA4d",
    approveAmount: 10_000_000n, // 10 USDC at 6 decimals for testnet demos.
  },
  "46630": {
    symbol: "USDG",
    address: "0x7E955252E15c84f5768B83c41a71F9eba181802F",
    approveAmount: 10_000_000n, // 10 USDG at 6 decimals on Robinhood Testnet.
  },
};

const erc20Abi = [
  "function approve(address spender,uint256 amount) returns (bool)",
  "function allowance(address owner,address spender) view returns (uint256)",
  "function balanceOf(address account) view returns (uint256)",
] as const;

async function waitTx(tx: { wait: () => Promise<{ hash?: string } | null>; hash: string }) {
  const receipt = await tx.wait();
  return receipt?.hash ?? tx.hash;
}

async function main(): Promise<void> {
  const deploymentPath = join("deployments", network.name, "deployment.json");
  const deployment = JSON.parse(readFileSync(deploymentPath, "utf8")) as DeploymentRecord;
  const token = TOKEN_BY_CHAIN[deployment.chainId];
  if (!token) {
    throw new Error(`No Phase C token configured for chain ${deployment.chainId}`);
  }

  const [deployer] = await ethers.getSigners();
  const deployerAddress = await deployer.getAddress();
  const settlementAddress = deployment.contracts.ValenSettlement.address;
  const Settlement = await ethers.getContractFactory("ValenSettlement");
  const settlement = Settlement.attach(settlementAddress);

  const nextImplementation = await Settlement.deploy();
  await nextImplementation.waitForDeployment();
  const nextImplementationAddress = await nextImplementation.getAddress();

  const upgraderRole = ethers.id("UPGRADER_ROLE");
  const defaultAdminRole = ethers.ZeroHash;
  if (!(await settlement.hasRole(defaultAdminRole, deployerAddress))) {
    throw new Error(`${deployerAddress} is not DEFAULT_ADMIN_ROLE on ValenSettlement`);
  }

  let grantedUpgrader = false;
  if (!(await settlement.hasRole(upgraderRole, deployerAddress))) {
    await waitTx(await settlement.grantValenRole(upgraderRole, deployerAddress));
    grantedUpgrader = true;
  }

  const upgradeTxHash = await waitTx(
    await settlement.upgradeToAndCall(nextImplementationAddress, "0x"),
  );

  const Adapter = await ethers.getContractFactory("ValenTokenSettlementAdapter");
  const adapter = await Adapter.deploy(settlementAddress);
  await adapter.waitForDeployment();
  const adapterAddress = await adapter.getAddress();
  const adapterTxHash = adapter.deploymentTransaction()?.hash;

  const configureTxHashes: string[] = [];
  configureTxHashes.push(await waitTx(await settlement.setTokenSettlementAdapter(adapterAddress)));
  configureTxHashes.push(await waitTx(await settlement.setTokenSettlementAsset(token.address, true)));

  const tokenContract = await ethers.getContractAt(erc20Abi, token.address);
  const balance = await tokenContract.balanceOf(deployerAddress);
  if (balance < token.approveAmount) {
    throw new Error(
      `${token.symbol} relayer balance too low: have ${balance}, need ${token.approveAmount}`,
    );
  }
  const currentAllowance = await tokenContract.allowance(deployerAddress, adapterAddress);
  const allowanceTxHash =
    currentAllowance >= token.approveAmount
      ? undefined
      : await waitTx(await tokenContract.approve(adapterAddress, token.approveAmount));

  if (grantedUpgrader) {
    await waitTx(await settlement.revokeValenRole(upgraderRole, deployerAddress));
  }

  deployment.contracts.ValenSettlement.implementation = nextImplementationAddress;
  deployment.contracts.ValenTokenSettlementAdapter = {
    address: adapterAddress,
    txHash: adapterTxHash,
  };
  deployment.phaseC = {
    tokenSettlementConfiguredAt: new Date().toISOString(),
    tokenAsset: token.address,
    tokenSymbol: token.symbol,
    allowanceTxHash,
    upgradeTxHash,
    adapterTxHash,
    configureTxHashes,
  };

  writeFileSync(deploymentPath, `${JSON.stringify(deployment, null, 2)}\n`);

  console.log(
    JSON.stringify(
      {
        network: network.name,
        chainId: deployment.chainId,
        settlement: settlementAddress,
        implementation: nextImplementationAddress,
        adapter: adapterAddress,
        token: {
          symbol: token.symbol,
          address: token.address,
          approveAmount: token.approveAmount.toString(),
        },
        upgradeTxHash,
        adapterTxHash,
        allowanceTxHash,
        configureTxHashes,
      },
      null,
      2,
    ),
  );
}

main().catch((error: unknown) => {
  console.error(error);
  process.exitCode = 1;
});
