// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

contract MockERC721 {
    string public name;
    string public symbol;
    constructor(string memory _name, string memory _symbol) {
        name = _name;
        symbol = _symbol;
    }
}
