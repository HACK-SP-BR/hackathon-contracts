import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { network } from "hardhat";

describe("HackathonVotingV3", async function () {
    const { viem } = await network.connect();
    const publicClient = await viem.getPublicClient();
    const [owner, team1, team2, mentor, outsider] = await viem.getWalletClients();

    async function deploy() {
        return viem.deployContract("HackathonVotingV3");
    }

    async function getContractAs(address: `0x${string}`, walletClient: any, contractAddress: `0x${string}`) {
        return viem.getContractAt("HackathonVotingV3", contractAddress, {
            client: {
                public: publicClient,
                wallet: walletClient,
            },
        });
    }

    it("sets the deployer as owner and starts with hackathonCount = 0", async function () {
        const contract = await deploy();

        const contractOwner = await contract.read.owner();
        const count = await contract.read.hackathonCount();

        assert.equal(contractOwner.toLowerCase(), owner.account.address.toLowerCase());
        assert.equal(count, 0n);
    });

    it("creates a hackathon and increments hackathonCount", async function () {
        const contract = await deploy();

        const before = await contract.read.hackathonCount();
        assert.equal(before, 0n);

        await contract.write.createHackathon();

        const after = await contract.read.hackathonCount();
        assert.equal(after, 1n);

        await contract.write.createHackathon();

        const afterSecond = await contract.read.hackathonCount();
        assert.equal(afterSecond, 2n);
    });

    it("prevents non-owner from creating a hackathon", async function () {
        const contract = await deploy();

        const team1Contract = await getContractAs(
            team1.account.address,
            team1,
            contract.address,
        );

        await assert.rejects(
            team1Contract.write.createHackathon(),
            /Not authorized/,
        );
    });

    it("prevents adding a project to a non-existent hackathon", async function () {
        const contract = await deploy();

        await assert.rejects(
            contract.write.addProject([1n, "Projeto inválido", team1.account.address]),
            /Hackathon not found/,
        );
    });

    it("allows owner to add a project and read it via getAllProjects/getProjectCreator", async function () {
        const contract = await deploy();

        await contract.write.createHackathon();

        await contract.write.addProject([1n, "Projeto A", team1.account.address]);

        const [names, votes] = await contract.read.getAllProjects([1n]);
        const creator = await contract.read.getProjectCreator([1n, 1n]);

        assert.deepEqual(names, ["Projeto A"]);
        assert.deepEqual(votes, [0n]);
        assert.equal(creator.toLowerCase(), team1.account.address.toLowerCase());
    });

    it("allows owner to add multiple projects and preserves order", async function () {
        const contract = await deploy();

        await contract.write.createHackathon();

        await contract.write.addProject([1n, "Projeto A", team1.account.address]);
        await contract.write.addProject([1n, "Projeto B", team2.account.address]);

        const [names, votes] = await contract.read.getAllProjects([1n]);
        const creator1 = await contract.read.getProjectCreator([1n, 1n]);
        const creator2 = await contract.read.getProjectCreator([1n, 2n]);

        assert.deepEqual(names, ["Projeto A", "Projeto B"]);
        assert.deepEqual(votes, [0n, 0n]);
        assert.equal(creator1.toLowerCase(), team1.account.address.toLowerCase());
        assert.equal(creator2.toLowerCase(), team2.account.address.toLowerCase());
    });

    it("prevents non-owner from adding a project", async function () {
        const contract = await deploy();
        await contract.write.createHackathon();

        const team1Contract = await getContractAs(
            team1.account.address,
            team1,
            contract.address,
        );

        await assert.rejects(
            team1Contract.write.addProject([1n, "Projeto A", team1.account.address]),
            /Not authorized/,
        );
    });

    it("rejects addProject with zero creator address", async function () {
        const contract = await deploy();
        await contract.write.createHackathon();

        await assert.rejects(
            contract.write.addProject([
                1n,
                "Projeto inválido",
                "0x0000000000000000000000000000000000000000",
            ]),
            /Invalid creator/,
        );
    });

    it("returns empty arrays in getAllProjects when hackathon exists but has no projects", async function () {
        const contract = await deploy();
        await contract.write.createHackathon();

        const [names, votes] = await contract.read.getAllProjects([1n]);

        assert.deepEqual(names, []);
        assert.deepEqual(votes, []);
    });

    it("reverts getProjectCreator for invalid project", async function () {
        const contract = await deploy();
        await contract.write.createHackathon();

        await assert.rejects(
            contract.read.getProjectCreator([1n, 1n]),
            /Invalid project/,
        );
    });

    it("opens and closes voting", async function () {
        const contract = await deploy();
        await contract.write.createHackathon();
        await contract.write.addProject([1n, "Projeto A", team1.account.address]);
        await contract.write.registerVoter([1n, mentor.account.address, 2]);

        const mentorContract = await getContractAs(
            mentor.account.address,
            mentor,
            contract.address,
        );

        await assert.rejects(
            mentorContract.write.vote([1n, 1n]),
            /Voting closed/,
        );

        await contract.write.openVoting([1n]);
        await mentorContract.write.vote([1n, 1n]);

        const [, votesAfterOpen] = await contract.read.getAllProjects([1n]);
        assert.equal(votesAfterOpen[0], 3n);

        await contract.write.closeVoting([1n]);

        await assert.rejects(
            mentorContract.write.vote([1n, 1n]),
            /Already voted|Voting closed/,
        );
    });

    it("prevents non-owner from opening voting", async function () {
        const contract = await deploy();
        await contract.write.createHackathon();

        const team1Contract = await getContractAs(
            team1.account.address,
            team1,
            contract.address,
        );

        await assert.rejects(
            team1Contract.write.openVoting([1n]),
            /Not authorized/,
        );
    });

    it("prevents non-owner from closing voting", async function () {
        const contract = await deploy();
        await contract.write.createHackathon();

        const team1Contract = await getContractAs(
            team1.account.address,
            team1,
            contract.address,
        );

        await assert.rejects(
            team1Contract.write.closeVoting([1n]),
            /Not authorized/,
        );
    });

    it("reverts openVoting for non-existent hackathon", async function () {
        const contract = await deploy();

        await assert.rejects(
            contract.write.openVoting([1n]),
            /Hackathon not found/,
        );
    });

    it("reverts closeVoting for non-existent hackathon", async function () {
        const contract = await deploy();

        await assert.rejects(
            contract.write.closeVoting([1n]),
            /Hackathon not found/,
        );
    });

    it("registers a Team voter and counts vote weight as 1", async function () {
        const contract = await deploy();

        await contract.write.createHackathon();
        await contract.write.addProject([1n, "Projeto A", team2.account.address]);
        await contract.write.registerVoter([1n, team1.account.address, 1]);
        await contract.write.openVoting([1n]);

        const team1Contract = await getContractAs(
            team1.account.address,
            team1,
            contract.address,
        );

        await team1Contract.write.vote([1n, 1n]);

        const [, votes] = await contract.read.getAllProjects([1n]);
        assert.equal(votes[0], 1n);
    });

    it("registers a Mentor voter and counts vote weight as 3", async function () {
        const contract = await deploy();

        await contract.write.createHackathon();
        await contract.write.addProject([1n, "Projeto A", team1.account.address]);
        await contract.write.registerVoter([1n, mentor.account.address, 2]);
        await contract.write.openVoting([1n]);

        const mentorContract = await getContractAs(
            mentor.account.address,
            mentor,
            contract.address,
        );

        await mentorContract.write.vote([1n, 1n]);

        const [, votes] = await contract.read.getAllProjects([1n]);
        assert.equal(votes[0], 3n);
    });

    it("prevents non-owner from registering a voter", async function () {
        const contract = await deploy();
        await contract.write.createHackathon();

        const team1Contract = await getContractAs(
            team1.account.address,
            team1,
            contract.address,
        );

        await assert.rejects(
            team1Contract.write.registerVoter([1n, team2.account.address, 1]),
            /Not authorized/,
        );
    });

    it("rejects registerVoter with Role.None", async function () {
        const contract = await deploy();
        await contract.write.createHackathon();

        await assert.rejects(
            contract.write.registerVoter([1n, team1.account.address, 0]),
            /Invalid role/,
        );
    });

    it("reverts registerVoter for non-existent hackathon", async function () {
        const contract = await deploy();

        await assert.rejects(
            contract.write.registerVoter([1n, team1.account.address, 1]),
            /Hackathon not found/,
        );
    });

    it("prevents voting when the caller is not registered", async function () {
        const contract = await deploy();

        await contract.write.createHackathon();
        await contract.write.addProject([1n, "Projeto A", team1.account.address]);
        await contract.write.openVoting([1n]);

        const outsiderContract = await getContractAs(
            outsider.account.address,
            outsider,
            contract.address,
        );

        await assert.rejects(
            outsiderContract.write.vote([1n, 1n]),
            /Not allowed/,
        );
    });

    it("prevents double voting", async function () {
        const contract = await deploy();

        await contract.write.createHackathon();
        await contract.write.addProject([1n, "Projeto A", team2.account.address]);
        await contract.write.registerVoter([1n, mentor.account.address, 2]);
        await contract.write.openVoting([1n]);

        const mentorContract = await getContractAs(
            mentor.account.address,
            mentor,
            contract.address,
        );

        await mentorContract.write.vote([1n, 1n]);

        await assert.rejects(
            mentorContract.write.vote([1n, 1n]),
            /Already voted/,
        );
    });

    it("prevents voting on an invalid project", async function () {
        const contract = await deploy();

        await contract.write.createHackathon();
        await contract.write.registerVoter([1n, mentor.account.address, 2]);
        await contract.write.openVoting([1n]);

        const mentorContract = await getContractAs(
            mentor.account.address,
            mentor,
            contract.address,
        );

        await assert.rejects(
            mentorContract.write.vote([1n, 1n]),
            /Invalid project/,
        );
    });

    it("prevents a project creator from voting on their own project", async function () {
        const contract = await deploy();

        await contract.write.createHackathon();
        await contract.write.addProject([1n, "Projeto V3", team1.account.address]);
        await contract.write.registerVoter([1n, team1.account.address, 1]);
        await contract.write.registerVoter([1n, mentor.account.address, 2]);
        await contract.write.openVoting([1n]);

        const creatorContract = await getContractAs(
            team1.account.address,
            team1,
            contract.address,
        );

        const mentorContract = await getContractAs(
            mentor.account.address,
            mentor,
            contract.address,
        );

        await assert.rejects(
            creatorContract.write.vote([1n, 1n]),
            /Project creator cannot self-vote/,
        );

        await mentorContract.write.vote([1n, 1n]);

        const [, votes] = await contract.read.getAllProjects([1n]);
        assert.equal(votes[0], 3n);
    });

    it("supports multiple hackathons independently", async function () {
        const contract = await deploy();

        await contract.write.createHackathon();
        await contract.write.createHackathon();

        await contract.write.addProject([1n, "Projeto H1", team1.account.address]);
        await contract.write.addProject([2n, "Projeto H2", team2.account.address]);

        await contract.write.registerVoter([1n, mentor.account.address, 2]);
        await contract.write.registerVoter([2n, team1.account.address, 1]);

        await contract.write.openVoting([1n]);
        await contract.write.openVoting([2n]);

        const mentorContract = await getContractAs(
            mentor.account.address,
            mentor,
            contract.address,
        );

        const team1Contract = await getContractAs(
            team1.account.address,
            team1,
            contract.address,
        );

        await mentorContract.write.vote([1n, 1n]);
        await team1Contract.write.vote([2n, 1n]);

        const [names1, votes1] = await contract.read.getAllProjects([1n]);
        const [names2, votes2] = await contract.read.getAllProjects([2n]);

        assert.deepEqual(names1, ["Projeto H1"]);
        assert.deepEqual(votes1, [3n]);

        assert.deepEqual(names2, ["Projeto H2"]);
        assert.deepEqual(votes2, [1n]);
    });

    it("reverts vote for non-existent hackathon", async function () {
        const contract = await deploy();

        const mentorContract = await getContractAs(
            mentor.account.address,
            mentor,
            contract.address,
        );

        await assert.rejects(
            mentorContract.write.vote([1n, 1n]),
            /Hackathon not found/,
        );
    });
});