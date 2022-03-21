// SPDX-License-Identifier: AGPL-3.0-only

pragma solidity 0.8.10;

import {ICollectModule} from '../../../interfaces/ICollectModule.sol';
import {ModuleBase} from '../ModuleBase.sol';

struct Vote {
    uint8 voteValue;
    uint256 timestamp;
}

struct ProfilePublicationData {
    mapping(address => Vote) voteByCollector;
    uint8 maxVoteNum;
}

contract VoteCollectModule is ICollectModule, ModuleBase {
    error VoteOverMax();
    error AlreadyVoted();

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
        return data;
    }

    function processCollect(
        uint256 referrerProfileId,
        address collector,
        uint256 profileId,
        uint256 pubId,
        bytes calldata data
    ) external override onlyHub {
        (uint8 voteValue) = abi.decode(data, (uint8));

        if (voteValue > _dataByPublicationByProfile[profileId][pubId].maxVoteNum) {
            revert VoteOverMax();
        }

        if(_dataByPublicationByProfile[profileId][pubId].voteByCollector[collector].timestamp > 0) {
            revert AlreadyVoted();
        } 

        _dataByPublicationByProfile[profileId][pubId].voteByCollector[collector].voteValue = voteValue;
        _dataByPublicationByProfile[profileId][pubId].voteByCollector[collector].timestamp = block.timestamp;
    }
}
