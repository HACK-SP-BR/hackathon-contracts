// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

contract HackathonVotingV2 {
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

    // ======================
    // EVENTS
    // ======================

    event HackathonCreated(uint256 indexed hackathonId);
    event VotingOpened(uint256 indexed hackathonId);
    event VotingClosed(uint256 indexed hackathonId);

    event ProjectAdded(
        uint256 indexed hackathonId,
        uint256 indexed projectId,
        string name
    );

    event VoterRegistered(
        uint256 indexed hackathonId,
        address indexed voter,
        Role role
    );

    event VoteCast(
        uint256 indexed hackathonId,
        uint256 indexed projectId,
        address indexed voter,
        uint256 weight
    );

    // ======================

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
        hackathons[hackathonCount].exists = true;

        emit HackathonCreated(hackathonCount);
    }

    function openVoting(
        uint256 hackathonId
    ) external onlyOwner hackathonExists(hackathonId) {
        hackathons[hackathonId].votingOpen = true;
        emit VotingOpened(hackathonId);
    }

    function closeVoting(
        uint256 hackathonId
    ) external onlyOwner hackathonExists(hackathonId) {
        hackathons[hackathonId].votingOpen = false;
        emit VotingClosed(hackathonId);
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

        emit ProjectAdded(hackathonId, h.projectCount, name);
    }

    function getAllProjects(
        uint256 hackathonId
    ) external view returns (string[] memory names, uint256[] memory votes) {
        Hackathon storage h = hackathons[hackathonId];

        names = new string[](h.projectCount);
        votes = new uint256[](h.projectCount);

        for (uint256 i = 1; i <= h.projectCount; i++) {
            Project storage p = h.projects[i];
            names[i - 1] = p.name;
            votes[i - 1] = p.votes;
        }
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

        emit VoterRegistered(hackathonId, voter, role);
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

        uint256 weight;

        if (v.role == Role.Team) {
            weight = 1;
        } else if (v.role == Role.Mentor) {
            weight = 3;
        }

        p.votes += weight;
        v.voted = true;

        emit VoteCast(hackathonId, projectId, msg.sender, weight);
    }
}
