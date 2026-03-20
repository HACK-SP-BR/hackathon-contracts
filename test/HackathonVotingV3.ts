import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { network } from "hardhat";

describe("HackathonVotingV3", async function () {
    const { viem } = await network.connect();
    const publicClient = await viem.getPublicClient();
    const [, creator, mentor] = await viem.getWalletClients();

    it("prevents a project creator from voting on their own project", async function () {
        const contract = await viem.deployContract("HackathonVotingV3");

        await contract.write.createHackathon();
        await contract.write.addProject([1n, "Projeto V3", creator.account.address]);
        await contract.write.registerVoter([1n, creator.account.address, 1]);
        await contract.write.registerVoter([1n, mentor.account.address, 2]);
        await contract.write.openVoting([1n]);

        const creatorContract = await viem.getContractAt("HackathonVotingV3", contract.address, {
            client: {
                public: publicClient,
                wallet: creator,
            },
        });

        const mentorContract = await viem.getContractAt("HackathonVotingV3", contract.address, {
            client: {
                public: publicClient,
                wallet: mentor,
            },
        });

        await assert.rejects(
            creatorContract.write.vote([1n, 1n]),
            /Project creator cannot self-vote/,
        );

        await mentorContract.write.vote([1n, 1n]);

        const [, votes] = await contract.read.getAllProjects([1n]);
        assert.equal(votes[0], 3n);
    });
});
