// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

contract HackathonVoting {
    enum Role {
        None,
        Team,
        Mentor
    }

    struct Voter {
        bool registered;
        bool voted;
        Role role;
    }

    struct Project {
        string name;
        uint256 votes;
        bool exists;
    }

    struct Hackathon {
        bool exists;
        bool votingOpen;
        uint256 projectCount;
        mapping(uint256 => Project) projects;
        mapping(address => Voter) voters;
    }

    address public owner;
    uint256 public hackathonCount;

    mapping(uint256 => Hackathon) private hackathons;

    modifier onlyOwner() {
        require(msg.sender == owner, "Not authorized");
        _;
    }

    modifier hackathonExists(uint256 hackathonId) {
        require(hackathons[hackathonId].exists, "Hackathon not found");
        _;
    }

    constructor() {
        owner = msg.sender;
    }

    // ======================
    // HACKATHON
    // ======================

    function createHackathon() external onlyOwner {
        hackathonCount++;
        Hackathon storage h = hackathons[hackathonCount];
        h.exists = true;
    }

    function openVoting(
        uint256 hackathonId
    ) external onlyOwner hackathonExists(hackathonId) {
        hackathons[hackathonId].votingOpen = true;
    }

    function closeVoting(
        uint256 hackathonId
    ) external onlyOwner hackathonExists(hackathonId) {
        hackathons[hackathonId].votingOpen = false;
    }

    // ======================
    // PROJECTS
    // ======================

    function addProject(
        uint256 hackathonId,
        string memory name
    ) external onlyOwner hackathonExists(hackathonId) {
        Hackathon storage h = hackathons[hackathonId];

        h.projectCount++;
        h.projects[h.projectCount] = Project({
            name: name,
            votes: 0,
            exists: true
        });
    }

    // ======================
    // VOTERS
    // ======================

    function registerVoter(
        uint256 hackathonId,
        address voter,
        Role role
    ) external onlyOwner hackathonExists(hackathonId) {
        require(role != Role.None, "Invalid role");

        hackathons[hackathonId].voters[voter] = Voter({
            registered: true,
            voted: false,
            role: role
        });
    }

    // ======================
    // VOTE
    // ======================

    function vote(
        uint256 hackathonId,
        uint256 projectId
    ) external hackathonExists(hackathonId) {
        Hackathon storage h = hackathons[hackathonId];

        require(h.votingOpen, "Voting closed");

        Voter storage v = h.voters[msg.sender];
        require(v.registered, "Not allowed");
        require(!v.voted, "Already voted");

        Project storage p = h.projects[projectId];
        require(p.exists, "Invalid project");

        if (v.role == Role.Team) {
            p.votes += 1;
        } else if (v.role == Role.Mentor) {
            p.votes += 3;
        }

        v.voted = true;
    }

    // ======================
    // READ
    // ======================

    function getProject(
        uint256 hackathonId,
        uint256 projectId
    ) external view returns (string memory name, uint256 votes) {
        Project storage p = hackathons[hackathonId].projects[projectId];
        return (p.name, p.votes);
    }

    function hasVoted(
        uint256 hackathonId,
        address user
    ) external view returns (bool) {
        return hackathons[hackathonId].voters[user].voted;
    }

    function canVote(
        uint256 hackathonId,
        address user
    ) external view returns (bool) {
        Voter storage v = hackathons[hackathonId].voters[user];
        return v.registered && !v.voted;
    }

    function getProjectCount(
        uint256 hackathonId
    ) external view returns (uint256) {
        return hackathons[hackathonId].projectCount;
    }
}
