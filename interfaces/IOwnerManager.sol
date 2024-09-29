// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;
import "../structrues/Proposal.sol";

interface IOwnerManger {
    function getOwners() external view returns (address[] memory);
    function getOwnerProposal(
        uint256 id
    ) external view returns (Proposal memory);
    function proposeOwner(address newOwner) external returns (bool);
    function approveOwner(uint256 proposalId) external returns (bool);
    function getRemoveOwnerProposal(
        uint256 id
    ) external view returns (Proposal memory);

    function getRemoveOwnerProposals()
        external
        view
        returns (Proposal[] memory);

    function proposeOwnerToBeRemoved(address newOwner) external returns (bool);
    function approveOwnerRemove(uint256 id) external returns (bool);
}
