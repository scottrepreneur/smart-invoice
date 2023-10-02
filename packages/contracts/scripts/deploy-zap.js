/* eslint-disable no-console */
const { ethers } = require("hardhat");
const {
  getZapData,
  getFactory,
  getWrappedTokenAddress,
} = require("./constants");

async function main() {
  const [deployer] = await ethers.getSigners();
  // const address = await deployer.getAddress();
  const { chainId } = await deployer.provider.getNetwork();

  // todo handle other networks
  if (chainId !== 5 && chainId !== 31337) return;

  const SafeSplitsEscrowZap = await ethers.getContractFactory(
    "SafeSplitsEscrowZap",
  );

  const zapData = getZapData(chainId);
  const safeSplitsEscrowZap = await SafeSplitsEscrowZap.deploy(
    zapData.dao,
    zapData.safeSingleton,
    zapData.safeFactory,
    zapData.splitMain,
    zapData.spoilsManager,
    getFactory(chainId),
    getWrappedTokenAddress(chainId),
  );
  await safeSplitsEscrowZap.deployed();
  console.log("Safe-Splits-Escrow Zap Address:", safeSplitsEscrowZap.address);

  // handle append to deployments file
}

main()
  .then(() => process.exit(0))
  .catch(error => {
    // eslint-disable-next-line no-console
    console.error(error);
    process.exit(1);
  });
