// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "./LedgerSettings.sol";
import "./OwnerManager.sol";
import "./ContractService.sol";

contract DeploymentBuilder {
    address private factory;
    address private netowrkWrappedToken;
    string private defaultFactoryName;

    constructor(
        address _factory,
        address _netowrkWrappedToken,
        string memory _defaultFactoryName
    ) {
        factory = _factory;
        netowrkWrappedToken = _netowrkWrappedToken;
        defaultFactoryName = _defaultFactoryName;
    }

    event ContractServiceCreatred(address indexed contractServiceAddress);
    event LedgerSettingsCreated(address indexed ledgerSettingsAddress);
    event OwnerMangerCreated(address indexed ownerManagerAddress);

    function createContractManager(
        address onwerManager
    ) public payable returns (address) {
        ContractService cs = new ContractService(
            factory,
            netowrkWrappedToken,
            onwerManager,
            defaultFactoryName
        );

        emit ContractServiceCreatred(address(cs));
        return address(cs);
    }

    function createLedgerSettings(
        address ownerManager,
        bool maxDailyTransactionsEnabled,
        bool maxDailyAmountEnabled,
        uint256 maxDailyTransactionCount,
        uint256 maxDailyAmount
    ) public payable returns (address) {
        LedgerSettings ls = new LedgerSettings(
            ownerManager,
            maxDailyTransactionsEnabled,
            maxDailyTransactionCount,
            maxDailyAmountEnabled,
            maxDailyAmount
        );

        emit LedgerSettingsCreated(address(ls));
        return address(ls);
    }

    function createOwnerManager(
        address[] memory owners
    ) public payable returns (address) {
        OwnerManager om = new OwnerManager(owners);

        emit OwnerMangerCreated(address(om));
        return address(om);
    }
}
