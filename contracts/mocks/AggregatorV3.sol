// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "./../../interfaces/AggregatorV3.sol";

contract AggregatorV3 is AggregatorV3Interface {


    function decimals() external pure override returns (uint8) {
        return 18;
    }

    function description() external pure override returns (string memory) {
        return "Internal Mock"; // Missing semicolon added here
    }

    function version() external pure override returns (uint256) {
        return 1;
    }

    function getRoundData(
        uint80 _roundId
    )
        external
        pure
        override
        returns (
            uint80 roundId,
            int256 answer,
            uint256 startedAt,
            uint256 updatedAt,
            uint80 answeredInRound
        )
    {

        return (_roundId, 2, 2222, 222, 3); // Missing semicolon added here
    }

    function latestRoundData()
        external
        pure
        override
        returns (
            uint80 roundId,
            int256 answer,
            uint256 startedAt,
            uint256 updatedAt,
            uint80 answeredInRound
        )
    {
        return (1, 2, 22222, 22222, 2222); // Missing semicolon added here
    }
}
