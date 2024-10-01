// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "./../interfaces/AggregatorV3.sol";
import "./../interfaces/IPriceFeed.sol";
import "../interfaces/TokenPairV2.sol";
import "../interfaces/V2Factory.sol";
import "../structrues/factory.sol";
import "../interfaces/IERC20.sol";

contract FeeService is IPriceFeed {
    AggregatorV3Interface internal priceFeed;
    uint256 private feeInUsd;
    address private taxAddress;
    constructor(address _priceFeed, address _taxAddress, uint256 _feeInUsd) {
        priceFeed = AggregatorV3Interface(_priceFeed);
        feeInUsd = _feeInUsd;
        taxAddress = _taxAddress;
    }

    function getFeeInEthAndUsd()
        external
        view
        returns (uint256 feeInWei, uint256 feeInUsdValue)
    {
        (, int price, , , ) = priceFeed.latestRoundData();
        require(price > 0, "Invalid price from price feed");

        uint256 priceInUsd = uint256(price);
        uint256 weiPerUsd = (1 * 10 ** 18) / priceInUsd;
        feeInWei = feeInUsd * weiPerUsd;
        feeInUsdValue = feeInUsd * 1e18;
        return (feeInWei, feeInUsdValue);
    }

    function getLatestPrice() external view returns (int) {
        (, int price, , , ) = priceFeed.latestRoundData();
        return price;
    }

    function convertUsdToWei(uint256 usdAmount) public view returns (uint256) {
        (, int ethToUsdPrice, , , ) = priceFeed.latestRoundData();

        require(ethToUsdPrice > 0, "Invalid ETH/USD price");

        uint256 etherAmount = (usdAmount * 1e18) / uint256(ethToUsdPrice);

        return etherAmount;
    }

    function convertWeiToUsd(
        uint256 amountInWei
    ) public view returns (uint256) {
        (, int ethToUsdPrice, , , ) = priceFeed.latestRoundData();

        require(ethToUsdPrice > 0, "Invalid ETH/USD price");
        return (amountInWei * uint256(ethToUsdPrice)) / 1e18;
    }

    function changeTax(uint256 newFeeInUsd) external onlyOwner returns (bool) {
        feeInUsd = newFeeInUsd;
        return true;
    }

    function withdraw() public onlyOwner {
        payable(taxAddress).transfer(address(this).balance);
    }

    modifier onlyOwner() {
        require(msg.sender == taxAddress, "Not authorized");
        _;
    }
}
