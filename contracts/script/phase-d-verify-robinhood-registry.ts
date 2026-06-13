import { readFileSync } from "fs";
import { join } from "path";
import { ethers, network } from "hardhat";

const STOCK_TICKERS = ["TSLA", "AMZN", "PLTR", "NFLX", "AMD"] as const;

async function main(): Promise<void> {
  const deployment = JSON.parse(
    readFileSync(join("deployments", network.name, "deployment.json"), "utf8"),
  );
  const address = deployment.contracts.RobinhoodAssetRegistry?.address;
  if (!address) throw new Error("RobinhoodAssetRegistry missing from deployment manifest");
  const registry = await ethers.getContractAt("RobinhoodAssetRegistry", address);

  const usdg = await registry.getAsset(ethers.encodeBytes32String("USDG"));
  if (!usdg.verified || usdg.decimals !== 6n) {
    throw new Error("USDG registry record is not verified with 6 decimals");
  }

  for (const ticker of STOCK_TICKERS) {
    const record = await registry.getAsset(ethers.encodeBytes32String(ticker));
    if (record.verified || record.token !== ethers.ZeroAddress || record.supportLevel !== "metadata-only") {
      throw new Error(`${ticker} registry record is not metadata-only`);
    }
  }

  console.log(
    JSON.stringify(
      {
        network: network.name,
        registry: address,
        verified: ["USDG", ...STOCK_TICKERS],
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
