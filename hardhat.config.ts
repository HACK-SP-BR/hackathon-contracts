import { defineConfig } from "hardhat/config";
import hardhatViem from "@nomicfoundation/hardhat-viem";
import "@nomicfoundation/hardhat-verify";
import * as dotenv from "dotenv";

dotenv.config();

const ENV = process.env.ENV || "dev";

dotenv.config({
    path: ENV === "prod" ? ".env.prod" : ".env.dev",
    override: true,
});

const PRIVATE_KEY = process.env.PRIVATE_KEY;
const RPC_URL = process.env.RPC_URL;

if (!RPC_URL) {
    throw new Error(`Missing RPC_URL in ${ENV === "prod" ? ".env.prod" : ".env.dev"}`);
}

if (!PRIVATE_KEY) {
    throw new Error(`Missing PRIVATE_KEY in ${ENV === "prod" ? ".env.prod" : ".env.dev"}`);
}

const CHAIN_ID = ENV === "prod" ? 8453 : 84532;

console.log(`Running in ${ENV.toUpperCase()} mode`);
console.log(`RPC: ${RPC_URL}`);

export default defineConfig({
    plugins: [hardhatViem],
    solidity: "0.8.20",
    networks: {
        base: {
            type: "http",
            chainType: "op",
            url: RPC_URL,
            accounts: [PRIVATE_KEY],
            chainId: CHAIN_ID,
        },
    },
});