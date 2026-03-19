import { network } from "hardhat";

async function main() {
    const { viem, networkName } = await network.connect();
    const publicClient = await viem.getPublicClient();
    const walletClients = await viem.getWalletClients();

    console.log(`Network: ${networkName}`);
    console.log(`Block: ${await publicClient.getBlockNumber()}`);

    const [wallet] = walletClients;
    console.log(`Deployer: ${wallet.account.address}`);

    const balance = await publicClient.getBalance({
        address: wallet.account.address,
    });
    console.log(`Balance: ${balance}`);

    const contract = await viem.deployContract("HackathonVoting");
    console.log(`Contract deployed at: ${contract.address}`);
}

main().catch((err) => {
    console.error(err);
    process.exit(1);
});