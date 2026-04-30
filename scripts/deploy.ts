import { network } from "hardhat";

async function main() {
  // Use getOrCreate for HH3 stable connection
  const connection = await network.getOrCreate();
  const { ethers } = connection;

  console.log("starting deployment...");

  const [deployer] = await ethers.getSigners();
  console.log("deploying with account:", deployer.address);

  // 1. deploy the token
  const initialSupply = ethers.parseEther("1000000"); // 1 million tokens
  const VestingToken = await ethers.getContractFactory("VestingToken");
  const token = await VestingToken.deploy("Vesting Token", "VTK", initialSupply);

  await token.waitForDeployment();
  const tokenAddress = await token.getAddress();
  console.log("token deployed to:", tokenAddress);

  // 2. deploy the vesting contract
  const TokenVesting = await ethers.getContractFactory("TokenVesting");
  const vesting = await TokenVesting.deploy(tokenAddress);

  await vesting.waitForDeployment();
  const vestingAddress = await vesting.getAddress();
  console.log("vesting contract deployed to:", vestingAddress);

  // Check the network type to decide on waiting for confirmations
  // In HH3, connection has information about the network
  const networkConfig = connection.networkConfig;
  
  if (networkConfig.type === "http") {
    console.log("waiting for 5 confirmations...");
    const deploymentTx = vesting.deploymentTransaction();
    if (deploymentTx) {
        await deploymentTx.wait(5);
        console.log("5 blocks confirmed!");
    }
  } else {
    console.log("local network detected, skipping confirmations.");
  }

  console.log("all done!");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
