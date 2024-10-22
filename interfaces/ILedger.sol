// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "../interfaces/IPriceFeed.sol";
import "../interfaces/IOwnerManager.sol";
import "../interfaces/ILedgerSettings.sol";
import "../structrues/Transaction.sol";
import "../structrues/SettingProposal.sol";

interface ILedger {
    event Received(address indexed sender, uint256 amount);

    function getPriceFeed() external view returns (IPriceFeed);

    function getOwnerManager() external view returns (IOwnerManager);

    function getLedgerSettings() external view returns (ILedgerSettings);

    function getName() external view returns (string memory);

    function getTransactionHistory()
        external
        view
        returns (Transaction[] memory);

    function getTransactionById(
        uint256 transactionId
    ) external view returns (Transaction memory);

    function getNftTransactionById(
        uint256 nftTransactionId
    ) external view returns (Transaction memory);

    function getBalance() external view returns (uint256);

    function getOustandingDailyLimit() external view returns (uint256);

    function proposePayment(
        uint256 amount,
        address to,
        address token
    ) external returns (bool);

    function approvePayment(uint256 _nonce) external returns (bool);

    function proposeNftTransfer(
        address nftContract,
        address to,
        uint256 tokenId
    ) external returns (bool);

    function approveNftTransfer(uint256 _nonce) external returns (bool);

    function getBalanceInUSD() external view returns (uint256);
}
