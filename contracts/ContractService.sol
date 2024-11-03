// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "./../interfaces/AggregatorV3.sol";
import "./../interfaces/IPriceFeed.sol";
import "../interfaces/TokenPairV2.sol";
import "../interfaces/V2Factory.sol";
import "../structrues/factory.sol";
import "../interfaces/IERC20.sol";
import "../structrues/SmartContractToken.sol";
import "../interfaces/IOwnerManager.sol";

contract ContractService {
    mapping(string => Factory) public factories;
    IOwnerManager ownerManager;
    SmartContractToken[] private whitelistedERC20;
    address[] private whitelistedERC721;
    error FactoryDoesNotExist(string name);

    constructor(
        address _factory,
        address _networkWrappedToken,
        address _ownerManager,
        string memory _defaultFactoryName,
        SmartContractToken[] memory erc20,
        address[] memory nfts
    ) {
        ownerManager = IOwnerManager(_ownerManager);
        factories[_defaultFactoryName] = Factory({
            at: _factory,
            wth: _networkWrappedToken
        });

        for (uint256 i = 0; i < erc20.length; i++) {
            whitelistedERC20.push(erc20[i]);
        }
        whitelistedERC721 = nfts;
    }

    function getERC20()
        external
        view
        onlyOwner
        returns (SmartContractToken[] memory)
    {
        return whitelistedERC20;
    }

    function addWhitelistedERC20(
        address tokenAddress,
        int decimals
    ) public onlyOwner returns (bool) {
        require(!isTokenWhitelisted(tokenAddress), "Token already whitelisted");
        SmartContractToken memory newToken = SmartContractToken({
            contractAddress: tokenAddress,
            decimals: decimals
        });

        whitelistedERC20.push(newToken);

        return true;
    }

    function isTokenWhitelisted(
        address tokenAddress
    ) internal view returns (bool) {
        for (uint256 i = 0; i < whitelistedERC20.length; i++) {
            if (whitelistedERC20[i].contractAddress == tokenAddress) {
                return true;
            }
        }
        return false;
    }

    function getERC721() external view onlyOwner returns (address[] memory) {
        return whitelistedERC721;
    }

    function addWhitelistedERC721(
        address tokenAddress
    ) public onlyOwner returns (bool) {
        require(
            !isERC721TokenWhitelisted(tokenAddress),
            "Token already whitelisted"
        );

        whitelistedERC721.push(tokenAddress);

        return true;
    }

    function isERC721TokenWhitelisted(
        address tokenAddress
    ) internal view returns (bool) {
        for (uint256 i = 0; i < whitelistedERC721.length; i++) {
            if (whitelistedERC721[i] == tokenAddress) {
                return true;
            }
        }
        return false;
    }

    function getPairForTokens(
        address tokenA,
        string memory _name
    ) public view onlyOwner returns (address) {
        if (factories[_name].at == address(0)) {
            revert FactoryDoesNotExist(_name);
        }

        Factory storage currentFactory = factories[_name];
        IV2Factory factory = IV2Factory(currentFactory.at);
        return factory.getPair(tokenA, currentFactory.wth);
    }

    modifier onlyOwner() {
        bool isOwner = false;
        address[] memory owners = ownerManager.getOwners();
        for (uint256 i = 0; i < owners.length; i++) {
            if (owners[i] == msg.sender) {
                isOwner = true;
                break;
            }
        }
        require(isOwner, "Not authorized");
        _;
    }
}
