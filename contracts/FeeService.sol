// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "./../interfaces/AggregatorV3.sol";

contract FeeService {
    AggregatorV3Interface internal priceFeed; // Declare priceFeed interface
    uint256 private feeModifier;
    address private taxAddress;
    mapping(address => bool) public tokenExists;

    constructor(address _priceFeed, address _taxAddress, uint256 _fee) {
        priceFeed = AggregatorV3Interface(_priceFeed);
        feeModifier = _fee;
        _taxAddress = taxAddress;
    }

    function getRegistrationFee() public view returns (uint256) {
        int price = getLatestPrice();
        require(price > 0, "Invalid price from price feed");

        uint256 priceInUsd = uint256(price);
        uint256 weiPerUsd = (1 * 10 ** 18) / priceInUsd;

        return weiPerUsd;
    }

    function getLatestPrice() private view returns (int) {
        (, int price, , , ) = priceFeed.latestRoundData();
        return price;
    }

    function tokenRegistrationFee() public view returns (uint256) {
        return getRegistrationFee() * feeModifier;
    }

    function changeTax(uint256 tax) public payable onlyOwner returns (bool) {
        feeModifier = tax;
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
