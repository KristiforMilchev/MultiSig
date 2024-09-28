// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

contract MockERC721 {
    string public name;
    string public symbol;
    mapping(address => uint256) private nfts;

    constructor(string memory _name, string memory _symbol) {
        name = _name;
        symbol = _symbol;
    }

    function mint(address where, uint256 tokenId) public returns (bool) {
        nfts[where] = 1;
        return true;
    }

    function ownerOf(uint256 tokenId) public view returns (address) {
        return msg.sender;
    }

    function safeTransferFrom(
        address from,
        address to,
        uint256 token
    ) public returns (bool) {
        return true;
    }
}
