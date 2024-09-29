// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "./PaymentLedger.sol";
import "../interfaces/IOwnerManager.sol";
import "../structrues/SmartContractToken.sol";
import "../structrues/transaction_setting.sol";
import "../interfaces/ILedgerSettings.sol";

interface IFeeService {
    function getFeeInEthAndUsd()
        external
        view
        returns (uint256 feeInWei, uint256 feeInUsdValue);
}

contract DeploymentFactory {
    address private owner;
    address private priceFeed;
    address private netowrkWrappedToken;
    address private factory;
    string private defaultFactoryName;
    IFeeService private feeService;

    event EmptyBalance();
    event BalanceTrasfered(uint256 balance);
    event LedgerCreated(address indexed ledgerAddress);

    constructor(
        address _feeService,
        address _priceFeed,
        address _factory,
        address _netowrkWrappedToken,
        string memory _defaultFactoryName
    ) {
        owner = msg.sender;
        feeService = IFeeService(_feeService);
        priceFeed = _priceFeed;
        factory = _factory;
        netowrkWrappedToken = _netowrkWrappedToken;
        defaultFactoryName = _defaultFactoryName;
    }

    function createLedger(
        string memory _name,
        address ownerManager,
        address ledgerSetting,
        SmartContractToken[] memory whitelistedERC20,
        address[] memory whitelistedERC721
    ) public payable returns (address) {
        (uint256 feeInWei, ) = feeService.getFeeInEthAndUsd();
        require(msg.value >= feeInWei, "Insufficient registration fee");
        IOwnerManger _onwerManager = IOwnerManger(ownerManager);
        address[] memory owners = _onwerManager.getOwners();
        require(owners.length > 0, "Least one administrator should be present");

        PaymentLedger ms = new PaymentLedger(
            _name,
            ownerManager,
            ledgerSetting,
            whitelistedERC20,
            whitelistedERC721,
            priceFeed,
            netowrkWrappedToken,
            factory,
            defaultFactoryName
        );

        emit LedgerCreated(address(ms));
        return address(ms);
    }

    function withdraw() public onlyOwner {
        if (address(this).balance == 0) {
            emit EmptyBalance();
            return;
        }
        uint256 currentBalance = address(this).balance;
        payable(owner).transfer(currentBalance);
        emit BalanceTrasfered(currentBalance);
    }

    modifier onlyOwner() {
        require(msg.sender == owner, "Not authorized");
        _;
    }
}
