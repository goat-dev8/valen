import { readFileSync } from "fs";
import { join } from "path";
import { ethers, network } from "hardhat";

const STOCK_TOKENS = {
  TSLA: "0xC9f9c86933092BbbfFF3CCb4b105A4A94bf3Bd4E",
  AMZN: "0x5884aD2f920c162CFBbACc88C9C51AA75eC09E02",
  PLTR: "0x1FBE1a0e43594b3455993B5dE5Fd0A7A266298d0",
  NFLX: "0x3b8262A63d25f0477c4DDE23F83cfe22Cb768C93",
  AMD: "0x71178BAc73cBeb415514eB542a8995b82669778d",
} as const;

async function main(): Promise<void> {
  const deployment = JSON.parse(
    readFileSync(join("deployments", network.name, "deployment.json"), "utf8"),
  );
  const address = deployment.contracts.RobinhoodAssetRegistry?.address;
  if (!address) throw new Error("RobinhoodAssetRegistry missing from deployment manifest");
  const registry = await ethers.getContractAt("RobinhoodAssetRegistry", address);

  const usdg = await registry.getAsset(ethers.encodeBytes32String("USDG"));
  if (!usdg.verified || usdg.decimals !== 6n || usdg.supportLevel !== "demo-ready") {
    throw new Error("USDG registry record is not demo-ready with 6 decimals");
  }

  for (const [ticker, tokenAddress] of Object.entries(STOCK_TOKENS)) {
    const record = await registry.getAsset(ethers.encodeBytes32String(ticker));
    if (!record.verified || record.token !== tokenAddress || record.supportLevel !== "demo-ready") {
      throw new Error(`${ticker} registry record is not demo-ready with verified token ${tokenAddress}`);
    }
  }

  console.log(
    JSON.stringify(
      {
        network: network.name,
        registry: address,
        verified: ["USDG", ...Object.keys(STOCK_TOKENS)],
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
