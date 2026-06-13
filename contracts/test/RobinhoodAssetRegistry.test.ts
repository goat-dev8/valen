import { expect } from "chai";
import { ethers } from "hardhat";

function ticker(value: string) {
  return ethers.encodeBytes32String(value);
}

const STOCK_TOKENS = {
  TSLA: "0xC9f9c86933092BbbfFF3CCb4b105A4A94bf3Bd4E",
  AMZN: "0x5884aD2f920c162CFBbACc88C9C51AA75eC09E02",
  PLTR: "0x1FBE1a0e43594b3455993B5dE5Fd0A7A266298d0",
  NFLX: "0x3b8262A63d25f0477c4DDE23F83cfe22Cb768C93",
  AMD: "0x71178BAc73cBeb415514eB542a8995b82669778d",
} as const;

describe("RobinhoodAssetRegistry", function () {
  it("registers verified USDG and demo-ready stock tickers", async function () {
    const [admin] = await ethers.getSigners();
    const registry = await ethers.deployContract("RobinhoodAssetRegistry", [
      await admin.getAddress(),
    ]);

    await expect(
      registry.registerAsset(
        ticker("USDG"),
        "0x7E955252E15c84f5768B83c41a71F9eba181802F",
        6,
        true,
        "demo-ready",
        "https://docs.robinhood.com/chain/contracts/",
      ),
    ).to.emit(registry, "RobinhoodAssetRegistered");

    await registry.registerAsset(
      ticker("TSLA"),
      STOCK_TOKENS.TSLA,
      18,
      true,
      "demo-ready",
      "https://docs.robinhood.com/chain/contracts/",
    );

    const usdg = await registry.getAsset(ticker("USDG"));
    expect(usdg.verified).to.equal(true);
    expect(usdg.decimals).to.equal(6);

    const tsla = await registry.getAsset(ticker("TSLA"));
    expect(tsla.token).to.equal(STOCK_TOKENS.TSLA);
    expect(tsla.verified).to.equal(true);
    expect(tsla.supportLevel).to.equal("demo-ready");
  });

  it("requires token address when an asset is marked verified", async function () {
    const [admin] = await ethers.getSigners();
    const registry = await ethers.deployContract("RobinhoodAssetRegistry", [
      await admin.getAddress(),
    ]);

    await expect(
      registry.registerAsset(
        ticker("TSLA"),
        ethers.ZeroAddress,
        18,
        true,
        "settlement-ready",
        "https://example.com",
      ),
    ).to.be.revertedWithCustomError(registry, "ZeroAddress");
  });
});
