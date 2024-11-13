// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "./PaymentLedger.sol";
import "../interfaces/IOwnerManager.sol";
import "../structrues/SmartContractToken.sol";
import "../structrues/transaction_setting.sol";
import "../interfaces/ILedgerSettings.sol";
import "../structrues/verification_result.sol";
import "../interfaces/IVerificationService.sol";

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
    address private verificationService;
    string private defaultFactoryName;
    IFeeService private feeService;
    address[] private contracts;
    event EmptyBalance();
    event BalanceTrasfered(uint256 balance);
    event LedgerCreated(address indexed ledgerAddress);

    constructor(
        address _feeService,
        address _priceFeed,
        address _factory,
        address _netowrkWrappedToken,
        address _verificationService,
        string memory _defaultFactoryName
    ) {
        owner = msg.sender;
        feeService = IFeeService(_feeService);
        priceFeed = _priceFeed;
        factory = _factory;
        netowrkWrappedToken = _netowrkWrappedToken;
        defaultFactoryName = _defaultFactoryName;
        verificationService = _verificationService;
    }

    function createLedger(
        string memory _name,
        address ownerManager,
        address ledgerSetting,
        address contractManager
    ) public payable returns (address) {
        (uint256 feeInWei, ) = feeService.getFeeInEthAndUsd();
        require(msg.value >= feeInWei, "Insufficient registration fee");
        IOwnerManager _onwerManager = IOwnerManager(ownerManager);
        address[] memory owners = _onwerManager.getOwners();
        require(owners.length > 0, "Least one administrator should be present");
        PaymentLedger ms = new PaymentLedger();
        ms.init(_name, ownerManager, ledgerSetting, contractManager, priceFeed);
        IVerificationService v = IVerificationService(verificationService);

        VerificationResult memory verified = v.verifyContract(address(ms));
        if (verified.result) {
            contracts.push(address(ms));
        }

        emit LedgerCreated(address(ms));
        return address(ms);
    }

    function contractVerified(
        address currentContract
    ) external view returns (bool) {
        for (uint i = 0; i < contracts.length; i++) {
            address c = contracts[i];
            if (c == currentContract) {
                return true;
            }
        }

        return false;
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
