import { defineConfig, configVariable } from "hardhat/config";
import ethersToolbox from "@nomicfoundation/hardhat-toolbox-mocha-ethers";

export default defineConfig({
  plugins: [ethersToolbox],

  solidity: {
    version: "0.8.24",
  },

  networks: {
    hardhat: {
      type: "edr-simulated",
    },
    sepolia: {
      type: "http",
      url: configVariable("SEPOLIA_RPC_URL"),
      accounts: [configVariable("PRIVATE_KEY")],
    },
  },

  etherscan: {
    apiKey: configVariable("ETHERSCAN_API_KEY"),
  },
});
