# Simple Token Vesting

I built this project as part of the Web3 Talents 2026 program. We just finished Topic 7 on EVM architecture, and I wanted to get a head start on Topic 8 (Smart Contracts and ERC-20) by building a real vesting system. 

## What is in here

### Contracts
- **VestingToken.sol**: A standard ERC-20 token using OpenZeppelin. I use this to fund the vesting contract.
- **TokenVesting.sol**: The main logic. It handles the linear release, a cliff period, and an optional revoke function for the owner.

### Tech Stack
- Solidity 0.8.24
- Hardhat 3 (ESM architecture)
- Ethers.js v6
- OpenZeppelin 5.0

## Why Hardhat 3?
Most tutorials use Hardhat 2, but I wanted to try the new version. It uses ESM by default and has a better way to handle secrets called the Keystore. It took a bit of time to get the config right, but the architecture feels much cleaner.

## Getting Started

### Install
```bash
npm install
```

### Run Tests
I wrote 5 test cases in TypeScript to check the linear math, the cliff lock, and the owner permissions.
```bash
npx hardhat test
```

### Deploy
I used the Hardhat 3 Keystore instead of a .env file. If you want to deploy this yourself, you need to set your keys first:
```bash
npx hardhat keystore set SEPOLIA_RPC_URL
npx hardhat keystore set PRIVATE_KEY
npx hardhat keystore set ETHERSCAN_API_KEY
```
Then run the deployment script:
```bash
npx hardhat run scripts/deploy.ts --network sepolia
```

## Project Goals
The goal was to move from data analysis and SQL into actual smart contract development during the Web3 Talents program. 