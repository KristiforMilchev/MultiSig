// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;
import "../structrues/SettingProposal.sol";
import "../interfaces/IOwnerManager.sol";

contract LedgerSettings {
    mapping(uint256 => SettingsProposal) public settingsProposals;
    uint256 private settingsProposalNonce = 0;
    uint256 public maxDailyTransactions = 5;
    bool public isMaxDailyTransactionsEnabled = true;
    uint256 public maxTransactionAmountUSD = 10000;
    bool public isMaxTransactionAmountEnabled = true;
    IOwnerManger private ownerManager;
    event SettingProposed(uint256 id);

    constructor(
        address _ownerManager,
        bool _isMaxDailyTransactionsEnabled,
        uint256 _maxDailyTransactions,
        bool _isMaxTransactionAmountEnabled,
        uint256 _maxTransactionAmountUSD
    ) {
        ownerManager = IOwnerManger(_ownerManager);
        isMaxDailyTransactionsEnabled = _isMaxDailyTransactionsEnabled;
        maxDailyTransactions = _maxDailyTransactions;
        isMaxDailyTransactionsEnabled = _isMaxTransactionAmountEnabled;
        maxTransactionAmountUSD = _maxTransactionAmountUSD;
    }

    function getSettingProposalById(
        uint256 id
    ) external view returns (SettingsProposal memory) {
        return settingsProposals[id];
    }

    function getIsMaxTransactionAmountEnabled() external view returns (bool) {
        return isMaxTransactionAmountEnabled;
    }

    function getIsMaxDailyTransactionEnabled() external view returns (bool) {
        return isMaxDailyTransactionsEnabled;
    }

    function getMaxDailyTransactions() external view returns (uint256) {
        return maxDailyTransactions;
    }

    function getMaxDailyTransactionAmount() external view returns (uint256) {
        return maxTransactionAmountUSD;
    }

    function proposeSettingsChange(
        uint256 newMaxDailyTransactions,
        uint256 newMaxTransactionAmountUSD,
        bool newIsMaxDailyTransactionsEnabled,
        bool newIsMaxTransactionAmountEnabled
    ) public onlyOwner returns (uint256 proposalId) {
        settingsProposalNonce++;
        proposalId = settingsProposalNonce;
        SettingsProposal storage proposal = settingsProposals[proposalId];
        proposal.maxDailyTransactions = newMaxDailyTransactions;
        proposal.maxTransactionAmountUSD = newMaxTransactionAmountUSD;
        proposal
            .isMaxDailyTransactionsEnabled = newIsMaxDailyTransactionsEnabled;
        proposal
            .isMaxTransactionAmountEnabled = newIsMaxTransactionAmountEnabled;
        proposal.approvals.push(msg.sender);
        proposal.executed = false;
        emit SettingProposed(proposalId);
        return settingsProposalNonce;
    }

    function approveSettingsChange(
        uint256 proposalId
    ) public onlyOwner returns (bool) {
        SettingsProposal storage proposal = settingsProposals[proposalId];
        require(!proposal.executed, "Proposal already executed");

        for (uint256 i = 0; i < proposal.approvals.length; i++) {
            require(
                proposal.approvals[i] != msg.sender,
                "Owner has already approved this proposal"
            );
        }

        proposal.approvals.push(msg.sender);
        address[] memory owners = ownerManager.getOwners();
        if (proposal.approvals.length == owners.length) {
            maxDailyTransactions = proposal.maxDailyTransactions;
            maxTransactionAmountUSD = proposal.maxTransactionAmountUSD;
            isMaxDailyTransactionsEnabled = proposal
                .isMaxDailyTransactionsEnabled;
            isMaxTransactionAmountEnabled = proposal
                .isMaxTransactionAmountEnabled;

            proposal.executed = true;
            return true;
        }

        return false;
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
