# hackathon-contracts

Smart contracts for Hack SP hackathon voting.

## Overview

This repository contains the on-chain voting contracts used in Hack SP hackathons.

The contract is designed to:

- create hackathons
- register projects
- register voters
- open and close voting
- store votes on-chain
- prevent double voting

## Stack

- Solidity
- Hardhat
- Base

## Main contract

- `contracts/HackathonVoting.sol`

## Features

- multiple hackathons
- project registration
- voter whitelist
- role-based voting
- one vote per wallet
- transparent on-chain results