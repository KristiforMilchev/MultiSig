// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "../structrues/Proposal.sol";

contract OwnerManager {
    uint256 private proposalCounter = 0;
    uint256 private removeProposalCounter = 0;
    address[] private owners;

    Proposal[] private addOwnerProposals;
    Proposal[] private removeOwnerProposals;
    event OwnerProposed(uint256 id);

    constructor(address[] memory _owners) {
        require(_owners.length > 0, "Owners required");
        owners = _owners;
    }

    function getOwners() public view returns (address[] memory) {
        return owners;
    }

    function proposeOwner(address newOwner) public onlyOwner returns (bool) {
        for (uint256 i = 0; i < owners.length; i++) {
            if (owners[i] == newOwner) {
                revert("Address is already an owner");
            }
        }

        Proposal storage newProposal = addOwnerProposals.push();
        newProposal.id = proposalCounter;
        newProposal.newOwner = newOwner;
        newProposal.timestamp = block.timestamp;
        newProposal.votes.push(OwnerVote({owner: msg.sender, vote: true}));
        emit OwnerProposed(proposalCounter);
        proposalCounter++;
        return true;
    }

    function getOwnerProposal(
        uint256 id
    ) external view onlyOwner returns (Proposal memory) {
        require(id < addOwnerProposals.length, "Proposal does not exist");
        return addOwnerProposals[id];
    }

    function approveOwner(uint256 proposalId) public onlyOwner returns (bool) {
        bool proposalFound = false;
        uint256 proposalIndex;
        for (uint256 i = 0; i < addOwnerProposals.length; i++) {
            if (addOwnerProposals[i].id == proposalId) {
                proposalFound = true;
                proposalIndex = i;
                break;
            }
        }
        require(proposalFound, "Proposal not found");

        Proposal storage proposal = addOwnerProposals[proposalIndex];

        for (uint256 i = 0; i < proposal.votes.length; i++) {
            require(
                proposal.votes[i].owner != msg.sender,
                "Owner has already voted"
            );
        }

        proposal.votes.push(OwnerVote({owner: msg.sender, vote: true}));

        if (proposal.votes.length == owners.length) {
            owners.push(proposal.newOwner);
        }

        return true;
    }

    function getRemoveOwnerProposal(
        uint256 id
    ) external view onlyOwner returns (Proposal memory) {
        require(id < removeOwnerProposals.length, "Proposal does not exist");

        return removeOwnerProposals[id];
    }

    function getRemoveOwnerProposals()
        external
        view
        onlyOwner
        returns (Proposal[] memory)
    {
        return removeOwnerProposals;
    }

    function proposeOwnerToBeRemoved(
        address newOwner
    ) public onlyOwner returns (bool) {
        Proposal storage newProposal = removeOwnerProposals.push();
        newProposal.id = removeProposalCounter;
        newProposal.newOwner = newOwner;
        newProposal.timestamp = block.timestamp;
        newProposal.votes.push(OwnerVote({owner: msg.sender, vote: true}));
        emit OwnerProposed(removeProposalCounter);
        removeProposalCounter++;

        return true;
    }

    function approveOwnerRemove(uint256 id) public onlyOwner returns (bool) {
        bool proposalFound = false;
        uint256 proposalIndex;
        for (uint256 i = 0; i < removeOwnerProposals.length; i++) {
            if (removeOwnerProposals[i].id == id) {
                proposalFound = true;
                proposalIndex = i;
                break;
            }
        }
        require(proposalFound, "Proposal not found");
        Proposal storage proposal = removeOwnerProposals[proposalIndex];
        require(
            msg.sender != proposal.newOwner,
            "Request denied, can't vote for your own removal!"
        );

        for (uint256 i = 0; i < proposal.votes.length; i++) {
            require(
                proposal.votes[i].owner != msg.sender,
                "Owner has already voted"
            );
        }

        proposal.votes.push(OwnerVote({owner: msg.sender, vote: true}));
        if (proposal.votes.length == owners.length - 1) {
            uint256 ownerIndex;

            for (uint256 i = 0; i < owners.length; i++) {
                if (owners[i] == proposal.newOwner) {
                    ownerIndex += i;
                }
            }

            require(owners.length > 1, "Cannot remove the last owner");

            owners[ownerIndex] = owners[owners.length - 1];
            owners.pop();
        }

        return true;
    }

    modifier onlyOwner() {
        bool isOwner = false;
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
