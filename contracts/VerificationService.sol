// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "../interfaces/IOwnerManager.sol";
import "../interfaces/ILedger.sol";
import "../interfaces/ILedgerSettings.sol";
import "../interfaces/IPriceFeed.sol";
import "../interfaces/IOwnerManager.sol";

contract VerificationService {
    bytes32 private ledgerHash;
    bytes32 private ownerServiceHash;
    bytes32 private ledgerSettingsHash;
    bytes32 private contractManagerHash;
    bytes32 private feedHash;

    constructor(
        bytes32 _ledgerHash,
        bytes32 _ownerServiceHash,
        bytes32 _ledgerSettingsHash,
        bytes32 _contractManagerHash,
        bytes32 _feedHash
    ) {
        ledgerHash = _ledgerHash;
        ownerServiceHash = _ownerServiceHash;
        ledgerSettingsHash = _ledgerSettingsHash;
        contractManagerHash = _contractManagerHash;
        feedHash = _feedHash;
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
        address _contractAddr,
        bytes32 expected
    ) internal view returns (bool) {
        bytes memory b = getBytecode(_contractAddr);
        bytes32 currentHash = keccak256(b);
        return currentHash == expected;
    }

    function verifyContract(
        address currentContract
    ) external view returns (bool) {
        ILedger ledger = ILedger(currentContract);
        IPriceFeed feed = ledger.getPriceFeed();
        IOwnerManager ownerManager = ledger.getOwnerManager();
        ILedgerSettings ledgerSettins = ledger.getLedgerSettings();

        bool ledgerVerified = isContractUnaltered(address(ledger), ledgerHash);
        bool feedVerified = isContractUnaltered(address(feed), feedHash);
        bool ownerVeified = isContractUnaltered(
            address(ownerManager),
            ownerServiceHash
        );
        bool ledgerSettigsVerified = isContractUnaltered(
            address(ledgerSettins),
            ledgerSettingsHash
        );

        bool verified = ledgerVerified &&
            feedVerified &&
            ownerVeified &&
            ledgerSettigsVerified;
        return verified;
    }
}
