import fs from "fs";
import path from "path";
import * as dotenv from "dotenv";
import {
    createPublicClient,
    createWalletClient,
    getAddress,
    getContract,
    http,
} from "viem";
import { privateKeyToAccount } from "viem/accounts";
import { foundry, baseSepolia } from "viem/chains";

const ENV = process.env.ENV || "local";

dotenv.config({
    path: path.resolve(process.cwd(), `.env.${ENV}`),
});

if (ENV === "prod") {
    throw new Error("You can't test using prod environment");
}

const RPC_URL = process.env.RPC_URL;
const PRIVATE_KEY = process.env.PRIVATE_KEY as `0x${string}` | undefined;
const CONTRACT_NAME = process.env.CONTRACT_NAME || "HackathonVoting";
const DEPLOY_KEY = process.env.DEPLOY_KEY || "HackathonVoting";

if (!RPC_URL) throw new Error(`Missing RPC_URL in .env.${ENV}`);
if (!PRIVATE_KEY) throw new Error(`Missing PRIVATE_KEY in .env.${ENV}`);

type DeploymentEntry =
    | string
    | {
        current: string;
        version?: string;
        history?: Array<{
            version?: string;
            address: string;
        }>;
    };

type DeploymentsFile = {
    local?: Record<string, DeploymentEntry>;
    dev?: Record<string, DeploymentEntry>;
    prod?: Record<string, DeploymentEntry>;
};

function getChain(env: string) {
    if (env === "dev") return baseSepolia;
    return foundry;
}

function getContractAddress(env: string, deployKey: string) {
    const deploymentsPath = path.resolve(process.cwd(), "deployments.json");

    if (!fs.existsSync(deploymentsPath)) {
        throw new Error("deployments.json not found");
    }

    const deployments = JSON.parse(
        fs.readFileSync(deploymentsPath, "utf-8")
    ) as DeploymentsFile;

    const entry = deployments?.[env as keyof DeploymentsFile]?.[deployKey];

    if (!entry) {
        throw new Error(`Missing deployments.${env}.${deployKey}`);
    }

    if (typeof entry === "string") {
        return getAddress(entry);
    }

    if (!entry.current) {
        throw new Error(`Missing deployments.${env}.${deployKey}.current`);
    }

    return getAddress(entry.current);
}

function getContractAbi(contractName: string) {
    const artifactPath = path.resolve(
        process.cwd(),
        "artifacts",
        "contracts",
        `${contractName}.sol`,
        `${contractName}.json`
    );

    if (!fs.existsSync(artifactPath)) {
        throw new Error(`Artifact not found: ${artifactPath}`);
    }

    const artifact = JSON.parse(fs.readFileSync(artifactPath, "utf-8"));

    if (!artifact.abi) {
        throw new Error(`Missing abi in artifact: ${artifactPath}`);
    }

    return artifact.abi;
}

async function main() {
    const contractAddress = getContractAddress(ENV, DEPLOY_KEY);
    const chain = getChain(ENV);
    const account = privateKeyToAccount(PRIVATE_KEY);
    const abi = getContractAbi(CONTRACT_NAME);

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
    console.log(`Contract artifact: ${CONTRACT_NAME}`);
    console.log(`Deploy key: ${DEPLOY_KEY}`);
    console.log("Contract address:", contractAddress);
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
        confirmations: 1,
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
        confirmations: 1,
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