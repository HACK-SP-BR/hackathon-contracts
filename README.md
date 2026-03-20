# HackSP Voting Contracts

Smart contracts for the HackSP hackathon voting system.

This repository is part of a project created for the HackSP community, a community made by and for high school students in Sao Paulo. The goal of this application is to run hackathon voting with Web3 infrastructure so the process is more transparent, auditable, and harder to manipulate.

## Why We Built This

Hackathons need trust.

When participants, mentors, and organizers look at the final results, they should be able to understand that:

- the voting rules were defined in code
- each allowed wallet can vote only once
- votes are stored on-chain
- the final result can be checked publicly

Using a smart contract does not replace good event organization, but it gives HackSP a transparent voting layer that the community can inspect.

## What This Contract Does

The main contract is [`contracts/HackathonVoting.sol`](/home/dweg0/Documents/hacksp/admin-painel/contracts/contracts/HackathonVoting.sol).

It allows the contract owner to:

- create a new hackathon
- add projects to that hackathon
- register voter wallets
- define the voter role
- open and close the voting period

It allows registered wallets to:

- vote once in a specific hackathon

It also provides read functions to:

- check project vote totals
- check whether a wallet has already voted
- check whether a wallet is allowed to vote
- check how many projects exist in a hackathon

## Voting Logic

The contract currently uses two voter roles:

- `Team`: vote weight = `1`
- `Mentor`: vote weight = `3`

This means mentors have a higher voting weight than team members. Every registered wallet can vote only one time per hackathon.

## Project Structure

- [`contracts/HackathonVoting.sol`](/home/dweg0/Documents/hacksp/admin-painel/contracts/contracts/HackathonVoting.sol): main smart contract
- [`scripts/deploy.ts`](/home/dweg0/Documents/hacksp/admin-painel/contracts/scripts/deploy.ts): deployment script
- [`test/test.ts`](/home/dweg0/Documents/hacksp/admin-painel/contracts/test/test.ts): integration-style test script
- [`hardhat.config.ts`](/home/dweg0/Documents/hacksp/admin-painel/contracts/hardhat.config.ts): Hardhat network configuration
- [`deployments.json`](/home/dweg0/Documents/hacksp/admin-painel/contracts/deployments.json): deployed contract addresses by environment
- [`.env.sample`](/home/dweg0/Documents/hacksp/admin-painel/contracts/.env.sample): environment variable template

## Environment Files

This project loads environment variables from files named:

- `.env.local`
- `.env.dev`
- `.env.prod`

The file used depends on the `ENV` value passed to the scripts.

Use [`.env.sample`](/home/dweg0/Documents/hacksp/admin-painel/contracts/.env.sample) as the base template:

```env
RPC_URL=http://127.0.0.1:8545
PRIVATE_KEY=0xYOUR_PRIVATE_KEY
CHAIN_ID=31337
CHAIN_TYPE=l1

ENV=local
CONTRACT_NAME=HackathonVoting
```

Create the environment files by copying the sample and adjusting the values for each network.

Example:

```bash
cp .env.sample .env.local
cp .env.sample .env.dev
cp .env.sample .env.prod
```

## What Each Environment Variable Means

- `RPC_URL`: blockchain RPC endpoint used by Hardhat, deployment scripts, and tests
- `PRIVATE_KEY`: wallet private key used to deploy and interact with the contract
- `CHAIN_ID`: numeric chain identifier for the target network
- `CHAIN_TYPE`: Hardhat chain type, currently expected as `l1` or `op`
- `ENV`: selects which environment file and deployment namespace to use
- `CONTRACT_NAME`: contract name to deploy, currently `HackathonVoting`

## Why We Create These Environment Files

We create separate environment files so the same codebase can be used safely in different contexts:

- `local`: local development with a local Hardhat node
- `dev`: test environment, useful for staging or testnet deployments
- `prod`: production environment for the real deployed contract

This separation helps avoid mistakes such as:

- deploying to the wrong network
- using the wrong private key
- overwriting the wrong deployment record
- testing against production settings

## Setup

Install dependencies:

```bash
npm install
```

Or:

```bash
yarn install
```

## Run Locally

Start a local blockchain:

```bash
npm run chain
```

In another terminal, deploy the contract locally:

```bash
npm run deploy:local
```

Run the local test script:

```bash
npm run test:local
```

## Available Scripts

- `npm run chain`: starts a local Hardhat node
- `npm run deploy:local`: deploys using `.env.local`
- `npm run deploy:dev`: deploys using `.env.dev`
- `npm run deploy:prod`: deploys using `.env.prod`
- `npm run test:local`: runs the test script against the local environment
- `npm run test:dev`: runs the test script against the development environment

## Deployment Flow

1. Configure the correct `.env.<environment>` file.
2. Run the deploy script for that environment.
3. The contract address is saved to [`deployments.json`](/home/dweg0/Documents/hacksp/admin-painel/contracts/deployments.json).
4. The test script reads that address and interacts with the deployed contract.

## Contract Addresses

To make the system more transparent, the deployed contract addresses are published in this README based on [`deployments.json`](/home/dweg0/Documents/hacksp/admin-painel/contracts/deployments.json).

<!-- CONTRACT_ADDRESSES_START -->
This section is generated from [`deployments.json`](/home/dweg0/Documents/hacksp/admin-painel/contracts/deployments.json).

| Environment | Network | Contract | Address | Explorer |
| --- | --- | --- | --- | --- |
| `prod` | Base Mainnet | `HackathonVoting` | `0x03c1ba0e11ed7f4da68beda1d19b0c0028908a73` | [View on BaseScan](https://basescan.org/address/0x03c1ba0e11ed7f4da68beda1d19b0c0028908a73) |

Run `npm run readme:addresses` after each deployment to refresh this table.
<!-- CONTRACT_ADDRESSES_END -->

This gives organizers, participants, and the community a clear place to verify which contract is being used in each environment and inspect the deployed contract directly on Base.

## Transparency Benefits

Because this system is on-chain, HackSP can offer:

- public and verifiable vote storage
- clear voting rules enforced by the contract
- visible contract addresses for each environment
- visible deployment history per environment
- easier auditing by organizers, participants, and community members

## Notes

- only the contract owner can create hackathons, add projects, register voters, and open or close voting
- the current test script blocks execution in `prod`
- mentor votes currently have more weight than team votes by design

## Community

HackSP is a community made by and for high school students in Sao Paulo. This project exists to support fairer, clearer, and more trustworthy hackathon operations for that community.
