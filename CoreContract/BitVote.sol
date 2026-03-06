// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {ReceiverTemplate} from './ReceiverTemplate.sol';

contract TimeBasedBitVote is ReceiverTemplate {

    address public admin;

    constructor(address _forwarderAddress) ReceiverTemplate(_forwarderAddress) {
        admin = msg.sender;
    }

    struct Voter {
        bool registered;
        uint256 registeredAt;
    }

    mapping(address => Voter) public voters;

    struct Campaign {
        string title;
        uint256 startTime;
        uint256 endTime;
        uint256 votingThreshold; // minimum registration age required
        uint256 yesVotes;
        uint256 noVotes;
        bool exists;
    }

    uint256 public campaignCount;

    mapping(uint256 => Campaign) public campaigns;

    // Prevent double voting
    mapping(uint256 => mapping(address => bool)) public hasVoted;

    event VoterRegistered(address voter, uint256 time);
    event CampaignCreated(uint256 campaignId, uint256 startTime, uint256 endTime);
    event VoteCast(address voter, uint256 campaignId, uint8 vote);
    event VoteMethod(address indexed voterAddress, uint256 indexed _campaignId, uint8 indexed voterType);
    event Evote(address indexed voter, uint256 indexed campaignId, uint8 indexed voteType);
    event create(string indexed title, uint256 indexed duration, uint256 indexed threshold);
    event register(address indexed voterAddress)

    modifier onlyAdmin() {
        require(msg.sender == admin, "Only admin");
        _;
    }

    modifier campaignExists(uint256 _campaignId) {
        require(campaigns[_campaignId].exists, "Campaign does not exist");
        _;
    }

    function callPr0cess (bytes calldata report) public {
        _processReport(report);
    }

    function _processReport(bytes calldata report) internal override {

        bytes memory callData = report;
        
        string memory methodIdentifier = abi.decode(callData,(string));

        address voterAddress;
        uint256 _campaignId;
        string memory _campaignTitle;
        uint256 _duration;
        uint256 _votingThreshold;
        uint8 voteType;
        string memory Id;

        if(bytes(methodIdentifier)[0] == bytes('v')[0]){
            (Id, voterAddress, _campaignId, voteType) = abi.decode(callData,(string,address,uint256,uint8));
            vote(voterAddress,_campaignId,voteType);
            emit Evote(voterAddress,_campaignId,voteType);
           
        } else if(bytes(methodIdentifier)[0] == bytes('c')[0]){
            (Id,_campaignTitle, _duration, _votingThreshold) = abi.decode(callData,(string,string,uint256,uint256));
            createCampaign(_campaignTitle,_duration,_votingThreshold);
            emit create(_campaignTitle,_duration,_votingThreshold);
        } else {

            (Id, voterAddress) = abi.decode(callData,(string,address));
            registerVoter(voterAddress);
            emit register(voterAddress);

        }

    }

    function registerVoter(address voter) public {

        require(!voters[voter].registered, "Already registered");

        voters[msg.sender] = Voter({
            registered: true,
            registeredAt: block.timestamp
        });

        emit VoterRegistered(voter, block.timestamp);
    }

    function createCampaign(
        string memory _title,
        uint256 _duration,
        uint256 _votingThreshold
    ) public {

        uint256 startTime = block.timestamp;
        uint256 endTime = startTime + _duration;

        campaignCount++;

        campaigns[campaignCount] = Campaign({
            title: _title,
            startTime: startTime,
            endTime: endTime,
            votingThreshold: _votingThreshold,
            yesVotes: 0,
            noVotes: 0,
            exists: true
        });

        emit CampaignCreated(campaignCount, startTime, endTime);
    }

    function canVote(address _voter, uint256 _campaignId)
        public
        view
        campaignExists(_campaignId)
        returns (bool)
    {
        Campaign memory c = campaigns[_campaignId];
        Voter memory v = voters[_voter];

        if (!v.registered) return false;

        if (block.timestamp > c.endTime) return false;

        if (block.timestamp - v.registeredAt < c.votingThreshold) {
            return false;
        }   

        if (hasVoted[_campaignId][_voter]) return false;

        return true;
    }

    function vote(address voterAddress, uint256 _campaignId, uint8 _vote)
        public
        campaignExists(_campaignId)
    {
        require(_vote == 0 || _vote == 1, "Vote must be 0 or 1");
        require(canVote(voterAddress, _campaignId), "Not eligible");

        Campaign storage c = campaigns[_campaignId];

        if (_vote == 1) {
            c.yesVotes++;
        } else {
            c.noVotes++;
        }

        hasVoted[_campaignId][voterAddress] = true;

        emit VoteCast(voterAddress, _campaignId, _vote);
    }

    function getResults(uint256 _campaignId)
        external
        view
        returns (uint256 yesVotes, uint256 noVotes)
    {
        Campaign memory c = campaigns[_campaignId];
        return (c.yesVotes, c.noVotes);
    }

}