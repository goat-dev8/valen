import { deployValen } from "./lib/deploy-valen";

async function main(): Promise<void> {
  const record = await deployValen();
  if (record.chainId !== "46630") {
    throw new Error(`Expected Robinhood Testnet chainId 46630, got ${record.chainId}`);
  }
  console.log(JSON.stringify(record, null, 2));
}

main().catch((error: unknown) => {
  console.error(error);
  process.exitCode = 1;
});
