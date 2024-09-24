// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "./PaymentLedger.sol";
import "../structrues/SmartContractToken.sol";
import "../structrues/transaction_setting.sol";

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
        address[] memory _owners,
        SmartContractToken[] memory whitelistedERC20,
        address[] memory whitelistedERC721,
        bool _isMaxDailyTransactionsEnabled,
        uint256 _maxDailyTransactions,
        bool _isMaxTransactionAmountEnabled,
        uint256 _maxTransactionAmountUSD
    ) public payable returns (address) {
        (uint256 feeInWei, ) = feeService.getFeeInEthAndUsd();
        require(msg.value >= feeInWei, "Insufficient registration fee");

        TransactionSettings memory trSetting = TransactionSettings({
            isMaxDailyTransactionsEnabled: _isMaxDailyTransactionsEnabled,
            maxDailyTransactions: _maxDailyTransactions,
            isMaxTransactionAmountEnabled: _isMaxTransactionAmountEnabled,
            maxTransactionAmountUSD: _maxTransactionAmountUSD
        });
        PaymentLedger ms = new PaymentLedger(
            _name,
            _owners,
            whitelistedERC20,
            whitelistedERC721,
            trSetting,
            priceFeed,
            netowrkWrappedToken,
            factory,
            defaultFactoryName
        );

        emit LedgerCreated(address(ms));
        return address(ms);
    }

    function withdraw() public onlyOwner {
        payable(owner).transfer(address(this).balance);
    }

    modifier onlyOwner() {
        require(msg.sender == owner, "Not authorized");
        _;
    }
}
