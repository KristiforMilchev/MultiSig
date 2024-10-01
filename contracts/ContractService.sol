// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "./../interfaces/AggregatorV3.sol";
import "./../interfaces/IPriceFeed.sol";
import "../interfaces/TokenPairV2.sol";
import "../interfaces/V2Factory.sol";
import "../structrues/factory.sol";
import "../interfaces/IERC20.sol";

contract ContractService {
    mapping(string => Factory) public factories;
    error FactoryDoesNotExist(string name);
    constructor(
        address _factory,
        address _networkWrappedToken,
        string memory _defaultFactoryName
    ) {
        factories[_defaultFactoryName] = Factory({
            at: _factory,
            wth: _networkWrappedToken
        });
    }

    function getPairForTokens(
        address tokenA,
        string memory _name
    ) public view returns (address) {
        if (factories[_name].at == address(0)) {
            revert FactoryDoesNotExist(_name);
        }

        Factory storage currentFactory = factories[_name];
        IV2Factory factory = IV2Factory(currentFactory.at);
        return factory.getPair(tokenA, currentFactory.wth);
    }

    modifier onlyOwner() {
        _;
    }
}
