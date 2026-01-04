// SPDX-License-Identifier: MIT
pragma solidity ^0.8.30;

contract Voting {
    struct Candidate {
        string name;
        uint256 voteCount;
    }

    address public owner;                 // deployer = admin
    uint256 public candidateCount;        // current number of candidates
    mapping(uint256 => Candidate) private _candidates; // candidateId -> data
    mapping(address => bool) public hasVoted;           // voter -> voted?

    event CandidateAdded(uint256 candidateId, string name);
    event Voted(address voter, uint256 candidateId);

    constructor() {
        owner = msg.sender; // set admin
    }

    modifier onlyOwner() {
        require(msg.sender == owner, "Not owner");
        _;
    }

    function addCandidate(string calldata name_) external onlyOwner returns (uint256 candidateId_) {
        require(bytes(name_).length > 0, "Name required"); // avoid empty names

        candidateId_ = candidateCount;
        _candidates[candidateId_] = Candidate({name: name_, voteCount: 0});
        candidateCount += 1; // bump total

        emit CandidateAdded(candidateId_, name_);
    }

    function vote(uint256 candidateId_) external {
        require(!hasVoted[msg.sender], "Already voted"); // one vote per address
        require(candidateId_ < candidateCount, "Invalid candidate"); // id must exist

        hasVoted[msg.sender] = true;
        _candidates[candidateId_].voteCount += 1;

        emit Voted(msg.sender, candidateId_);
    }

    function getCandidate(uint256 candidateId_)
        external
        view
        returns (string memory name_, uint256 voteCount_)
    {
        require(candidateId_ < candidateCount, "Invalid candidate"); // bounds check
        Candidate memory c = _candidates[candidateId_];
        return (c.name, c.voteCount);
    }
}
