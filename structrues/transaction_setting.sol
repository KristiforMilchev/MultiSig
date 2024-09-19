// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

struct TransactionSettings {
    bool isMaxDailyTransactionsEnabled;
    uint256 maxDailyTransactions;
    bool isMaxTransactionAmountEnabled;
    uint256 maxTransactionAmountUSD;
}
