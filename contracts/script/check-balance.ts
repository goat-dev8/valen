import { ethers, network } from "hardhat";

async function main(): Promise<void> {
  const [deployer] = await ethers.getSigners();
  const address = await deployer.getAddress();
  const balance = await ethers.provider.getBalance(address);
  const net = await ethers.provider.getNetwork();
  console.log(JSON.stringify({
    network: network.name,
    chainId: net.chainId.toString(),
    deployer: address,
    balanceWei: balance.toString(),
    balanceEth: ethers.formatEther(balance),
  }, null, 2));
  if (balance === 0n) {
    process.exitCode = 2;
  }
}

main().catch((error: unknown) => {
  console.error(error);
  process.exitCode = 1;
});
