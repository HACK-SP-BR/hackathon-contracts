import fs from "fs";
import path from "path";
import * as dotenv from "dotenv";
import {
    createPublicClient,
    createWalletClient,
    getAddress,
    getContract,
    http,
    UnauthorizedProviderError,
} from "viem";
import { privateKeyToAccount } from "viem/accounts";
import { foundry, baseSepolia, base } from "viem/chains";

const ENV = process.env.ENV || "local";

dotenv.config({
    path: path.resolve(process.cwd(), `.env.${ENV}`),
});

if (ENV == "prod") {
    throw new Error('You can\'t test using prod enviroment');
}

const RPC_URL = process.env.RPC_URL;
const PRIVATE_KEY = process.env.PRIVATE_KEY as `0x${string}`;
const CONTRACT_NAME = process.env.CONTRACT_NAME || "HackathonVoting";

if (!RPC_URL) throw new Error(`Missing RPC_URL in .env.${ENV}`);
if (!PRIVATE_KEY) throw new Error(`Missing PRIVATE_KEY in .env.${ENV}`);

const abi = [
    {
        type: "function",
        name: "owner",
        stateMutability: "view",
        inputs: [],
        outputs: [{ name: "", type: "address" }],
    },
    {
        type: "function",
        name: "hackathonCount",
        stateMutability: "view",
        inputs: [],
        outputs: [{ name: "", type: "uint256" }],
    },
    {
        type: "function",
        name: "createHackathon",
        stateMutability: "nonpayable",
        inputs: [],
        outputs: [],
    },
    {
        type: "function",
        name: "openVoting",
        stateMutability: "nonpayable",
        inputs: [{ name: "hackathonId", type: "uint256" }],
        outputs: [],
    },
    {
        type: "function",
        name: "closeVoting",
        stateMutability: "nonpayable",
        inputs: [{ name: "hackathonId", type: "uint256" }],
        outputs: [],
    },
    {
        type: "function",
        name: "addProject",
        stateMutability: "nonpayable",
        inputs: [
            { name: "hackathonId", type: "uint256" },
            { name: "name", type: "string" },
        ],
        outputs: [],
    },
    {
        type: "function",
        name: "registerVoter",
        stateMutability: "nonpayable",
        inputs: [
            { name: "hackathonId", type: "uint256" },
            { name: "voter", type: "address" },
            { name: "role", type: "uint8" },
        ],
        outputs: [],
    },
    {
        type: "function",
        name: "getProject",
        stateMutability: "view",
        inputs: [
            { name: "hackathonId", type: "uint256" },
            { name: "projectId", type: "uint256" },
        ],
        outputs: [
            { name: "name", type: "string" },
            { name: "votes", type: "uint256" },
        ],
    },
    {
        type: "function",
        name: "getProjectCount",
        stateMutability: "view",
        inputs: [{ name: "hackathonId", type: "uint256" }],
        outputs: [{ name: "", type: "uint256" }],
    },
] as const;

function getChain(env: string) {
    if (env === "dev") return baseSepolia;
    return foundry;
}

function getContractAddress(env: string, contractName: string) {
    const deploymentsPath = path.resolve(process.cwd(), "deployments.json");

    if (!fs.existsSync(deploymentsPath)) {
        throw new Error("deployments.json not found");
    }

    const deployments = JSON.parse(fs.readFileSync(deploymentsPath, "utf-8"));
    const address = deployments?.[env]?.[contractName];

    if (!address) {
        throw new Error(`Missing deployments.${env}.${contractName}`);
    }

    return getAddress(address);
}

async function main() {
    const contractAddress = getContractAddress(ENV, CONTRACT_NAME);
    const chain = getChain(ENV);
    const account = privateKeyToAccount(PRIVATE_KEY);

    const publicClient = createPublicClient({
        chain,
        transport: http(RPC_URL),
    });

    const walletClient = createWalletClient({
        account,
        chain,
        transport: http(RPC_URL),
    });

    const contract = getContract({
        address: contractAddress,
        abi,
        client: {
            public: publicClient,
            wallet: walletClient,
        },
    });

    console.log(`Environment: ${ENV}`);
    console.log("Contract:", contractAddress);
    console.log("Signer:", account.address);

    const balance = await publicClient.getBalance({ address: account.address });
    console.log("Balance:", balance.toString());

    const owner = await contract.read.owner();
    console.log("Owner:", owner);

    const countBefore = await contract.read.hackathonCount();
    console.log("Hackathons before:", countBefore.toString());

    console.log("\nCreating hackathon...");
    const createHash = await contract.write.createHackathon();
    const createReceipt = await publicClient.waitForTransactionReceipt({
        hash: createHash,
    });

    console.log("createHackathon tx:", createHash);
    console.log("createHackathon status:", createReceipt.status);

    if (createReceipt.status !== "success") {
        throw new Error("createHackathon reverted");
    }

    const hackathonId = countBefore + 1n;

    const countAfter = await contract.read.hackathonCount();
    console.log("Hackathons after:", countAfter.toString());
    console.log("New hackathon id:", hackathonId.toString());

    console.log("\nAdding project...");
    const addProjectHash = await contract.write.addProject([
        hackathonId,
        `Projeto ${ENV} ${Date.now()}`,
    ]);
    const addProjectReceipt = await publicClient.waitForTransactionReceipt({
        hash: addProjectHash,
    });

    console.log("addProject tx:", addProjectHash);
    console.log("addProject status:", addProjectReceipt.status);

    if (addProjectReceipt.status !== "success") {
        throw new Error("addProject reverted");
    }

    const projectCount = await contract.read.getProjectCount([hackathonId]);
    console.log("Project count:", projectCount.toString());

    const project = await contract.read.getProject([hackathonId, 1n]);
    console.log("Project #1:", {
        name: project[0],
        votes: project[1].toString(),
    });
}

main().catch((err) => {
    console.error(err);
    process.exit(1);
});