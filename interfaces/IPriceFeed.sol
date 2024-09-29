// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "./../interfaces/AggregatorV3.sol";
import "../interfaces/TokenPairV2.sol";
import "../interfaces/V2Factory.sol";
import "../structrues/factory.sol";

interface IPriceFeed {
    function getLatestPrice() external view returns (int);
    function getFeeInEthAndUsd()
        external
        view
        returns (uint256 feeInWei, uint256 feeInUsdValue);

    function getPairForTokens(
        address tokenA,
        string memory _name
    ) external view returns (address);
    function convertUsdToWei(uint256 usdAmount) external view returns (uint256);

    function convertUsdToTokenWei(
        address token,
        uint256 usdAmount,
        string memory factory
    ) external view returns (uint256);

    function convertWeiToUsd(
        uint256 amountInWei
    ) external view returns (uint256);

    function convertTokenToUsd(
        address token,
        uint256 amount,
        string memory factory
    ) external view returns (uint256);

    function changeTax(uint256 newFeeInUsd) external returns (bool);
}
