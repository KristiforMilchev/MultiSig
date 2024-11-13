// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "../structrues/verification_result.sol";

interface IVerificationService {
    function verifyContract(
        address currentContract
    ) external view returns (VerificationResult memory);
}
