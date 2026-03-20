import { defineConfig } from "hardhat/config";
import hardhatViem from "@nomicfoundation/hardhat-viem";
import "@nomicfoundation/hardhat-verify";
import * as dotenv from "dotenv";
import path from "path";

const ENV = process.env.ENV || "local";

dotenv.config({
    path: path.resolve(process.cwd(), `.env.${ENV}`),
});

console.log(`Using environment: ${ENV}`);

const RPC_URL = process.env.RPC_URL;
const PRIVATE_KEY = process.env.PRIVATE_KEY;
const CHAIN_ID = process.env.CHAIN_ID
    ? Number(process.env.CHAIN_ID)
    : undefined;
const CHAIN_TYPE = (process.env.CHAIN_TYPE || "l1") as "l1" | "op";

if (!RPC_URL) throw new Error(`Missing RPC_URL in .env.${ENV}`);
if (!PRIVATE_KEY) throw new Error(`Missing PRIVATE_KEY in .env.${ENV}`);
if (!CHAIN_ID) throw new Error(`Missing CHAIN_ID in .env.${ENV}`);

export default defineConfig({
    plugins: [hardhatViem],
    solidity: "0.8.20",
    networks: {
        app: {
            type: "http",
            chainType: CHAIN_TYPE,
            url: RPC_URL,
            chainId: CHAIN_ID,
            accounts: [PRIVATE_KEY],
        },
    },
});