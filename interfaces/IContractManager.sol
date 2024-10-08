// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "../structrues/SmartContractToken.sol";
import "../structrues/SettingProposal.sol";

interface IContractManager {
    function getERC20() external view returns (SmartContractToken[] memory);

    function addWhitelistedERC20(
        address tokenAddress,
        int decimals
    ) external returns (bool);

    function getERC721() external view returns (address[] memory);

    function addWhitelistedERC721(address tokenAddress) external returns (bool);

    function getPairForTokens(
        address tokenA,
        string memory _name
    ) external view returns (address);
}
