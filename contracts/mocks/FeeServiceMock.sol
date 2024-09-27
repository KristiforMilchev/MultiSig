// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

contract FeeServiceMock {
    uint256 private feeInUsd;
    address private taxAddress;

    constructor() {}

    function getFeeInEthAndUsd()
        public
        pure
        returns (uint256 feeInWei, uint256 feeInUsdValue)
    {
        return (90000000000, 100);
    }
}
