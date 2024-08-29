// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

struct SettingsProposal {
    uint256 maxDailyTransactions;
    uint256 maxTransactionAmountUSD;
    bool isMaxDailyTransactionsEnabled;
    bool isMaxTransactionAmountEnabled;
    address[] approvals;
    bool executed;
}
