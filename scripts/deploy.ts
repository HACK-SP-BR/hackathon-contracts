import { network } from "hardhat";
import fs from "fs";
import path from "path";
import * as dotenv from "dotenv";

dotenv.config();

type Deployments = Record<string, Record<string, string>>;

async function main() {
    const env = process.env.ENV || "local";
    const contractName = process.env.CONTRACT_NAME || "HackathonVoting";

    const { viem, networkName } = await network.connect("app");
    const publicClient = await viem.getPublicClient();
    const [wallet] = await viem.getWalletClients();

    console.log(`Environment: ${env}`);
    console.log(`Network: ${networkName}`);
    console.log(`Deployer: ${wallet.account.address}`);

    const balance = await publicClient.getBalance({
        address: wallet.account.address,
    });
    console.log(`Balance: ${balance}`);

    const contract = await viem.deployContract(contractName);
    console.log(`Contract deployed at: ${contract.address}`);

    const deploymentsPath = path.resolve("deployments.json");
    const deployments: Deployments = fs.existsSync(deploymentsPath)
        ? JSON.parse(fs.readFileSync(deploymentsPath, "utf-8"))
        : {};

    deployments[env] ??= {};
    deployments[env][contractName] = contract.address;

    fs.writeFileSync(deploymentsPath, JSON.stringify(deployments, null, 2));
    console.log(`Saved to deployments.json -> ${env}.${contractName}`);
}

main().catch((err) => {
    console.error(err);
    process.exit(1);
});