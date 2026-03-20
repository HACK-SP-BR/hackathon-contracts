import { network } from "hardhat";
import fs from "fs";
import path from "path";
import * as dotenv from "dotenv";

const ENV = process.env.ENV || "local";

dotenv.config({
    path: path.resolve(process.cwd(), `.env.${ENV}`),
});

type SimpleEnvMap = Record<string, string>;
type ProdContractEntry = {
    current: string;
    history: string[];
};
type ProdEnvMap = Record<string, ProdContractEntry>;
type Deployments = {
    local?: SimpleEnvMap;
    dev?: SimpleEnvMap;
    prod?: ProdEnvMap;
};

function readDeployments(deploymentsPath: string): Deployments {
    if (!fs.existsSync(deploymentsPath)) {
        return { local: {}, dev: {}, prod: {} };
    }

    return JSON.parse(fs.readFileSync(deploymentsPath, "utf-8"));
}

async function main() {
    const contractName = process.env.CONTRACT_NAME || "HackathonVoting";

    const { viem, networkName } = await network.connect("app");
    const publicClient = await viem.getPublicClient();
    const [wallet] = await viem.getWalletClients();

    console.log(`Environment: ${ENV}`);
    console.log(`Network: ${networkName}`);
    console.log(`Deployer: ${wallet.account.address}`);

    const balance = await publicClient.getBalance({
        address: wallet.account.address,
    });
    console.log(`Balance: ${balance}`);

    const contract = await viem.deployContract(contractName);
    console.log(`Contract deployed at: ${contract.address}`);

    const deploymentsPath = path.resolve("deployments.json");
    const deployments = readDeployments(deploymentsPath);

    if (ENV === "prod") {
        deployments.prod ??= {};

        const existing = deployments.prod[contractName];

        if (!existing) {
            deployments.prod[contractName] = {
                current: contract.address,
                history: [],
            };
        } else {
            deployments.prod[contractName] = {
                current: contract.address,
                history: [existing.current, ...existing.history],
            };
        }

        console.log(
            `Saved to deployments.json -> prod.${contractName}.current`
        );
    } else if (ENV === "dev") {
        deployments.dev ??= {};
        deployments.dev[contractName] = contract.address;
        console.log(`Saved to deployments.json -> dev.${contractName}`);
    } else {
        deployments.local ??= {};
        deployments.local[contractName] = contract.address;
        console.log(`Saved to deployments.json -> local.${contractName}`);
    }

    fs.writeFileSync(deploymentsPath, JSON.stringify(deployments, null, 2));
}

main().catch((err) => {
    console.error(err);
    process.exit(1);
});