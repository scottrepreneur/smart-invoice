/* eslint-disable no-console */
const { ethers, network } = require("hardhat");
const {
  getZapData,
  getFactory,
  getWrappedTokenAddress,
} = require("./constants");
const {
  readDeploymentInfo,
  writeDeploymentInfo,
  addZapInstance,
  verifyContract,
} = require("./utils");

async function main() {
  const [deployer] = await ethers.getSigners();
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

  await safeSplitsEscrowZap.deployTransaction.wait(5);

  await verifyContract(chainId, safeSplitsEscrowZap.address, [
    zapData.dao,
    zapData.safeSingleton,
    zapData.safeFactory,
    zapData.splitMain,
    zapData.spoilsManager,
    getFactory(chainId),
    getWrappedTokenAddress(chainId),
  ]);

  const deploymentInfo = readDeploymentInfo(network.name);
  const updatedData = addZapInstance(
    deploymentInfo,
    safeSplitsEscrowZap.address,
  );
  writeDeploymentInfo(updatedData, network.name);
}

main()
  .then(() => process.exit(0))
  .catch(error => {
    // eslint-disable-next-line no-console
    console.error(error);
    process.exit(1);
  });
