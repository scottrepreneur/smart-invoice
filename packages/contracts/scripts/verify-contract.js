/* eslint-disable no-console */
const { getWrappedTokenAddress, getFactory } = require("./constants");
const { verifyContract } = require("./utils");

async function main() {
  const result = await verifyContract(
    5, // chainId,
    "0x547A325E76AD9cb09a9C999112844c9951EA08Fa", // contractAddress,
    [
      "0xa4161db839f84e27122398ae6337ad47765e6cd5",
      "0x3E5c63644E683549055b9Be8653de26E0B4CD36E",
      "0xa6B71E26C5e0845f74c812102Ca7114b6a896AB2",
      "0x2ed6c4B5dA6378c7897AC67Ba9e43102Feb694EE",
      "0xc98ecFeBB790D971EF7390043b168C9D8e103C5d",
      getFactory(5),
      getWrappedTokenAddress(5),
    ], // constructorArguments,
  );
  console.log("verified", result);
}

main()
  .then(() => process.exit(0))
  .catch(error => {
    console.error(error);
    process.exit(1);
  });
