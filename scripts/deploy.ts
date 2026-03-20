import { network } from "hardhat";
import fs from "fs";
import path from "path";
import * as dotenv from "dotenv";

const ENV = process.env.ENV || "local";

dotenv.config({
    path: path.resolve(process.cwd(), `.env.${ENV}`),
});

type SimpleContractEntry = {
    current: string;
    version: string;
};

type ProdHistoryEntry = {
    version: string;
    address: string;
};

type ProdContractEntry = {
    current: string;
    version: string;
    history: ProdHistoryEntry[];
};

type Deployments = {
    local?: Record<string, SimpleContractEntry>;
    dev?: Record<string, SimpleContractEntry>;
    prod?: Record<string, ProdContractEntry>;
};

function readDeployments(deploymentsPath: string): Deployments {
    if (!fs.existsSync(deploymentsPath)) {
        return {
            local: {},
            dev: {},
            prod: {},
        };
    }

    return JSON.parse(fs.readFileSync(deploymentsPath, "utf-8"));
}

async function main() {
    const contractName = process.env.CONTRACT_NAME || "HackathonVoting";
    const deployKey = process.env.DEPLOY_KEY || "HackathonVoting";
    const version = process.env.CONTRACT_VERSION || "v1";

    const { viem, networkName } = await network.connect("app");
    const publicClient = await viem.getPublicClient();
    const [wallet] = await viem.getWalletClients();

    console.log(`Environment: ${ENV}`);
    console.log(`Network: ${networkName}`);
    console.log(`Deployer: ${wallet.account.address}`);
    console.log(`Contract artifact: ${contractName}`);
    console.log(`Deploy key: ${deployKey}`);
    console.log(`Version: ${version}`);

    const balance = await publicClient.getBalance({
        address: wallet.account.address,
    });
    console.log(`Balance: ${balance}`);

    const contract = await viem.deployContract(contractName);
    console.log(`Contract deployed at: ${contract.address}`);

    const deploymentsPath = path.resolve("deployments.json");
    const deployments = readDeployments(deploymentsPath);

    const baseEntry = {
        current: contract.address,
        version,
    };

    if (ENV === "prod") {
        deployments.prod ??= {};

        const existing = deployments.prod[deployKey];

        deployments.prod[deployKey] = {
            ...baseEntry,
            history: existing
                ? [
                    {
                        version: existing.version,
                        address: existing.current,
                    },
                    ...existing.history,
                ]
                : [],
        };

        console.log(`Saved to deployments.json -> prod.${deployKey}`);
    } else {
        const targetEnv = ENV === "dev" ? "dev" : "local";

        deployments[targetEnv] ??= {};
        deployments[targetEnv][deployKey] = baseEntry;

        console.log(`Saved to deployments.json -> ${targetEnv}.${deployKey}`);
    }

    fs.writeFileSync(deploymentsPath, JSON.stringify(deployments, null, 2));
}

main().catch((err) => {
    console.error(err);
    process.exit(1);
});