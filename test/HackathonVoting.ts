import { network } from "hardhat";
import { expect } from "chai";

describe("HackathonVoting", function () {
    async function deployFixture() {
        const { viem } = await network.connect();
        const contract = await viem.deployContract("HackathonVoting");

        const [owner, user] = await viem.getWalletClients();

        return { contract, owner, user };
    }

    it("should create hackathon", async function () {
        const { contract } = await deployFixture();

        await contract.write.createHackathon();

        const count = await contract.read.hackathonCount();
        expect(count).to.equal(1n);
    });

    it("should register voter and vote", async function () {
        const { contract, user } = await deployFixture();

        await contract.write.createHackathon();
        await contract.write.addProject([1n, "Test Project"]);

        await contract.write.registerVoter([
            1n,
            user.account.address,
            1 // Role.Team
        ]);

        await contract.write.openVoting([1n]);

        await contract.write.vote([1n, 1n], {
            account: user.account
        });

        const project = await contract.read.getProject([1n, 1n]);
        expect(project[1]).to.equal(1n);
    });

    it("should prevent double voting", async function () {
        const { contract, user } = await deployFixture();

        await contract.write.createHackathon();
        await contract.write.addProject([1n, "Test Project"]);

        await contract.write.registerVoter([
            1n,
            user.account.address,
            1
        ]);

        await contract.write.openVoting([1n]);

        await contract.write.vote([1n, 1n], {
            account: user.account
        });

        await expect(
            contract.write.vote([1n, 1n], {
                account: user.account
            })
        ).to.be.rejected;
    });
});