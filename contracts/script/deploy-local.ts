import { deployValen } from "./lib/deploy-valen";

async function main(): Promise<void> {
  const record = await deployValen();
  console.log(JSON.stringify(record, null, 2));
}

main().catch((error: unknown) => {
  console.error(error);
  process.exitCode = 1;
});
