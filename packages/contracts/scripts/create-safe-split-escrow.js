/* eslint-disable no-console */
const { ethers } = require("hardhat");
const { getZapData, getWrappedTokenAddress } = require("./constants");

const {
  abi: zapAbi,
} = require("../build/contracts/SafeSplitsEscrowZap.sol/SafeSplitsEscrowZap.json");

const ZAP_DATA = {
  // to be sorted
  owners: ["0xa", "0xb"], // safe owners and raid party split participants
  percentAllocation: [500000, 500000], // raid party split percent allocations // current split main is 1e7
  milestoneAmounts: [100, 100], // escrow milestone amounts
  threshold: 1, // threshold
  saltNonce: 1696276869590, // salt nonce
  isDaoSplit: false, // isDaoSplit
  client: "0xc", // client
  resolver: "0xd", // resolver
  token: getWrappedTokenAddress(5), // token
  escrowDeadline: 1696296962, // deadline
  details: ethers.utils.formatBytes32String("ipfs://"), // details
};

async function main() {
  const [deployer] = await ethers.getSigners();
  const { chainId } = await deployer.provider.getNetwork();

  const zapData = getZapData(chainId);
  const safeSplitsEscrowZapAddress = zapData.instances && zapData.instances[0];

  if (!safeSplitsEscrowZapAddress) {
    console.log("No Safe-Splits-Escrow Zap Deployed");
    return;
  }

  const safeSplitsEscrowZap = new ethers.Contract(
    safeSplitsEscrowZapAddress,
    zapAbi,
    deployer,
  );

  const safeSplitEscrowReceipt = await safeSplitsEscrowZap.createSafeSplitEscrow(
    ZAP_DATA.owners,
    ZAP_DATA.percentAllocation,
    ZAP_DATA.milestoneAmounts,
    ZAP_DATA.threshold,
    ZAP_DATA.saltNonce,
    ZAP_DATA.isDaoSplit,
    ZAP_DATA.client,
    ZAP_DATA.resolver,
    ZAP_DATA.token,
    ZAP_DATA.escrowDeadline,
    ZAP_DATA.details,
  );
  const safeSplitEscrow = await safeSplitEscrowReceipt.wait();
  console.log(safeSplitEscrow);
}

main()
  .then(() => process.exit(0))
  .catch(error => {
    console.error(error);
    process.exit(1);
  });
