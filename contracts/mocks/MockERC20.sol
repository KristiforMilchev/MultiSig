// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

contract MockERC20 {
    uint256 private decimals;
    string public name;
    string public symbol;

    constructor(string memory _name, string memory _symbol, uint256 _decimals) {
        name = _name;
        symbol = _symbol;
        decimals = _decimals;
    }
}
