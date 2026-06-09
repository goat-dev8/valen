import { readFileSync } from "fs";
import { join } from "path";
import { run, network } from "hardhat";

async function verify(address: string, constructorArguments: unknown[] = []) {
  try {
    await run("verify:verify", { address, constructorArguments });
    console.log(`Verified ${address}`);
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    if (message.toLowerCase().includes("already verified")) {
      console.log(`Already verified ${address}`);
      return;
    }
    throw error;
  }
}

async function main(): Promise<void> {
  const deployment = JSON.parse(readFileSync(join("deployments", network.name, "deployment.json"), "utf8"));
  for (const [name, entry] of Object.entries<Record<string, { address: string; implementation?: string }>>(deployment.contracts)) {
    if (entry.implementation) {
      await verify(entry.implementation);
    }
    await verify(entry.address);
    console.log(`Verification attempted for ${name}`);
  }
}

main().catch((error: unknown) => {
  console.error(error);
  process.exitCode = 1;
});
