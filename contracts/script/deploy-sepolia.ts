import { deployValen } from "./lib/deploy-valen";

async function main(): Promise<void> {
  const record = await deployValen();
  if (record.chainId !== "421614") {
    throw new Error(`Expected Arbitrum Sepolia chainId 421614, got ${record.chainId}`);
  }
  console.log(JSON.stringify(record, null, 2));
}

main().catch((error: unknown) => {
  console.error(error);
  process.exitCode = 1;
});
