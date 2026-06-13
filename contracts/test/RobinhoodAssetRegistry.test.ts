import { expect } from "chai";
import { ethers } from "hardhat";

function ticker(value: string) {
  return ethers.encodeBytes32String(value);
}

describe("RobinhoodAssetRegistry", function () {
  it("registers verified USDG and metadata-only stock tickers", async function () {
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
      ethers.ZeroAddress,
      18,
      false,
      "metadata-only",
      "https://blog.arbitrum.io/robinhood-chain-testnet/",
    );

    const usdg = await registry.getAsset(ticker("USDG"));
    expect(usdg.verified).to.equal(true);
    expect(usdg.decimals).to.equal(6);

    const tsla = await registry.getAsset(ticker("TSLA"));
    expect(tsla.token).to.equal(ethers.ZeroAddress);
    expect(tsla.verified).to.equal(false);
    expect(tsla.supportLevel).to.equal("metadata-only");
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
