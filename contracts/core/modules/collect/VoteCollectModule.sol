// SPDX-License-Identifier: AGPL-3.0-only

pragma solidity 0.8.10;

import {ICollectModule} from '../../../interfaces/ICollectModule.sol';
import {ModuleBase} from '../ModuleBase.sol';

struct Vote {
    uint8 voteValue;
    bytes32 voteHash;
    uint256 timestamp;
}

struct ProfilePublicationData {
    mapping(address => Vote) voteByCollector;
    address[] votersAddresses;
    uint8 maxVoteNum;
}

contract VoteCollectModule is ICollectModule, ModuleBase {
    error VoteOverMax();
    error AlreadyVoted();

    event Voted(uint256 indexed profileId, uint256 indexed pubId, address collector, uint8 voteValue, uint256 timestamp);

    mapping(uint256 => mapping(uint256 => ProfilePublicationData))
        internal _dataByPublicationByProfile;

    constructor(address hub) ModuleBase(hub) {}

    function initializePublicationCollectModule(
        uint256 profileId,
        uint256 pubId,
        bytes calldata data
    ) external override onlyHub returns (bytes memory) {
        uint8 maxVoteNum = abi.decode(data, (uint8));
        _dataByPublicationByProfile[profileId][pubId].maxVoteNum = maxVoteNum;
        return abi.encode(profileId, pubId, maxVoteNum);
    }

    function processCollect(
        uint256 referrerProfileId,
        address collector,
        uint256 profileId,
        uint256 pubId,
        bytes calldata data
    ) external override onlyHub {
        (uint8 voteValue, string memory voteText) = abi.decode(data, (uint8, string));

        if (voteValue > _dataByPublicationByProfile[profileId][pubId].maxVoteNum) {
            revert VoteOverMax();
        }

        if(_dataByPublicationByProfile[profileId][pubId].voteByCollector[collector].timestamp > 0) {
            revert AlreadyVoted();
        } 

        _dataByPublicationByProfile[profileId][pubId].votersAddresses.push(collector);
        _dataByPublicationByProfile[profileId][pubId].voteByCollector[collector].voteValue = voteValue;
        _dataByPublicationByProfile[profileId][pubId].voteByCollector[collector].voteHash = keccak256(abi.encodePacked(voteText));
        _dataByPublicationByProfile[profileId][pubId].voteByCollector[collector].timestamp = block.timestamp;

        emit Voted(profileId, pubId, collector, voteValue, block.timestamp);
    }

    function getVoteForAddress(
        uint256 profileId,
        uint256 pubId,
        address collector
    ) external view returns (uint8) {
        return _dataByPublicationByProfile[profileId][pubId].voteByCollector[collector].voteValue;
    }

    function getVoteHashForAddress(
        uint256 profileId,
        uint256 pubId,
        address collector
    ) external view returns (bytes32) {
        return _dataByPublicationByProfile[profileId][pubId].voteByCollector[collector].voteHash;
    }

    function getVoteCount(
        uint256 profileId,
        uint256 pubId
    ) external view returns (uint256) {
        return _dataByPublicationByProfile[profileId][pubId].votersAddresses.length;
    }

    function getMaxVote(
        uint256 profileId,
        uint256 pubId
    ) external view returns (uint8) {
        return _dataByPublicationByProfile[profileId][pubId].maxVoteNum;
    }

    function getVotes(
        uint256 profileId,
        uint256 pubId,
        uint16 page,
        uint16 votesPerPage
    ) external view returns (Vote[] memory) {
          uint voteCount = _dataByPublicationByProfile[profileId][pubId].votersAddresses.length;
          uint start = (page - 1) * votesPerPage;
          uint end = start + votesPerPage;
          end = end > voteCount ? voteCount : end;
          Vote[] memory votes = new Vote[](end - start);
          address[] storage votersIndecies =  _dataByPublicationByProfile[profileId][pubId].votersAddresses;
          for (uint i = start; i < end; i++) {
            Vote storage vote = _dataByPublicationByProfile[profileId][pubId].voteByCollector[votersIndecies[i]]; 
            votes[i-start] = vote;
          }
      return votes;
    }
    
}
