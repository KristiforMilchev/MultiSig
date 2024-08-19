// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "./OwnerVote.sol";

struct Proposal {
    uint256 id;
    address newOwner;
    uint256 timestamp;
    OwnerVote[] votes;
}
