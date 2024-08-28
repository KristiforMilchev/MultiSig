// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "./../interfaces/AggregatorV3.sol";

contract FeeService {
    AggregatorV3Interface internal priceFeed;
    uint256 private feeInUsd;
    address private taxAddress;

    constructor(address _priceFeed, address _taxAddress, uint256 _feeInUsd) {
        priceFeed = AggregatorV3Interface(_priceFeed);
        feeInUsd = _feeInUsd;
        taxAddress = _taxAddress;
    }

    function getLatestPrice() private view returns (int) {
        (, int price, , , ) = priceFeed.latestRoundData();
        return price;
    }

    function getFeeInEthAndUsd()
        public
        view
        returns (uint256 feeInWei, uint256 feeInUsdValue)
    {
        int price = getLatestPrice();
        require(price > 0, "Invalid price from price feed");

        uint256 priceInUsd = uint256(price);
        uint256 weiPerUsd = (1 * 10 ** 18) / priceInUsd;
        feeInWei = feeInUsd * weiPerUsd;
        feeInUsdValue = feeInUsd * 1e18;
        return (feeInWei, feeInUsdValue);
    }

    function changeTax(
        uint256 newFeeInUsd
    ) public payable onlyOwner returns (bool) {
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
