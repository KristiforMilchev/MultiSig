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
    bytes32 public originalBytecodeHash;
    address[] private contracts;
    event EmptyBalance();
    event BalanceTrasfered(uint256 balance);
    event LedgerCreated(address indexed ledgerAddress);

    constructor(
        address _feeService,
        address _priceFeed,
        address _factory,
        address _netowrkWrappedToken,
        string memory _defaultFactoryName,
        bytes32 _originalHash
    ) {
        owner = msg.sender;
        feeService = IFeeService(_feeService);
        priceFeed = _priceFeed;
        factory = _factory;
        netowrkWrappedToken = _netowrkWrappedToken;
        defaultFactoryName = _defaultFactoryName;
        originalBytecodeHash = _originalHash;
    }

    function getBytecode(
        address _contractAddr
    ) internal view returns (bytes memory) {
        uint256 size;
        assembly {
            size := extcodesize(_contractAddr)
        }

        bytes memory code = new bytes(size);
        assembly {
            extcodecopy(_contractAddr, add(code, 0x20), 0, size)
        }
        return code;
    }

    function isContractUnaltered(
        address _contractAddr
    ) public view returns (bool) {
        bytes memory b = getBytecode(_contractAddr);
        bytes32 currentHash = keccak256(b);
        return currentHash == originalBytecodeHash;
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
        PaymentLedger ms = new PaymentLedger(
            _name,
            ownerManager,
            ledgerSetting,
            contractManager,
            priceFeed
        );
        bool verified = isContractUnaltered(address(ms));
        if (verified) {
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
