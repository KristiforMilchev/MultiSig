// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "../structrues/SettingProposal.sol";

interface ILedgerSettings {
    function getSettingProposalById(
        uint256 id
    ) external view returns (SettingsProposal memory);
    function getIsMaxDailyTransactionEnabled() external view returns (bool);
    function getMaxDailyTransactions() external view returns (uint256);
    function getIsMaxTransactionAmountEnabled() external view returns (bool);
    function getMaxDailyTransactionAmount() external view returns (uint256);

    function proposeSettingsChange(
        uint256 newMaxDailyTransactions,
        uint256 newMaxTransactionAmountUSD,
        bool newIsMaxDailyTransactionsEnabled,
        bool newIsMaxTransactionAmountEnabled
    ) external returns (uint256 proposalId);

    function approveSettingsChange(uint256 proposalId) external returns (bool);
}
