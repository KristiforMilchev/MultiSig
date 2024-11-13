// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

struct VerificationResult {
    bool result;
    bytes32 ledgerVerifiedProvided;
    bytes32 ledgerVerifiedExpected;
    bytes32 feedVerifiedProvided;
    bytes32 feedVerifiedExpected;
    bytes32 ownerVeifiedProvided;
    bytes32 ownerVeifiedExpected;
    bytes32 ledgerSettigsVerifiedProvided;
    bytes32 ledgerSettigsVerifiedExpected;
}
