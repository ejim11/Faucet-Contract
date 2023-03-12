const ethers = require("ethers");
const { run, network } = require("hardhat");
require("dotenv").config();

async function main() {
  const FaucetContractFactory = await hre.ethers.getContractFactory("Faucet");

  const amount = ethers.utils.parseUnits("0.3", "ether");

  const faucetContract = await FaucetContractFactory.deploy({ value: amount });

  await faucetContract.deployed();

  console.log("address: ", faucetContract.address);

  if (network.config.chainId === 11155111 && process.env.ETHERSCAN_API_KEY) {
    await faucetContract.deployTransaction.wait(6);
    await verify(faucetContract.address, []);
  }
}

async function verify(address, args) {
  try {
    await run("verify:verify", {
      address,
      address,
      constructorArguments: args,
    });
  } catch (err) {
    if (err.message.toLowerCase().includes("already verified")) {
      console.log("verified");
    } else {
      console.log(err);
    }
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
