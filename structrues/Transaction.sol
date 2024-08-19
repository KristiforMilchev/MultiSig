// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "./OwnerVote.sol";

struct Transaction {
    uint256 amount;
    address to;
    bytes32 hash;
    OwnerVote[] approval;
    bool state;
    address token;
}
